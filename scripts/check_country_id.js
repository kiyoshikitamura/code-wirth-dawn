
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCountryId() {
    console.log("--- CHECKING EXISTING COUNTRY ID ---");
    const { data: loc, error } = await supabase
        .from('locations')
        .select('id, name, country_id')
        .eq('slug', 'loc_regalia')
        .single();

    if (error) console.error("Error:", JSON.stringify(error, null, 2));
    else console.log("Regalia Country ID:", loc.country_id);

    // Also try to list any country
    const { data: c } = await supabase.from('countries').select('id, name').limit(1);
    console.log("Any Country:", c);
}

checkCountryId();
