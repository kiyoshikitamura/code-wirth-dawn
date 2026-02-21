
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listItemsCorrectly() {
    console.log("--- LISTING ITEMS (Correct Columns) ---");
    const { data: items, error } = await supabase
        .from('items')
        .select('id, name, base_price')
        .limit(20);

    if (items) console.log("Items:", items);
    else console.log("Error:", error);
}

listItemsCorrectly();
