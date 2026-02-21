
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listItems() {
    console.log("--- LISTING ITEMS ---");
    const { data: items, error } = await supabase
        .from('items')
        .select('id, name, price, item_type')
        .limit(20);

    if (items) console.log("Items:", items);
    else console.log("Error:", error);
}

listItems();
