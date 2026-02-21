
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLocations() {
    console.log('Fetching locations...');
    const { data, error } = await supabase
        .from('locations')
        .select('name, slug, map_x, map_y, id');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- Current DB Locations ---');
    data.forEach(l => {
        console.log(`${l.name} (${l.slug}): x=${l.map_x}, y=${l.map_y}`);
    });
}

checkLocations();
