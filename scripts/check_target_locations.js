
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLocations() {
    console.log("--- CHECKING LOCATIONS ---");
    const slugs = ['loc_white_fort', 'loc_iron_mine', 'loc_charon'];

    const { data, error } = await supabase
        .from('locations')
        .select('id, name, slug')
        .in('slug', slugs);

    if (error) console.error("Error:", error);
    else {
        console.log("Found locations:", data);
        slugs.forEach(s => {
            if (!data.find(l => l.slug === s)) console.log(`MISSING: ${s}`);
        });
    }

    console.log("--- ALL LOCATIONS (First 5) ---");
    const { data: all } = await supabase.from('locations').select('slug, name').limit(5);
    console.log(all);
}

checkLocations();
