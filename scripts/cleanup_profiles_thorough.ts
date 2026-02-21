
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
    console.log("Starting thorough cleanup...");

    // 1. Find all profiles with name IS NULL
    const { data: ghosts, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id')
        .is('name', null);

    if (fetchError) {
        console.error("Fetch ghosts error:", fetchError);
        return;
    }

    const ghostIds = ghosts?.map(g => g.id) || [];
    console.log(`Found ${ghostIds.length} ghost profiles.`);

    if (ghostIds.length === 0) return;

    // 2. Delete dependencies first
    console.log("Deleting dependencies...");

    // a. royalty_logs
    const { error: err1 } = await supabase.from('royalty_logs').delete().in('source_user_id', ghostIds);
    if (err1) console.error("Error deleting royalty_logs (source):", err1);

    const { error: err2 } = await supabase.from('royalty_logs').delete().in('target_user_id', ghostIds);
    if (err2) console.error("Error deleting royalty_logs (target):", err2);

    // b. party_members
    const { error: err3 } = await supabase.from('party_members').delete().in('owner_id', ghostIds);
    if (err3) console.error("Error deleting party_members (owner):", err3);

    const { error: err4 } = await supabase.from('party_members').delete().in('source_user_id', ghostIds);
    if (err4) console.error("Error deleting party_members (source):", err4);

    // c. inventory
    const { error: err5 } = await supabase.from('inventory').delete().in('user_id', ghostIds);
    if (err5) console.error("Error deleting inventory:", err5);

    // d. prayer_logs
    const { error: err6 } = await supabase.from('prayer_logs').delete().in('user_id', ghostIds);
    if (err6) console.error("Error deleting prayer_logs:", err6);

    // d. world_state (if any linked to users?)

    // 3. Finally delete the profiles
    console.log("Deleting ghost profiles...");
    const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .in('id', ghostIds);

    if (deleteError) {
        console.error("Final delete failed:", deleteError);
    } else {
        console.log("Thorough cleanup complete!");
    }
}

cleanup();
