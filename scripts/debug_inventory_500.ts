
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testInventory() {
    console.log("Testing Inventory Query...");

    // Test with NO user_id (Guest/Template?)
    const { data: noUser, error: noUserErr } = await supabase
        .from('inventory')
        .select(`
            id,
            items!inner (
                id, name
            )
        `)
        .is('user_id', null);

    if (noUserErr) console.error("No User Query Error:", noUserErr);
    else console.log("No User Data:", noUser?.length);

    // Test WITH user_id (Pick a random one or use a known one if possible, or just list inventory)
    const { data: all, error: allErr } = await supabase.from('inventory').select('*').limit(1);
    if (all && all.length > 0) {
        const uid = all[0].user_id;
        console.log("Testing with User ID:", uid);
        const { data: withUser, error: withUserErr } = await supabase
            .from('inventory')
            .select(`
                id, quantity,
                items!inner (
                    id, name
                )
            `)
            .eq('user_id', uid);

        if (withUserErr) console.error("With User Query Error:", withUserErr);
        else console.log("With User Data:", withUser?.length);
    } else {
        console.log("No inventory data found to test user query.");
    }
}

testInventory();
