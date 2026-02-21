
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function debugInventoryAndUser() {
    console.log("=== Debugging Inventory GET 500 & Location ===");

    // 1. Get a valid user (ensure we have one)
    const { data: user } = await supabase.from('user_profiles').select('*').limit(1).single();
    if (!user) { console.error("No user found"); return; }
    console.log("User Found:", user.id);
    console.log("User Columns:", Object.keys(user)); // Verify location column name

    // 2. Simulate GET /api/inventory logic
    // The API uses specific join:
    /*
    select(`
        id,
        is_equipped,
        acquired_at,
        quantity,
        is_skill,
        items!inner ( ... )
    `)
    */

    console.log("--- Testing Inventory Query ---");
    const { data: inventory, error: invErr } = await supabase
        .from('inventory')
        .select(`
            id,
            is_equipped,
            quantity,
            is_skill,
            items!inner (
                id,
                name,
                description,
                item_type,
                power_value,
                required_attribute,
                cost
            )
        `)
        .eq('user_id', user.id);

    if (invErr) {
        console.error("Inventory Query FAILED:", JSON.stringify(invErr, null, 2));
    } else {
        console.log(`Inventory Query Success. Found ${inventory.length} items.`);
        // internal check related to the map function in the API
        // const mapped = inventory.map(entry => ... ) // This is where it might crash if entry.items is null (but !inner should prevent that)
        // Check for any weird data
        inventory.forEach(i => {
            if (!i.items) console.error("CRITICAL: Inventory item has NO 'items' relation data:", i);
        });
    }

    // 3. Check Location exists
    console.log("--- Checking Location 'loc_royal_capital' ---");
    const { data: loc } = await supabase.from('locations').select('*').eq('slug', 'loc_royal_capital').maybeSingle();
    if (loc) {
        console.log("Location found:", loc.id, loc.slug);
    } else {
        console.error("Location 'loc_royal_capital' NOT FOUND!");
        const { data: allLocs } = await supabase.from('locations').select('slug').limit(5);
        console.log("Available Locations:", allLocs);
    }
}

debugInventoryAndUser();
