
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkInventory() {
    console.log("--- Checking ALL Inventory ---");

    // 1. Get a user
    const { data: users } = await supabase.from('user_profiles').select('id').limit(1);
    const userId = users?.[0]?.id;
    console.log("Checking User:", userId);

    const { data, error } = await supabase
        .from('inventory')
        .select(`
            id,
            user_id,
            items!inner (
                id,
                name,
                effect_data,
                type
            )
        `)
        .eq('user_id', userId);

    if (error) {
        console.error("Inventory Fetch Error:", error);
        return;
    }

    console.log(`Fetched ${data?.length} inventory items.`);

    data?.forEach((entry: any, idx: number) => {
        try {
            if (!entry.items) throw new Error("Item is null");
            const item = entry.items;
            const effectData = item.effect_data || {}; // Check if this crashes if item is weird
            // Access properties
            const _ = item.type;
        } catch (e: any) {
            console.error(`Error at index ${idx}, ID: ${entry.id}:`, e.message);
        }
    });
    console.log("Inventory Check Complete.");
}

async function checkShopItems() {
    console.log("--- Checking Shop Items Integrity ---");
    const { data: items, error } = await supabase.from('items').select('*');
    if (error) {
        console.error("Shop Items Error:", error);
        return;
    }

    let badTags = 0;
    items?.forEach((item: any) => {
        if (!item.nation_tags) {
            console.error(`Item ${item.slug} has NULL nation_tags`);
            badTags++;
        } else if (!Array.isArray(item.nation_tags)) {
            console.error(`Item ${item.slug} nation_tags is NOT ARRAY:`, item.nation_tags);
            badTags++;
        }
    });

    if (badTags === 0) console.log("All item nation_tags are valid arrays.");
}

run();

async function run() {
    await checkInventory();
    await checkShopItems();
}
