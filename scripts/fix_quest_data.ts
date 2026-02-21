
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Fixing Quest Data ---");

    // 1. Fix Quest 5001 (Remove move_to)
    const { data: q5001 } = await supabase.from('scenarios').select('rewards').eq('id', 5001).single();
    if (q5001 && q5001.rewards) {
        const newRewards = { ...q5001.rewards };
        if (newRewards.move_to) {
            delete newRewards.move_to;
            const { error } = await supabase.from('scenarios').update({ rewards: newRewards }).eq('id', 5001);
            if (error) console.error("Failed to update Quest 5001:", error);
            else console.log("Fixed Quest 5001: Removed move_to");
        } else {
            console.log("Quest 5001 already fixed.");
        }
    }

    // 2. Fix Quest 1 (Update move_to and days_success)
    const targetLocId = '06713271-7303-41c6-8ed2-e0396e1663c8'; // 巡礼の宿場町
    const targetDays = 5;

    const { data: q1 } = await supabase.from('scenarios').select('rewards, days_success').eq('id', 1).single();
    if (q1) {
        const newRewards = { ...q1.rewards, move_to: targetLocId };
        const updates: any = { rewards: newRewards, days_success: targetDays };
        const { error } = await supabase.from('scenarios').update(updates).eq('id', 1);

        if (error) console.error("Failed to update Quest 1:", error);
        else console.log(`Fixed Quest 1: move_to=${targetLocId}, days=${targetDays}`);
    } else {
        console.error("Quest 1 not found.");
    }
}

run();
