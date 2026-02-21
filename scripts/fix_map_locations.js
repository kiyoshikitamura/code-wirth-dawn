
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLocations() {
    console.log('Fixing locations...');

    // Updates
    const updates = [
        { name: '白亜の砦', x: 65, y: 60, slug: 'loc_jgxgj3' }, // Target specific slug to be safe
        { name: '鉄の鉱山村', x: 40, y: 40, slug: 'loc_d0etgt' },
        // Ensure Regalia/Arcadia is consistent if needed
        { name: '王都アーカディア', x: 50, y: 80, slug: 'loc_regalia' }
    ];

    for (const u of updates) {
        // Find by slug first to be precise
        const { data, error } = await supabase
            .from('locations')
            .update({ map_x: u.x, map_y: u.y, name: u.name }) // Also standardize name if mismatch
            .eq('slug', u.slug)
            .select();

        if (error) {
            console.error(`Failed to update ${u.name} (${u.slug}):`, error);
        } else {
            console.log(`Updated ${u.name} (${u.slug}):`, data);
        }
    }
}

fixLocations();
