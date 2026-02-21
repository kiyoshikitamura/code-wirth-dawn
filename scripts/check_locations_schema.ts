
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Checking Locations Schema ---");
    const { data: locs, error } = await supabase
        .from('locations')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (locs && locs.length > 0) {
        console.log("Columns:", Object.keys(locs[0]));
        console.log("Sample Data:", JSON.stringify(locs[0], null, 2));
    } else {
        console.log("Locations table is empty.");
    }

    // Check Quest 1 reward too
    const { data: quest } = await supabase.from('scenarios').select('rewards').eq('id', '1').single();
    console.log("Quest 1 Rewards move_to:", quest?.rewards?.move_to);
}

run();
