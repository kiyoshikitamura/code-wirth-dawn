
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Checking Location Linkage ---");

    // 1. Get Quest 1 Reward
    const { data: quest } = await supabase.from('scenarios').select('rewards').eq('id', '1').single();
    const moveTo = quest?.rewards?.move_to;
    console.log(`Quest 1 move_to: ${moveTo}`);

    if (!moveTo) {
        console.error("Quest 1 has no move_to reward!");
        return;
    }

    // 2. Resolve Location
    // Check if UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moveTo);
    let loc: any;

    if (isUuid) {
        const { data } = await supabase.from('locations').select('*').eq('id', moveTo).maybeSingle();
        loc = data;
    } else {
        const { data } = await supabase.from('locations').select('*').eq('slug', moveTo).maybeSingle();
        loc = data;
    }

    if (!loc) {
        console.error(`Location not found for '${moveTo}'`);
        return;
    }
    console.log(`Location Found: ${loc.name} (ID: ${loc.id}, Slug: ${loc.slug})`);

    // 3. Check World State
    const { data: ws } = await supabase.from('world_states').select('*').eq('location_name', loc.name).maybeSingle();

    if (ws) {
        console.log(`World State Found for '${loc.name}':`, ws.id);
    } else {
        console.error(`CRITICAL: No World State found for '${loc.name}'! fetchWorldState will fail or default.`);
    }
}

run();
