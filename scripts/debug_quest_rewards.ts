
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Checking Quest Rewards for move_to ---");

    // Fetch all scenarios with rewards
    const { data: scenarios, error } = await supabase
        .from('scenarios')
        .select('id, title, rewards')
        .not('rewards', 'is', null);

    if (error) {
        console.error("Fetch Error:", error);
        return;
    }

    const relocatingQuests = scenarios?.filter((q: any) => q.rewards?.move_to);

    console.log(`Found ${relocatingQuests?.length} quests with 'move_to' reward.`);

    relocatingQuests?.forEach((q: any) => {
        console.log(`- [${q.id}] ${q.title}: move_to = ${q.rewards.move_to}`);
    });
}

run();
