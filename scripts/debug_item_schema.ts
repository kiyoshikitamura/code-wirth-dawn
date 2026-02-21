
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkItemSchema() {
    console.log("=== Checking Item Schema ===");

    // Check an existing consumable to see valid fields
    const { data: item } = await supabase
        .from('items')
        .select('*')
        .eq('item_type', 'consumable')
        .limit(1)
        .single();

    if (item) {
        console.log("Sample Consumable:", item);
    } else {
        console.log("No consumables found. Checking any item.");
        const { data: anyItem } = await supabase.from('items').select('*').limit(1).single();
        console.log("Sample Item:", anyItem);
    }
}

checkItemSchema();
