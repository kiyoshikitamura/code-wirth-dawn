
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("--- ITEM SCHEMA ---");
    const { data: items, error } = await supabase.from('items').select('*').limit(1);
    if (items && items.length > 0) console.log("Columns:", Object.keys(items[0]));
    else if (error) console.log("Error:", error);
    else console.log("Table empty.");
}

checkSchema();
