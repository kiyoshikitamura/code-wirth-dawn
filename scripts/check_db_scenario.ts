
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScenario() {
    console.log("Checking Scenario 1001...");
    const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', 1001)
        .single();

    if (error) {
        console.error("Error fetching scenario:", error);
        return;
    }

    if (!data) {
        console.log("Scenario 1001 not found.");
        return;
    }

    console.log("Scenario Title:", data.title);
    const script = data.script_data;
    if (script && script.nodes) {
        const battleNode = script.nodes['battle_start'];
        console.log("Node [battle_start]:", battleNode);
        if (battleNode) {
            console.log("  - Type:", battleNode.type);
            console.log("  - Enemy:", battleNode.enemy_group_id);
        } else {
            console.log("  - Node 'battle_start' NOT FOUND in script_data.");
            console.log("  - Available Nodes:", Object.keys(script.nodes));
        }
    } else {
        console.log("No script_data or nodes found.");
    }
}

checkScenario();
