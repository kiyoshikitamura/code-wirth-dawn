
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
        cast: (value, context) => {
            const col = String(context.column);
            if (col === 'id' || col.endsWith('_id') || col.endsWith('_val') || col.endsWith('_price') || col === 'min_prosperity' || col === 'durability' || col === 'cover_rate') {
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
            linked_card_id: r.linked_card_id
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
            cover_rate: r.cover_rate,
            inject_cards: cardIds,
            // Defaults for master data
            is_active: true, // Available in pool?
            owner_id: null,
            origin_type: 'system'
        };
    });

    // 4. Quests (scenarios)
    await seedTable('scenarios', path.join(CSV_DIR, 'quests.csv'), (r: any) => {
        // Parse Trigger Conditions
        const conditions: any = {};
        let ruling_nation_id = null;

        if (r.trigger_condition && r.trigger_condition !== 'any') {
            const conds = r.trigger_condition.split('|');
            conds.forEach((c: string) => {
                const [key, val] = c.split(':');
                if (key === 'nation') {
                    // Map CSV tag to Nation ID
                    const nationMap: Record<string, string> = {
                        'loc_holy_empire': 'Roland',
                        'loc_marcund': 'Markand',
                        'loc_haryu': 'Karyu',
                        'loc_yatoshin': 'Yato',
                        'loc_neutral': 'Neutral'
                    };
                    ruling_nation_id = nationMap[val] || val;
                }
                else if (key === 'prosp') conditions.min_prosperity = parseInt(val.replace('+', '').replace('-', '')) || 1; // Simplify
                else if (key === 'align') conditions.required_alignment = { [val]: 10 }; // Default 10 req
                else if (key === 'trigger') conditions.event_trigger = val;
            });
        }

        // Parse Rewards
        const rewards: any = { gold: 0, items: [] };
        if (r.rewards_summary) {
            const rews = r.rewards_summary.split('|');
            rews.forEach((rew: string) => {
                const [type, val] = rew.split(':');
                if (type === 'Gold') rewards.gold = parseInt(val);
                else if (type === 'Item') rewards.items.push(parseInt(val));
                else if (type === 'Rep') rewards.reputation = parseInt(val); // Generic rep
                else if (type === 'Order' || type === 'Chaos' || type === 'Justice' || type === 'Evil') {
                    if (!rewards.alignment_shift) rewards.alignment_shift = {};
                    rewards.alignment_shift[type.toLowerCase()] = parseInt(val);
                } else if (type === 'Vitality') rewards.vitality_cost = parseInt(val); // Negative? CSV says Vitality:-5
                else if (type === 'NPC') rewards.npc_reward = parseInt(val);
            });
        }

        return {
            id: r.id,
            slug: r.slug,
            title: r.title,
            description: r._comment || r.title, // Use comment as description
            difficulty: Number(r.difficulty) || 1, // Safely parse int
            time_cost: Number(r.time_cost) || 1,   // Safely parse int
            ruling_nation_id: ruling_nation_id,
            conditions: conditions,
            rewards: rewards,
            type: 'Subjugation', // Default
            client_name: 'Guild' // Default
        };
    });
}

main();
