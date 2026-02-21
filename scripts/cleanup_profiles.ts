
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupProfiles() {
    console.log("Cleaning up Nameless Profiles...");

    // Delete profiles where name is NULL
    // Note: Be careful if there are legitimate users with null names (shouldn't be for active ones)

    // First, count them
    const { count, error: countError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .is('name', null);

    console.log(`Found ${count} profiles with NULL name.`);

    if (count && count > 0) {
        const { error: deleteError } = await supabase
            .from('user_profiles')
            .delete()
            .is('name', null);

        if (deleteError) {
            console.error("Delete failed:", deleteError);
        } else {
            console.log("Deleted Nameless profiles.");
        }
    } else {
        console.log("No profiles to clean.");
    }
}

cleanupProfiles();
