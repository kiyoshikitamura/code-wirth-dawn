
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fixSpecificIssues() {
    console.log("=== Fixing Specific Issues ===");

    // 1. Fix Item 'item_herb' (Missing)
    // Check if it exists again just in case
    const { data: herb } = await supabase.from('items').select('id').eq('slug', 'item_herb').maybeSingle();

    if (!herb) {
        console.log("Creating 'item_herb'...");
        const { error: insertErr } = await supabase.from('items').insert({
            slug: 'item_herb',
            name: '薬草',
            description: 'HPを小回復する基本的な薬草。',
            item_type: 'consumable',
            effect_id: 'heal_hp', // Assuming this exists or is handled by logic
            effect_val: 30,
            cost: 10,
            rarity: 1,
            is_tradeable: true
        });
        if (insertErr) console.error("Failed to create herb:", insertErr);
        else console.log("Created 'item_herb'.");
    } else {
        console.log("'item_herb' already exists.");
    }

    // 2. Fix Quest "王都への護衛任務" (ID 5012 from previous log)
    // slug: qst_escort_capital
    const questId = 5012;

    // Check if ID 5012 is actually "王都への護衛任務"
    const { data: quest } = await supabase.from('scenarios').select('*').eq('id', questId).single();

    if (quest && quest.title.includes('王都')) {
        console.log(`Updating Quest [${quest.id}] ${quest.title}...`);

        // Find 'loc_royal_capital' ID
        const { data: loc } = await supabase.from('locations').select('id').eq('slug', 'loc_royal_capital').single();
        const targetLocId = loc?.id || 'loc_royal_capital';

        const currentRewards = quest.rewards || {};
        const newRewards = {
            ...currentRewards,
            move_to: targetLocId
        };

        const { error: updateErr } = await supabase
            .from('scenarios')
            .update({ rewards: newRewards })
            .eq('id', questId);

        if (updateErr) console.error("Quest Update Failed:", updateErr);
        else console.log("Quest Updated:", newRewards);

    } else {
        console.error("Quest ID 5012 not found or title mismatch.");
        // Fallback search by title if ID is wrong
        const { data: searched } = await supabase.from('scenarios').select('*').ilike('title', '%王都への護衛任務%').single();
        if (searched) {
            console.log(`Fallback Found [${searched.id}] ${searched.title}. Updating...`);
            // Duplicate logic... simplified for script
            const { data: loc } = await supabase.from('locations').select('id').eq('slug', 'loc_royal_capital').single();
            const targetLocId = loc?.id || 'loc_royal_capital';
            const newRewards = { ...searched.rewards, move_to: targetLocId };
            await supabase.from('scenarios').update({ rewards: newRewards }).eq('id', searched.id);
            console.log("Fallback Quest Updated.");
        }
    }
}

fixSpecificIssues();
