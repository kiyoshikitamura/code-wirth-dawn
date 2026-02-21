
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fixMissingHerb() {
    console.log("=== Creating 'item_herb' (Corrected Schema) ===");

    // Based on 'item_ofuda_set' sample:
    // {
    //   slug: 'item_ofuda_set',
    //   name: '呪符セット',
    //   type: 'skill', // 'consumable' likely exists? or maybe just 'item'
    //   base_price: 800,
    //   cost: 2,
    //   ap_cost: 1,
    //   effect_data: {},
    //   linked_card_id: 2004
    // }

    // Logic: Herb should probably be type 'consumable' if supported, or 'item'.
    // If it heals, maybe it has a `linked_card_id` for a Heal card?
    // Or `effect_data`?

    // Let's look for a Potion to copy structure?
    const { data: potion } = await supabase.from('items').select('*').ilike('slug', '%potion%').limit(1).maybeSingle();
    let typeToUse = 'consumable';
    let cardId = null;

    if (potion) {
        console.log("Found Potion Template:", potion);
        typeToUse = potion.type;
        cardId = potion.linked_card_id;
    } else {
        console.log("No potion found. Defaulting to type 'consumable' and creating a Heal Card if needed.");
        // If no linked card, maybe it just adds to inventory and code handles effect?
        // But the battle code uses `card.effect_id`.
        // Wait, `items` table doesn't have `effect_id`. 
        // `cards` table has `effect_id`.
        // So Item -> Linked Card -> Effect.
    }

    // Insert 'item_herb'
    const itemData = {
        slug: 'item_herb',
        name: '薬草',
        type: typeToUse, // 'consumable' or 'item'
        base_price: 50,
        cost: 10, // shop cost?
        // Linked Card: We need a card that does Heal 30.
        // Let's see if Card 2005 (Heal) exists (used by Elena).
        linked_card_id: 2005, // Trying established ID
        effect_data: { heal: 30 } // Just in case JSONB is used
    };

    const { data, error } = await supabase.from('items').insert(itemData).select();

    if (error) {
        console.error("Insert Failed:", JSON.stringify(error, null, 2));
    } else {
        console.log("Success! Created:", data);
    }
}

fixMissingHerb();
