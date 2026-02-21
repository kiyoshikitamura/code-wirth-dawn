
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role to bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    console.log("--- Inspecting Quest Data (ID: 1) ---");
    const { data: quest, error: qError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', 1)
        .single();

    if (qError) console.error("Quest Error:", qError);
    else {
        console.log("Quest Title:", quest.title);
        // Check script_data content
        if (typeof quest.script_data === 'string') {
            console.log("Script Data (String - First 500 chars):", quest.script_data.substring(0, 500));
        } else {
            console.log("Script Data (JSON):", JSON.stringify(quest.script_data, null, 2).substring(0, 2000));
        }
    }

    console.log("\n--- Inspecting Enemy Groups ---");
    const { data: groups, error: gError } = await supabase
        .from('enemy_groups')
        .select('*');

    if (gError) console.error("Group Error:", gError);
    else {
        console.log("Found Groups:", groups.length);
        groups.forEach(g => {
            console.log(`- Group ${g.id} (${g.name}): members=[${g.members}]`);
        });
    }

    console.log("\n--- Inspecting Enemies ---");
    // Check specific enemies mentioned
    const { data: enemies } = await supabase
        .from('enemies')
        .select('id, name, slug, vit_damage');

    console.log("Enemies matching 'Wolf' or 'Slime':");
    enemies?.filter(e => e.name.includes('Wolf') || e.name.includes('Slime') || e.slug.includes('wolf') || e.slug.includes('slime'))
        .forEach(e => console.log(e));
}

inspectData();
