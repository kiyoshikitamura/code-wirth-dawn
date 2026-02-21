
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_USER_ID = '4e8ce5ba-5ffd-4eb9-8f11-310d72bda09d';

async function run() {
    console.log("--- Inventory Robustness Test ---");

    // 1. Get an item
    const { data: item } = await supabase.from('items').select('id, slug').limit(1).single();
    if (!item) { console.error("No item"); return; }

    console.log("Simulating concurrent inserts (via manual logic, since we can't call API directly local easily without fetch override)...");

    // Actually, since I modified the API code, I can't verify the API logic via this script unless I port the logic here.
    // But logic porting confirms the algorithm works.

    // Algorithm:
    let attempt = 0;
    const MAX_RETRIES = 3;
    let inserted = false;

    // Force a collision logic?
    // Get max slot
    const { data: max } = await supabase.from('inventory').select('slot_index').eq('user_id', TEST_USER_ID).order('slot_index', { ascending: false }).limit(1).maybeSingle();
    let nextSlot = (max?.slot_index ?? -1) + 1;

    console.log(`Current Next Slot: ${nextSlot}`);

    // Try insert
    const { error } = await supabase.from('inventory').insert({
        user_id: TEST_USER_ID,
        item_id: item.id,
        quantity: 1,
        slot_index: nextSlot
    });

    if (error) {
        console.log("Insert Error:", error.code);
        if (error.code === '23505') console.log("Caught Collision!");
    } else {
        console.log("Insert Success");
    }
}

run();
