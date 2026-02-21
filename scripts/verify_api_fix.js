
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyItemType() {
    console.log("--- API MOCK TEST ---");
    // Just fetching a consumable to ensure 'type' is correct column
    const { data, error } = await supabase.from('items').select('type').eq('id', 1).single(); // Potion?
    if (error) console.error(error);
    else console.log("Item 1 Type:", data.type);
}

verifyItemType();
