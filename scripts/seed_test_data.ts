
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const CSV_DIR = path.join(process.cwd(), 'src', 'data', 'csv_test');

// Utility: Parse params
function parseParams(paramStr: string | undefined): any {
    if (!paramStr) return {};
    if (paramStr.trim().startsWith('{')) {
        try { return JSON.parse(paramStr); } catch (e) { return {}; }
    }
    const obj: any = {};
    paramStr.split(',').forEach(pair => {
        const [k, v] = pair.split(':');
        if (k && v) {
            const val = v.trim();
            obj[k.trim()] = isNaN(Number(val)) ? val : Number(val);
        }
    });
    return obj;
}

async function seedTable(tableName: string, filePath: string, transformer?: (record: any) => any) {
    if (!fs.existsSync(filePath)) {
        console.warn(`Skipping ${tableName}: File not found at ${filePath}`);
        return;
    }
    console.log(`Seeding ${tableName} from ${path.basename(filePath)}...`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true
    });

    const rows = records.map((r: any) => transformer ? transformer(r) : r);

    // Batch upsert
    for (const row of rows) {
        const { error } = await supabase.from(tableName).upsert(row);
        if (error) console.error(`Error upserting ${tableName}:`, error.message, row);
    }
}

async function main() {
    console.log("=== Seeding Test Data ===");

    // 1. Enemy Skills
    await seedTable('enemy_skills', path.join(CSV_DIR, 'enemy_skills.csv'));

    // 2. Enemies
    await seedTable('enemies', path.join(CSV_DIR, 'enemies.csv'), (r) => ({
        ...r,
        resistance: r.resistance ? r.resistance.replace(/'/g, '"') : null, // Fix list format if needed
        traits: r.traits ? r.traits.replace(/'/g, '"') : null
    }));

    // 3. Enemy Groups
    await seedTable('enemy_groups', path.join(CSV_DIR, 'enemy_groups.csv'), (r) => ({
        id: r.id,
        enemies: typeof r.enemies === 'string' ? JSON.parse(r.enemies) : r.enemies
    }));

    // 4. Items
    await seedTable('items', path.join(CSV_DIR, 'items.csv'), (r) => ({
        ...r,
        nation_tags: r.nation_tags ? r.nation_tags.replace(/'/g, '"').replace(/[\[\]]/g, '').split(',') : []
    }));

    // 5. Party Members
    await seedTable('party_members', path.join(CSV_DIR, 'party_members.csv'), (r) => ({
        ...r,
        inject_cards: r.inject_cards ? JSON.parse(r.inject_cards) : []
    }));

    // 6. Scenarios (Scripts)
    const SCENARIO_DIR = path.join(CSV_DIR, 'scenarios');
    const allScriptData: Record<string, any> = {};

    if (fs.existsSync(SCENARIO_DIR)) {
        const files = fs.readdirSync(SCENARIO_DIR).filter(f => f.endsWith('.csv'));
        for (const file of files) {
            const scriptId = file.replace('.csv', ''); // Use filename as ID
            const content = fs.readFileSync(path.join(SCENARIO_DIR, file), 'utf-8');
            const records = parse(content, { columns: true, skip_empty_lines: true, trim: true, bom: true, relax_column_count: true });

            const nodes: any = {};
            let currentNode: any = null;

            for (const r of records) {
                if (r.row_type === 'NODE') {
                    const params = parseParams(r.params);
                    currentNode = {
                        text: r.text_label,
                        type: params.type || 'text',
                        bg_key: params.bg || params.bg_key,
                        enemy_group_id: params.enemy || params.enemy_group_id,
                        // Parse extra params like guest_id, shop_id, days, dest
                        ...params,
                        choices: []
                    };
                    nodes[r.node_id] = currentNode;
                } else if (r.row_type === 'CHOICE') {
                    if (currentNode) {
                        currentNode.choices.push({
                            label: r.text_label,
                            next: r.next_node
                        });
                    }
                }
            }
            allScriptData[scriptId] = { nodes };
            console.log(`Loaded script: ${scriptId}`);
        }
    }

    // 7. Quests (Scenarios Table)
    await seedTable('scenarios', path.join(CSV_DIR, 'quests_special.csv'), (r) => {
        // Link script
        const scriptId = r.scenario_script_id;
        const scriptData = allScriptData[scriptId];

        return {
            id: r.id,
            title: r.title,
            difficulty: Number(r.difficulty),
            requirements: r.requirements ? JSON.parse(r.requirements) : {},
            rewards: r.rewards ? JSON.parse(r.rewards) : {},
            script_data: scriptData,
            quest_type: 'special',
            slug: r.id, // Use ID as slug for simplicity
            client_name: 'System'
        };
    });

    console.log("=== Test Seed Complete ===");
}

main().catch(console.error);
