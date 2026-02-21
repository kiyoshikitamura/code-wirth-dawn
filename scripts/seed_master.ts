
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use Service Role Key to bypass RLS for seeding
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_DIR = path.join(process.cwd(), 'src', 'data', 'csv');

async function seedTable(tableName: string, filePath: string, transformer: (record: any) => any) {
    if (!fs.existsSync(filePath)) {
        console.warn(`Skipping ${tableName}: File not found at ${filePath}`);
        return;
    }

    console.log(`Seeding ${tableName} from ${path.basename(filePath)}...`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true, // Handle Byte Order Mark for Windows CSVs
        relax_column_count: true, // Allow rows with different column counts (e.g. footer)
        cast: (value, context) => {
            const col = String(context.column);
            if (col === 'id' || col.endsWith('_id') || col.endsWith('_val') || col.endsWith('_price') || col === 'min_prosperity' || col === 'durability' || col === 'cover_rate' || col === 'hp' || col === 'exp' || col === 'gold' || col === 'value') {
                if (value === '') return null;
                const num = Number(value);
                return isNaN(num) ? value : num;
            }
            return value;
        }
    });

    // Filter out invalid rows (e.g. footers, comments)
    const validRecords = records.filter((r: any) => typeof r.id === 'number' && !isNaN(r.id));

    if (validRecords.length < records.length) {
        console.log(`Skipped ${records.length - validRecords.length} invalid/footer rows in ${tableName}.`);
    }

    const transformedRecords = validRecords.map(transformer);

    // Upsert batch
    // Supabase upsert requires specifying the Conflict Key (id)
    const { error } = await supabase
        .from(tableName)
        .upsert(transformedRecords, { onConflict: 'id' });

    if (error) {
        console.error(`Error seeding ${tableName}:`, error);
    } else {
        console.log(`Successfully seeded ${records.length} records to ${tableName}.`);
    }
}

async function main() {
    // 1. Cards
    await seedTable('cards', path.join(CSV_DIR, 'cards.csv'), (r: any) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        type: r.type,
        cost_type: r.cost_type,
        cost_val: r.cost_val,
        effect_val: r.effect_val
    }));

    // 2. Items
    // nation_tags is pipe separated "loc_a|loc_b" -> array
    await seedTable('items', path.join(CSV_DIR, 'items.csv'), (r: any) => {
        let itemType = r.type;
        if (itemType === 'skill_card') itemType = 'skill';

        let nationTags = r.nation_tags && typeof r.nation_tags === 'string' ? r.nation_tags.split('|') : [];
        nationTags = nationTags.map((t: string) => t === 'any' ? 'loc_all' : t);

        return {
            id: r.id,
            slug: r.slug,
            name: r.name,
            type: itemType,
            base_price: r.base_price,
            min_prosperity: r.min_prosperity,
            nation_tags: nationTags,
            linked_card_id: r.linked_card_id,
            cost: r.cost || 0
        };
    });

    // 3. NPCs (party_members)
    // inject_cards is pipe separated integers "1001|1002" -> integer array
    await seedTable('party_members', path.join(CSV_DIR, 'npcs.csv'), (r: any) => {
        let cardIds: number[] = [];
        // Handle both possible header names just in case
        const rawInject = r.inject_card_ids || r.inject_cards;
        if (rawInject && typeof rawInject === 'string') {
            cardIds = rawInject.split('|').map((id: string) => Number(id.trim())).filter((n: number) => !isNaN(n));
        }

        return {
            id: r.id,
            slug: r.slug,
            name: r.name,
            job_class: r.job || r.job_class || 'Civilian', // Map 'job' to 'job_class'
            durability: r.durability,
            max_durability: r.durability, // Ensure max is set
            def: r.def || 0, // Added v2.2
            cover_rate: r.cover_rate,
            inject_cards: cardIds,
            // Defaults for master data
            is_active: true, // Available in pool?
            owner_id: null,
            origin_type: 'system'
        };
    });

    // ... (skipping unchanged code) ...

    // --- Battle System v2.1 Importers ---

    // 3.a Enemy Skills
    await seedTable('enemy_skills', path.join(CSV_DIR, 'enemy_skills.csv'), (r: any) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        effect_type: r.effect_type,
        value: r.value,
        inject_card_id: r.inject_card_id,
        description: r.description
    }));

    // 3.b Enemies & Action Patterns
    // Need to pre-load enemy_actions to build the JSONB
    const actionsPath = path.join(CSV_DIR, 'enemy_actions.csv');
    const actionMap: Record<string, any[]> = {}; // enemy_slug -> action[]

    if (fs.existsSync(actionsPath)) {
        const fileContent = fs.readFileSync(actionsPath, 'utf-8');
        const actionRecords = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });

        // Sort by ID to ensure order? The CSV order is usually implicitly the priority order for logic
        // If 'id' exists in action records, we sort by it.
        const sortedActions = actionRecords.sort((a: any, b: any) => Number(a.id) - Number(b.id));

        sortedActions.forEach((a: any) => {
            if (!a.enemy_slug) return;
            if (!actionMap[a.enemy_slug]) actionMap[a.enemy_slug] = [];

            const action: any = {
                skill: a.skill_slug,
                prob: Number(a.prob) || 100
            };

            if (a.condition_type && a.condition_value) {
                // Combine into "TYPE:VAL" format or Object
                action.condition = `${a.condition_type}:${a.condition_value}`;
            }

            actionMap[a.enemy_slug].push(action);
        });
        console.log(`Loaded ${sortedActions.length} enemy actions.`);
    }

    await seedTable('enemies', path.join(CSV_DIR, 'enemies.csv'), (r: any) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        hp: r.hp,
        def: r.def || 0, // Added v2.2
        exp: r.exp,
        gold: r.gold,
        drop_item_id: r.drop_item_id || null, // Ensure explicit null
        action_pattern: actionMap[r.slug] || [] // Inject the built JSON
    }));

    // 3.c Enemy Groups
    await seedTable('enemy_groups', path.join(CSV_DIR, 'enemy_groups.csv'), (r: any) => {
        let members: string[] = [];
        if (r.members && typeof r.members === 'string') {
            members = r.members.split('|');
        }
        return {
            id: r.id,
            slug: r.slug,
            members: members
        };
    });

    // --- Unified CSV Scenario Importer ---
    const SCENARIO_DIR = path.join(CSV_DIR, 'scenarios');
    const allScriptData: Record<string, any> = {}; // questId -> JSON

    // Utility: Parse params string "key:val, key2:val"
    function parseParams(paramStr: string | undefined): any {
        if (!paramStr) return {};
        const obj: any = {};
        if (paramStr.trim().startsWith('{')) {
            try { return JSON.parse(paramStr); } catch (e) { console.warn("Failed to parse param JSON:", paramStr); return {}; }
        }

        paramStr.split(',').forEach(pair => {
            const [k, v] = pair.split(':');
            if (k && v) {
                const key = k.trim();
                const val = v.trim();
                const num = Number(val);
                obj[key] = isNaN(num) ? val : num;
            }
        });
        return obj;
    }

    if (fs.existsSync(SCENARIO_DIR)) {
        const files = fs.readdirSync(SCENARIO_DIR).filter(f => f.endsWith('.csv'));
        console.log(`Found ${files.length} unified scenario CSVs.`);

        for (const file of files) {
            // Extract Quest ID from filename "1001_slug.csv" -> "1001"
            const questId = file.split('_')[0];
            if (!questId || isNaN(Number(questId))) {
                console.warn(`Skipping scenario file ${file}: Invalid Quest ID prefix.`);
                continue;
            }

            const rawContent = fs.readFileSync(path.join(SCENARIO_DIR, file), 'utf-8');
            const rows: any[] = parse(rawContent, { columns: true, skip_empty_lines: true, trim: true, bom: true, relax_column_count: true });

            const script: any = { nodes: {} };
            let currentNode: any = null;

            for (const r of rows) {
                const rowType = r.row_type?.toUpperCase();
                const params = parseParams(r.params);

                if (rowType === 'NODE') {
                    const nodeId = r.node_id;
                    if (!nodeId) continue;



                    currentNode = {

                        text: r.text_label ? r.text_label.replace(/\\n/g, '\n') : '',
                        type: params.type || 'text',
                        bg_key: params.bg || params.bg_key, // Alias
                        bgm_key: params.bgm || params.bgm_key,
                        enemy_group_id: params.enemy || params.enemy_group_id,
                        result: (params.type === 'end_success' || params.type === 'end') ? 'success' : (params.type === 'end_failure' ? 'failure' : undefined),
                        choices: []
                    };

                    script.nodes[nodeId] = currentNode;
                }
                else if (rowType === 'CHOICE') {
                    if (!currentNode) continue;

                    const choice: any = {
                        label: r.text_label,
                        next: r.next_node
                    };

                    if (params.cost_type && params.cost_val) {
                        choice.cost = { type: params.cost_type, val: params.cost_val };
                        if (params.cost_type === 'vitality') choice.cost_vitality = params.cost_val;
                    }
                    else if (params.cost_vitality) {
                        choice.cost_vitality = params.cost_vitality;
                    }
                    if (params.req_tag) choice.req_tag = params.req_tag;
                    if (params.req_type && params.req_val) choice.req = { type: params.req_type, val: params.req_val };

                    currentNode.choices.push(choice);
                }
            }

            allScriptData[questId] = script;
            console.log(`Loaded scenario script for Quest ${questId} (${Object.keys(script.nodes).length} nodes).`);
        }
    }

    // Helper to build JSON
    function buildScriptData(questId: string): any {
        return allScriptData[questId] || null;
    }

    // 4. Quests (scenarios) - Spec v3.1 Split

    // Helper to process quest rows
    const processQuestRow = (r: any, type: 'normal' | 'special') => {
        // Parse Trigger Conditions / Requirements
        const conditions: any = {};
        let ruling_nation_id = null;
        let is_urgent = r.is_urgent === 'true' || r.is_urgent === true;

        // Requirements JSON (Special)
        let requirements = {};
        if (type === 'special' && r.requirements) {
            try {
                requirements = JSON.parse(r.requirements);
            } catch (e) {
                console.warn(`Invalid JSON in requirements for ${r.slug}`, r.requirements);
            }
        }

        // Location Tags (Normal)
        let location_tags: string[] = [];
        if (type === 'normal' && r.location_tags) {
            location_tags = r.location_tags.split('|').map((t: string) => t.trim());
        }

        // Legacy Trigger Parsing (for backward compatibility if needed, or mapping CSV cols)
        // Spec v3.1 Normal Quests rely on location_tags & prosperity cols directly.

        // Parse Rewards
        const rewards: any = { gold: 0, items: [] };
        if (r.rewards_summary) {
            const rews = r.rewards_summary.split('|');
            rews.forEach((rew: string) => {
                const [type, val] = rew.split(':');
                if (type === 'Gold') rewards.gold = parseInt(val);
                else if (type === 'Item') rewards.items.push(parseInt(val));
                else if (type === 'Rep') rewards.reputation = parseInt(val);
                else if (['Order', 'Chaos', 'Justice', 'Evil'].includes(type)) {
                    if (!rewards.alignment_shift) rewards.alignment_shift = {};
                    rewards.alignment_shift[type.toLowerCase()] = parseInt(val);
                } else if (type === 'Vitality') rewards.vitality_cost = parseInt(val);
                else if (type === 'NPC') rewards.npc_reward = parseInt(val);
                else if (type === 'Move' || type === 'move_to') rewards.move_to = val;
            });
        }

        // Parse World Impact
        let impact: any = null;
        if (r.impact) {
            // ... (Same logic if implicit logic needed, currently impact col missing in new CSVs but kept validation)
        }

        // BUILD SCRIPT DATA FROM CSV
        const scriptData = buildScriptData(r.id);

        return {
            id: r.id,
            slug: r.slug,
            title: r.title,
            description: r._comment || r.title,
            difficulty: Number(r.difficulty) || 1,
            rec_level: Number(r.rec_level) || 1,
            time_cost: Number(r.time_cost) || 1,
            // conditions: conditions, 
            trigger_condition: null, // Deprecated in v3.1 API logic (uses specialized cols)
            rewards: rewards,
            script_data: scriptData || (r.script_data ? JSON.parse(r.script_data) : null),
            type: 'Subjugation',
            client_name: 'Guild',
            is_urgent: is_urgent,

            // New v3.1 Columns
            quest_type: type,
            requirements: type === 'special' ? requirements : {},
            location_tags: location_tags,
            // Map Normal Quest Props to conditions JSON if we want strict schema, 
            // OR just rely on API reading constraints from additional columns if we added them to DB.
            // Spec v3.1 says API reads CSV/Table columns directly.
            // But we are seeding `scenarios` table.
            // We need to store min/max prosperity somewhere.
            // Let's store them in `conditions` JSONB for now or `requirements`.
            // Normal Quests: Store min/max props in `conditions` (existing column)
            conditions: type === 'normal' ? {
                min_prosperity: r.min_prosperity ? Number(r.min_prosperity) : undefined,
                max_prosperity: r.max_prosperity ? Number(r.max_prosperity) : undefined
            } : {}
        };
    };

    // 4.1 Normal Quests
    await seedTable('scenarios', path.join(CSV_DIR, 'quests_normal.csv'), (r) => processQuestRow(r, 'normal'));

    // 4.2 Special Quests
    await seedTable('scenarios', path.join(CSV_DIR, 'quests_special.csv'), (r) => processQuestRow(r, 'special'));
}

main();
