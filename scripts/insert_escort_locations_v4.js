
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertMissingLocations() {
    console.log("--- INSERTING MISSING LOCATIONS (SCHEMA FIXED) ---");

    // "Roland" and "Empire" are top-level nations.
    // In our schema, tables like 'nations' or 'countries' exist? 
    // Previous error "countries table empty" suggests we might rely on string IDs or another table.
    // However, `loc_regalia` exists. Let's assume we can just use the string ID 'Roland' / 'Empire' 
    // IF the foreign key constraint allows text, OR we need to fetch from `nations`.

    // But wait, `list_countries.js` failed with empty error, meaning maybe `countries` table is RLS blocked or empty.
    // Let's rely on checking `ruling_nation_id` is nullable or text?
    // Start with 'Roland' text.

    const newLocations = [
        {
            slug: 'loc_white_fort',
            name: '白亜の砦',
            type: 'fort',
            description: '王都と帝都を結ぶ街道の要所。白い石壁が特徴。',
            x: -20,
            y: -40,
            ruling_nation_id: 'Roland' // Try text ID
        },
        {
            slug: 'loc_iron_mine',
            name: '鉄の鉱山村',
            type: 'village',
            description: '豊富な鉄鉱石が採れる村。鍛冶屋が多い。',
            x: -50,
            y: -80,
            ruling_nation_id: 'Empire' // Try text ID
        }
    ];

    for (const loc of newLocations) {
        const { data, error } = await supabase
            .from('locations')
            .upsert(loc, { onConflict: 'slug' })
            .select();

        if (error) {
            console.error(`Error inserting ${loc.name}:`, JSON.stringify(error, null, 2));
        } else {
            console.log(`Inserted/Updated: ${loc.name} (ID: ${data[0].id})`);
        }
    }
}

insertMissingLocations();
