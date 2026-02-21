
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log("Checking if Age can be NULL...");

    // Pick first user
    const { data: user } = await supabase.from('user_profiles').select('id, age').limit(1).single();

    if (!user) {
        console.log("No users found to test.");
        return;
    }

    // Try update
    console.log(`Updating User ${user.id} age to NULL...`);
    const { error } = await supabase.from('user_profiles').update({ age: null }).eq('id', user.id);

    if (error) {
        console.error("Update Failed (Likely NOT NULL constraint):", error.message);
        // Revert? Failed anyway.
    } else {
        console.log("Update Success! Age can be NULL.");
        // Revert 
        if (user.age !== null) {
            await supabase.from('user_profiles').update({ age: user.age }).eq('id', user.id);
            console.log("Reverted age.");
        }
    }
}

check();
