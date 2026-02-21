
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_USER_ID = '4e8ce5ba-5ffd-4eb9-8f11-310d72bda09d';

async function run() {
    console.log("--- Comprehensive Inventory POST Test ---");

    // 1. Get ANY valid item to test with
    const { data: items, error: iErr } = await supabase
        .from('items')
        .select('slug, name')
        .limit(1);

    if (iErr || !items || items.length === 0) {
        console.error("Failed to fetch any item:", iErr);
        return;
    }

    const TEST_ITEM = items[0];
    console.log(`Using Test Item: ${TEST_ITEM.name} (${TEST_ITEM.slug})`);

    // 2. Check for Duplicates of this slug (just in case)
    const { data: dups, error: dErr } = await supabase
        .from('items')
        .select('id')
        .eq('slug', TEST_ITEM.slug);

    if (dErr) {
        console.error("Duplicate check error:", dErr);
    } else if (dups && dups.length > 1) {
        console.error(`CRITICAL: Found ${dups.length} items with slug '${TEST_ITEM.slug}'! This causes .single() to fail.`);
    } else {
        console.log("Slug uniqueness check: OK");
    }

    // 3. Simulate POST Logic
    console.log(`Simulating POST /api/inventory for '${TEST_ITEM.slug}'...`);

    // A. Get Item ID (The part that failed before)
    const { data: item, error: itemError } = await supabase
        .from('items')
        .select('id, name')
        .eq('slug', TEST_ITEM.slug)
        .single(); // This throws PGRST116 if 0 or >1

    if (itemError) {
        console.error("POST Logic - Item Lookup Failed:", itemError);
        return;
    }
    console.log("POST Logic - Item Lookup: OK", item.id);

    // B. Check Inventory
    const { data: existing, error: existError } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('user_id', TEST_USER_ID)
        .eq('item_id', item.id)
        .maybeSingle();

    if (existError) {
        console.error("POST Logic - Inventory Check Failed:", existError);
        return;
    }

    if (existing) {
        console.log("Item exists. Updating...");
        const { error } = await supabase
            .from('inventory')
            .update({ quantity: existing.quantity + 1 })
            .eq('id', existing.id);
        if (error) console.error("POST Logic - Update Failed:", error);
        else console.log("POST Logic - Update OK");
    } else {
        console.log("Item new. Inserting...");
        const { data: maxSlotData } = await supabase
            .from('inventory')
            .select('slot_index')
            .eq('user_id', TEST_USER_ID)
            .order('slot_index', { ascending: false })
            .limit(1)
            .maybeSingle();

        const nextSlot = (maxSlotData?.slot_index ?? -1) + 1;
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

        if (error) console.error("POST Logic - Insert Failed:", error);
        else console.log("POST Logic - Insert OK");
    }
}

run();
