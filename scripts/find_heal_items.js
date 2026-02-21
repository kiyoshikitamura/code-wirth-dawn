
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findHealItems() {
    console.log("--- SEARCHING HEAL ITEMS ---");
    const { data: items } = await supabase
        .from('items')
        .select('id, name, base_price')
        .or('name.ilike.%回復%,name.ilike.%薬%,name.ilike.%potion%')
        .limit(5);

    if (items && items.length > 0) console.log("Heal Items:", items);
    else console.log("No heal items found. Using placeholders.");
}

findHealItems();
