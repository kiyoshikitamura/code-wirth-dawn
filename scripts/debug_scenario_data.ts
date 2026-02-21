
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Using anon key to also test RLS if needed, but safe to use service role if just debugging data

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Listing Scenarios...");
    const { data: scenarios, error } = await supabase.from('scenarios').select('id, title').limit(20);

    if (error) {
        console.error("Fetch Error:", error);
        return;
    }

    console.log("Searching for '行方不明'...");

    // Use fresh variables or different scope
    const { data: found } = await supabase.from('scenarios').select('id, title, script_data').ilike('title', '%行方不明%');

    if (found && found.length > 0) {
        found.forEach((s: any) => {
            console.log(`ID: ${s.id} | Title: ${s.title}`);
            const battle = s.script_data?.nodes?.['battle_encount'];
            if (battle) {
                console.log(`Battle Enemy Group ID: ${battle.enemy_group_id}`);
            } else {
                console.log("No battle_encount node");
            }
        });
    } else {
        console.log("No scenarios found matching '行方不明'");
    }
}

check();
