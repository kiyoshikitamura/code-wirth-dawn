
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function reproInventory500() {
    console.log("=== Reproducing Inventory 500 ===");

    // 1. Get a valid user
    const { data: user } = await supabase.from('user_profiles').select('id').limit(1).single();
    if (!user) {
        console.error("No user found");
        return;
    }
    console.log("Using User ID:", user.id);

    // 2. Get Item Herb
    const { data: item } = await supabase.from('items').select('id, slug').eq('slug', 'item_herb').single();
    if (!item) {
        console.error("item_herb not found");
        return;
    }
    console.log("Item:", item);

    // 3. Simulate Logic from API
    // Check existing
    const { data: existing, error: existErr } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('item_id', item.id)
        .maybeSingle();

    if (existErr) {
        console.error("Supabase Error (Check Existing):", existErr);
    } else {
        console.log("Existing Inventory:", existing);
    }

    // Try Insert/Update
    if (existing) {
        const { error: updErr } = await supabase
            .from('inventory')
            .update({ quantity: existing.quantity + 1 })
            .eq('id', existing.id);
        if (updErr) console.error("Supabase Error (Update):", updErr);
        else console.log("Update Success");
    } else {
        const { error: insErr } = await supabase
            .from('inventory')
            .insert({
                user_id: user.id,
                item_id: item.id,
                quantity: 1,
                is_equipped: false,
                is_skill: false
            });
        if (insErr) console.error("Supabase Error (Insert):", insErr);
        else console.log("Insert Success");
    }

    // 4. Check for Duplicates (Potential Cause of 500 with maybeSingle)
    const { data: dups } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_id', item.id);

    if (dups && dups.length > 1) {
        console.error("CRITICAL: DUPLICATE INVENTORY ITEMS FOUND!", dups);
    }
}

reproInventory500();
