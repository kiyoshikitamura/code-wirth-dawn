
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fixMissingHerb() {
    console.log("=== Creating 'item_herb' ===");

    // Use a known existing effect_id from DB or null if optional
    // Let's assume 'heal_hp' works or use 'none' if enum constraint exists
    // The previous error didn't show the message because it was truncated or console object.

    // Attempt 1: Valid Data
    const itemData = {
        slug: 'item_herb',
        name: '薬草',
        description: 'HPを小回復する基本的な薬草。',
        item_type: 'consumable',
        effect_id: 'heal_hp', // This is standard, but if it fails, maybe case? Or not in enum?
        effect_val: 30,
        cost: 10,
        rarity: 1,
        is_tradeable: true
    };

    // Check if 'heal_hp' exists in status_effects if it's a FK? 
    // Usually effect_id is just a string enum in code or a soft FK.
    // Let's try insert.

    const { data, error } = await supabase.from('items').insert(itemData).select();

    if (error) {
        console.error("Insert Failed:", JSON.stringify(error, null, 2));
        // Retry with null effect_id if it's the issue?
    } else {
        console.log("Success! Created:", data);
    }
}

fixMissingHerb();
