
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fixScenarioRewards() {
    console.log("Fixing Scenario Rewards...");

    // 1. Get Tutorial Wolf Quest - Check ID 5001 directly if slug fails, or check output of list_scenarios
    // Based on previous logs, ID 5001 was "始まりの依頼 (qst_tutorial_wolf)"
    // If exact match failed, maybe leading/trailing spaces? or case sensitivity?
    // Let's use ID 5001.

    const { data: quest, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', 5001)
        .single();

    if (quest) {
        console.log(`Found Quest [${quest.id}]: ${quest.title} (${quest.slug})`);
        const currentRewards = quest.rewards || {};

        // Add move_to: 'loc_royal_capital' (Check location ID)
        // Let's check locations first
        const { data: locs } = await supabase.from('locations').select('id, slug').limit(10);
        // Find capital or town
        const capital = locs?.find(l => l.slug.includes('capital') || l.slug.includes('town'))?.id || 'loc_royal_capital';

        console.log("Target Location ID:", capital);

        const newRewards = {
            ...currentRewards,
            move_to: capital
        };

        const { error: updateErr } = await supabase
            .from('scenarios')
            .update({ rewards: newRewards })
            .eq('id', quest.id);

        if (updateErr) console.error("Update Failed:", updateErr);
        else console.log("Updated Rewards with move_to:", newRewards);

    } else {
        console.error("Quest ID 5001 not found.");
    }
}

fixScenarioRewards();
