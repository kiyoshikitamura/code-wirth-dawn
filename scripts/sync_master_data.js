
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Inlined from src/config/travel_data.ts
const LOCATIONS = {
    'loc_regalia': { name: '王都レガリア', map_x: 50, map_y: 80 },
    'loc_white_fort': { name: '白亜の砦', map_x: 65, map_y: 60 },
    'loc_iron_mine': { name: '鉄の鉱山', map_x: 40, map_y: 40 },
    'loc_charon': { name: '帝都カロン', map_x: 50, map_y: 15 },
    'loc_hometown': { name: '故郷の村', map_x: 45, map_y: 85 },
    'loc_port_city': { name: '港町', map_x: 20, map_y: 70 },
};

async function sync() {
    console.log("--- SYNCING MASTER DATA ---");
    for (const [slug, data] of Object.entries(LOCATIONS)) {
        console.log(`Updating ${slug}...`);

        // Update map_x, map_y
        // Also update x, y to match map scale logic if needed? 
        // For now, WorldMap uses map_x, map_y. 
        // Logic will skip x,y calculation. So x,y are legacy or can remain for "true distance"? 
        // Let's just update map coordinates.

        const { error } = await supabase
            .from('locations')
            .update({
                map_x: data.map_x,
                map_y: data.map_y,
                // Optional: Update name if divergent? No, keep DB name.
            })
            .eq('slug', slug);

        if (error) console.error(`Error ${slug}:`, error);
        else console.log(`Success ${slug}: (${data.map_x}, ${data.map_y})`);
    }
    process.exit(0);
}

sync();
