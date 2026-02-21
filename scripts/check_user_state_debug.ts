
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USER_ID = '4e8ce5ba-5ffd-4eb9-8f11-310d72bda09d';

async function run() {
    console.log(`--- Checking User State: ${USER_ID} ---`);

    // 1. Profile & Location
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*, locations(*)')
        .eq('id', USER_ID)
        .single();

    console.log("Profile Location:", profile?.locations?.name);
    console.log("Profile Current Location ID:", profile?.current_location_id);

    // 2. Hub State
    const { data: hubState } = await supabase
        .from('user_hub_states')
        .select('*')
        .eq('user_id', USER_ID)
        .maybeSingle();

    console.log("Hub State:", hubState);

    // 3. Check Quest 5001 (Rat) and 1 (Escort) rewards to be sure
    const { data: q1 } = await supabase.from('scenarios').select('id, title, rewards').eq('id', '1').single();
    console.log("Quest 1 Rewards:", q1?.rewards);
}

run();
