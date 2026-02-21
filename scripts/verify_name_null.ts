
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log("Checking if Name can be NULL...");

    // Pick first user
    const { data: user } = await supabase.from('user_profiles').select('id, name').limit(1).single();

    if (!user) {
        console.log("No users found to test.");
        return;
    }

    const originalName = user.name;

    // Try update
    console.log(`Updating User ${user.id} name to NULL...`);
    const { error } = await supabase.from('user_profiles').update({ name: null }).eq('id', user.id);

    if (error) {
        console.error("Update Failed (Likely NOT NULL constraint):", error.message);
    } else {
        console.log("Update Success! Name can be NULL.");
        // Revert 
        if (originalName !== null) {
            await supabase.from('user_profiles').update({ name: originalName }).eq('id', user.id);
            console.log("Reverted name.");
        }
    }
}

check();
