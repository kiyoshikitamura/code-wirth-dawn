
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Quest 1 Details ---");
    const { data: quest, error } = await supabase
        .from('scenarios')
        .select('title, description, script_data')
        .eq('id', 1)
        .single();

    if (quest) {
        console.log("Title:", quest.title);
        console.log("Description:", quest.description);
        // console.log("Script Data:", JSON.stringify(quest.script_data, null, 2)); // Too verbose maybe?
    } else {
        console.error("Quest 1 error:", error);
    }

    console.log("\n--- Locations ---");
    const { data: locs } = await supabase.from('locations').select('id, name, slug');
    locs?.forEach(l => console.log(`${l.name} (${l.slug})`));
}

run();
