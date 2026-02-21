
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TABLES = [
    'user_profiles',
    'locations',
    'scenarios',
    'inventory',
    'items',
    'user_hub_states',
    'party_members',
    'user_cards',
    'nations',
    'world_states'
];

async function run() {
    console.log("--- Inspecting DB Tables ---");

    for (const table of TABLES) {
        console.log(`\n[${table}]`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`  Error: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`);
        } else {
            // Try to get columns even if empty via an insertion error or just say empty
            // Actually, just say empty for now.
            console.log(`  (Empty table)`);
        }
    }
}

run();
