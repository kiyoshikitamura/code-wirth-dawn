
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkInventory() {
    console.log("--- Checking Inventory ---");
    // Simulate the query from api/inventory/route.ts
    const { data, error } = await supabase
        .from('inventory')
        .select(`
            id,
            user_id,
            is_equipped,
            acquired_at,
            quantity,
            is_skill,
            items!inner (
                id,
                name,
                slug,
                type,
                cost,
                effect_data
            )
        `)
        .limit(5);

    if (error) {
        console.error("Inventory Query Error:", error);
    } else {
        console.log("Inventory Data Sample:", JSON.stringify(data, null, 2));
    }
}

async function checkShopItems() {
    console.log("--- Checking Shop Items ---");
    // Simulate the query from api/shop/route.ts
    const { data: items, error } = await supabase.from('items').select('*');
    if (error) {
        console.error("Shop Items Error:", error);
        return;
    }

    console.log(`Total Items: ${items?.length}`);

    // Check for null nation_tags
    const nullTags = items?.filter((i: any) => !i.nation_tags);
    if (nullTags && nullTags.length > 0) {
        console.error("Items with NULL nation_tags:", nullTags.map((i: any) => i.name));
    } else {
        console.log("All items have nation_tags.");
    }

    // Check for array vs object issues if any
}

async function run() {
    await checkInventory();
    await checkShopItems();
}

run();
