
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
    console.error("Missing Service Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log("Checking Quest 1 (Service Role)...");
    const { data: quest, error } = await supabase.from('scenarios').select('*').eq('id', '1').single();

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    if (!quest) {
        console.error("Quest 1 NOT FOUND");
        return;
    }

    console.log(`Quest: ${quest.title} (ID: ${quest.id})`);
    const battle = quest.script_data?.nodes?.['battle_encount'];
    console.log("Battle Node:", JSON.stringify(battle, null, 2));
}

check();
