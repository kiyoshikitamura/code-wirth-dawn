
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listColumns() {
    console.log("--- Listing Table Columns ---");

    // We can't query information_schema easily via JS client rpc unless exposed.
    // Instead, let's just select * from table limit 1 and print keys.

    const { data: nData, error: nError } = await supabase.from('npcs').select('*').limit(1);
    if (nError) console.error("NPC Error:", nError);
    else if (nData && nData.length > 0) {
        console.log("NPC Columns:", Object.keys(nData[0]));
    } else {
        console.log("NPC table empty or no access.");
    }

    const { data: gData, error: gError } = await supabase.from('enemy_groups').select('*').limit(1);
    if (gError) console.error("Group Error:", gError);
    else if (gData && gData.length > 0) {
        console.log("Group Columns:", Object.keys(gData[0]));
    } else {
        console.log("Group table empty.");
    }

    const { data: eData } = await supabase.from('enemies').select('*').limit(1);
    if (eData && eData.length > 0) console.log("Enemy Columns:", Object.keys(eData[0]));
}

listColumns();
