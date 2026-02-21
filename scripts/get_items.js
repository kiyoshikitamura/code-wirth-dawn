
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkItems() {
    console.log("--- CHECKING ITEMS ---");
    const { data: items, error } = await supabase
        .from('items')
        .select('*')
        .ilike('name', '%potion%') // Try to find potions
        .limit(5);

    if (items) console.log("Items found:", items.map(i => ({ id: i.id, name: i.name, price: i.price })));
    else console.log("No potions found or error:", error);
}

checkItems();
