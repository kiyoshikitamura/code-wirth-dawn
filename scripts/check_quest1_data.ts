
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Checking Quest 1 Data ---");

    // 1. Get Quest 1
    const { data: quest, error: qErr } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', '1')
        .single();

    if (qErr) { console.error("Quest Error:", qErr); return; }
    console.log("Quest 1 Rewards:", JSON.stringify(quest.rewards, null, 2));

    const moveTo = quest.rewards?.move_to;
    if (moveTo) {
        console.log(`'move_to' found: ${moveTo}`);

        // 2. Check if Location Exists
        // Try as UUID
        const { data: locById } = await supabase.from('locations').select('id, name').eq('id', moveTo).maybeSingle();
        if (locById) {
            console.log(`Location found by ID: ${locById.name} (${locById.id})`);
        } else {
            console.log("Location NOT found by ID. Trying Slug...");
            const { data: locBySlug } = await supabase.from('locations').select('id, name').eq('slug', moveTo).maybeSingle();
            if (locBySlug) {
                console.log(`Location found by SLUG: ${locBySlug.name} (${locBySlug.id})`);
            } else {
                console.error("CRITICAL: Location not found by ID or Slug!");
            }
        }
    } else {
        console.warn("CRITICAL: 'move_to' missing from Quest 1 rewards!");
    }
}

run();
