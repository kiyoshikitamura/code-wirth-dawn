
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkScenarioRewards() {
    console.log("Checking Scenario Rewards...");

    // Check all scenarios
    const { data: scenarios, error } = await supabase
        .from('scenarios')
        .select('id, title, rewards, slug');

    if (error) {
        console.error("Error:", error);
        return;
    }

    scenarios?.forEach(s => {
        console.log(`[${s.id}] ${s.title} (${s.slug})`);
        console.log("  Rewards:", JSON.stringify(s.rewards, null, 2));
    });
}

checkScenarioRewards();
