
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("--- Checking Inventory Table ---");
    // We can't query information_schema easily via client, but we can try inserting duplicates to see error.

    const TEST_USER = '4e8ce5ba-5ffd-4eb9-8f11-310d72bda09d';

    // 1. Get max slot
    const { data: max } = await supabase.from('inventory').select('slot_index').eq('user_id', TEST_USER).order('slot_index', { ascending: false }).limit(1).maybeSingle();
    const slot = max?.slot_index ?? 0;

    console.log(`User ${TEST_USER} max slot: ${slot}`);

    // 2. Try to insert ANY item at 'slot' (collision)
    // Need a valid item id first
    const { data: item } = await supabase.from('items').select('id').limit(1).single();
    if (!item) {
        console.error("No items found");
        return;
    }

    console.log(`Trying to insert duplicate slot at ${slot}...`);
    const { error } = await supabase.from('inventory').insert({
        user_id: TEST_USER,
        item_id: item.id,
        quantity: 1,
        slot_index: slot // INTENTIONAL COLLISION if item is different?
        // Wait, if item is same, unique(user, item) might trigger first?
    });

    if (error) {
        console.log("Insert Error (Expected?):", error);
    } else {
        console.log("Insert Success (No unique constraint on slot_index?)");
        // Clean up
        // await supabase.from('inventory').delete().match({ user_id: TEST_USER, slot_index: slot, item_id: item.id });
    }
}

run();
