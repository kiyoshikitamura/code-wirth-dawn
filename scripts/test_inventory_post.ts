
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mock User ID (Use the test user if known, or pick one)
const TEST_USER_ID = '4e8ce5ba-5ffd-4eb9-8f11-310d72bda09d';

async function run() {
    console.log("--- Simulating Inventory POST ---");

    // 1. Pick an item to add (e.g., 'item_herb_common')
    const ITEM_SLUG = 'item_herb_common';
    // const ITEM_SLUG = 'item_unknown_slug'; // Test 404

    console.log(`Adding '${ITEM_SLUG}' to user '${TEST_USER_ID}'...`);

    // --- REPLICATE ROUTE LOGIC ---

    // 1. Get Item ID
    const { data: item, error: itemError } = await supabase
        .from('items')
        .select('id, name')
        .eq('slug', ITEM_SLUG)
        .single();

    if (itemError || !item) {
        console.error("Item Lookup Failed:", itemError);
        return;
    }
    console.log("Item Found:", item);

    // 2. Check Inventory for stacking
    const { data: existing, error: existError } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('user_id', TEST_USER_ID)
        .eq('item_id', item.id)
        .maybeSingle();

    if (existError) {
        console.error("Inventory Check Failed:", existError);
        return;
    }

    if (existing) {
        console.log("Item exists. Updating quantity...");
        const { error } = await supabase
            .from('inventory')
            .update({ quantity: existing.quantity + 1 })
            .eq('id', existing.id);
        if (error) console.error("Update Failed:", error);
        else console.log("Update Success!");
    } else {
        console.log("Item new. Calculating slot...");
        const { data: maxSlotData } = await supabase
            .from('inventory')
            .select('slot_index')
            .eq('user_id', TEST_USER_ID)
            .order('slot_index', { ascending: false })
            .limit(1)
            .maybeSingle();

        const nextSlot = (maxSlotData?.slot_index ?? -1) + 1;
        console.log("Next Slot:", nextSlot);

        const { error } = await supabase
            .from('inventory')
            .insert({
                user_id: TEST_USER_ID,
                item_id: item.id,
                quantity: 1,
                is_equipped: false,
                is_skill: false,
                slot_index: nextSlot
            });

        if (error) console.error("Insert Failed:", error);
        else console.log("Insert Success!");
    }
}

run();
