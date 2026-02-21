
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Use Service Role Key to bypass RLS and delete users from auth.users if needed (auth.users requires admin)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    console.log("Wiping all users...");

    // 1. Delete from public tables (Cascade should handle relations, but explicit is safer)
    const tables = ['inventory', 'party_members', 'reputations', 'user_hub_states', 'user_profiles'];

    for (const table of tables) {
        const { error } = await supabase.from(table).delete().not('id', 'is', null); // Delete all
        if (error) console.error(`Error deleting ${table}:`, error.message);
        else console.log(`Deleted all from ${table}`);
    }

    // 2. Delete from auth.users using Admin API
    // Need to list users first
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error("Error listing auth users:", listError.message);
        return;
    }

    console.log(`Found ${users.length} auth users. Deleting...`);
    for (const user of users) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) console.error(`Failed to delete user ${user.id}:`, deleteError.message);
        else console.log(`Deleted auth user ${user.id}`);
    }

    console.log("Wipe complete.");
}

run();
