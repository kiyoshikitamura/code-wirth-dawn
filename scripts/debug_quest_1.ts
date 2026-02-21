
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Checking Quest 1 Data ---");
    const { data: quest, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', 1)
        .single();

    if (error) {
        console.error("Fetch Error:", error);
    } else {
        console.log("ID:", quest.id);
        console.log("Title:", quest.title);
        console.log("Rewards:", JSON.stringify(quest.rewards, null, 2));
        console.log("Days Success:", quest.days_success);
        console.log("Time Cost:", quest.time_cost);
    }
}

run();
