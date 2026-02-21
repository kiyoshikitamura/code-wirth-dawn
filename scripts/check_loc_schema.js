
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("--- CHECKING LOCATION COLUMNS ---");
    const { data: loc, error } = await supabase
        .from('locations')
        .select('*')
        .limit(1);

    if (error) console.error("Error:", error);
    else console.log(Object.keys(loc[0]));
}

checkSchema();
