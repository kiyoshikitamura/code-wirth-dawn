
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listCountries() {
    console.log("--- LISTING COUNTRIES ---");
    const { data: countries, error } = await supabase
        .from('countries')
        .select('*');

    if (error) console.error("Error:", JSON.stringify(error, null, 2));
    else console.log(countries);
}

listCountries();
