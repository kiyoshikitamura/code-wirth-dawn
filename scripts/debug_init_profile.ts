
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mock fetch for API call simulation or just call supabase directly?
// We want to test logic, but logic is in the route.
// We can use fetch to call localhost:3000 if running, or just reproduce logic here.
// Let's reproduce the logic to see what happens with inputs.

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInit() {
    const body = {
        title_name: 'TestUser',
        gender: 'Male',
        age: 25,
        max_hp: 120
    };

    console.log("Input Body:", body);

    const { data: profiles } = await supabase.from('user_profiles').select('id').limit(1);
    const profileId = profiles?.[0]?.id;

    console.log("Target Profile ID:", profileId);

    const updates = {
        name: body.title_name,
        title_name: '名もなき旅人',
        gender: body.gender,
        age: body.age || 20,
        hp: body.max_hp || 100,
        max_hp: body.max_hp || 100,
        is_alive: true
    };

    console.log("Prepared Updates:", updates);

    if (profileId) {
        const { error } = await supabase.from('user_profiles').update(updates).eq('id', profileId);
        if (error) console.error("Update failed:", error);
        else console.log("Update success!");
    }
}

testInit();
