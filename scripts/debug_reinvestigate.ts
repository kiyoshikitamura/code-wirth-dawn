
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function debugSchemaAndData() {
    console.log("=== Debugging Schema & Data ===");

    // 1. Check User Profile Schema for Location Field
    // We can't easily "describe table" via JS client, but we can select typical fields from a user.
    const { data: user, error: userErr } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)
        .single();

    if (userErr) console.error("User Profile Error:", userErr);
    else {
        console.log("User Profile Fields:", Object.keys(user || {}));
        console.log("Current Location ID param:", user?.current_location_id);
    }

    // 2. Check Inventory Orphans (Inventory items pointing to non-existent Items)
    const { data: inventory, error: invErr } = await supabase
        .from('inventory')
        .select('id, item_id');

    if (invErr) console.error("Inventory Fetch Error:", invErr);
    else if (inventory) {
        // Fetch all item IDs (inefficient for large DBs but fine for debug)
        const { data: items } = await supabase.from('items').select('id');
        const itemIds = new Set(items?.map(i => i.id));

        const orphans = inventory.filter(inv => !itemIds.has(inv.item_id));
        if (orphans.length > 0) {
            console.error(`FOUND ${orphans.length} ORPHANED INVENTORY ITEMS! This causes 500s on join.`);
            console.log(orphans);

            // Cleanup orphans?
            // await supabase.from('inventory').delete().in('id', orphans.map(o => o.id));
            // console.log("Orphans deleted.");
        } else {
            console.log("No orphaned inventory items found.");
        }
    }

    // 3. Re-verify Quest 5001 Rewards
    const { data: quest } = await supabase.from('scenarios').select('id, title, rewards').eq('id', 5001).single();
    console.log("Quest 5001 Rewards:", quest?.rewards);
}

debugSchemaAndData();
