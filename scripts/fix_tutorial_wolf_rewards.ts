
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fixTutorialWolfRewards() {
    console.log("Fixing Tutorial Wolf Rewards...");

    // 1. Get Tutorial Wolf Quest by slug 'qst_tutorial_wolf' which was previously not found?
    // Let's try to find it by title or ID 5002 if 5001 was Rat Hunt.
    // Based on previous logs, I'll search for 'wolf' in slug to be safe.

    const { data: quests } = await supabase
        .from('scenarios')
        .select('*')
        .ilike('slug', '%wolf%');

    if (quests && quests.length > 0) {
        quests.forEach(async (q) => {
            console.log(`Found Quest [${q.id}]: ${q.title} (${q.slug})`);

            // We want to add move_to to the one that is likely the first tutorial.
            // Usually 'qst_tutorial_wolf' or similar.
            if (q.slug === 'qst_tutorial_wolf' || q.slug === 'qst_wolf_hunt') {
                const currentRewards = q.rewards || {};

                // Add move_to: 'loc_royal_capital'
                const newRewards = {
                    ...currentRewards,
                    move_to: 'loc_royal_capital'
                };

                const { error: updateErr } = await supabase
                    .from('scenarios')
                    .update({ rewards: newRewards })
                    .eq('id', q.id);

                if (updateErr) console.error(`Update Failed for ${q.slug}:`, updateErr);
                else console.log(`Updated Rewards for ${q.slug} with move_to: loc_royal_capital`);
            }
        });
    } else {
        console.error("No quests found with 'wolf' in slug.");
    }
}

fixTutorialWolfRewards();
