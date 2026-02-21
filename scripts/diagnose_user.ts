
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const TARGET_USER_ID = '4e8ce5ba-5ffd-4eb9-8f11-310d72bda09d';

async function run() {
    console.log(`Diagnosing User: ${TARGET_USER_ID}`);

    // 1. Profile
    const { data: profile, error: pError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', TARGET_USER_ID)
        .single();

    if (pError) console.error("Profile Error:", pError);
    else console.log("Profile:", JSON.stringify(profile, null, 2));

    // 2. Inventory
    const { data: inventory, error: iError } = await supabase
        .from('inventory')
        .select('*, items(name)')
        .eq('user_id', TARGET_USER_ID);

    if (iError) console.error("Inventory Error:", iError);
    else console.log("Inventory Count:", inventory?.length, JSON.stringify(inventory?.slice(0, 3), null, 2));

    // 3. Hub State
    const { data: hubState, error: hError } = await supabase
        .from('user_hub_states')
        .select('*')
        .eq('user_id', TARGET_USER_ID)
        .single();

    if (hError) console.log("Hub State Error (Expected if null):", hError.message);
    else console.log("Hub State:", JSON.stringify(hubState, null, 2));
}

run();
