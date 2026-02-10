import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl ? "Found" : "Missing");
// console.log("Supabase Key:", supabaseKey ? "Found" : "Missing");

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    try {
        console.log("=== Checking Quest 1001 Data ===");
        const { data: quest, error: qError } = await supabase
            .from('scenarios')
            .select('*')
            .eq('id', '1001')
            .maybeSingle();

        if (qError) {
            console.error("Error fetching quest 1001:", qError);
        } else if (!quest) {
            console.error("Quest 1001 not found.");
        } else {
            console.log("Quest Title:", quest.title);
            if (quest.script_data && quest.script_data.nodes) {
                console.log("Node: battle_start ->", JSON.stringify(quest.script_data.nodes['battle_start'], null, 2));
                console.log("Node: win ->", JSON.stringify(quest.script_data.nodes['win'], null, 2));
            } else {
                console.log("No script_data/nodes found:", quest.script_data);
            }
        }

        console.log("\n=== Checking Enemy Groups ===");
        const { data: groups, error: gError } = await supabase.from('enemy_groups').select('*');
        if (gError) console.error(gError);
        else console.log(JSON.stringify(groups, null, 2));

        console.log("\n=== Checking Enemies ===");
        const { data: enemies, error: eError } = await supabase.from('enemies').select('*');
        if (eError) console.error(eError);
        else console.log(JSON.stringify(enemies, null, 2));

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

checkData();
