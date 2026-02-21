
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertMissingLocations() {
    console.log("--- INSERTING MISSING LOCATIONS ---");

    // Coordinates are estimates based on "South" from Regalia (0,0) and "West" to Charon (-50, -100?)
    // Regalia: 0,0
    // Charon: -80, -120 (approx)
    // Fort: -20, -40
    // Mine: -50, -80

    const newLocations = [
        {
            slug: 'loc_white_fort',
            name: '白亜の砦',
            type: 'fort',
            description: '王都と帝都を結ぶ街道の要所。白い石壁が特徴。',
            x: -20,
            y: -40,
            danger_level: 2,
            country_id: 'Roland' // Assuming Roland territory
        },
        {
            slug: 'loc_iron_mine',
            name: '鉄の鉱山村',
            type: 'village',
            description: '豊富な鉄鉱石が採れる村。鍛冶屋が多い。',
            x: -50,
            y: -80,
            danger_level: 3,
            country_id: 'Empire' // Near Empire
        }
    ];

    const { data: countries } = await supabase.from('countries').select('id, name');
    const roland = countries.find(c => c.name === 'Roland' || c.id === 'Roland')?.id || 'Roland'; // Fallback
    const empire = countries.find(c => c.name === 'Empire' || c.id === 'Empire')?.id || 'Empire'; // Fallback

    // Adjust IDs
    newLocations[0].country_id = roland;
    newLocations[1].country_id = empire;

    for (const loc of newLocations) {
        const { data, error } = await supabase
            .from('locations')
            .upsert(loc, { onConflict: 'slug' })
            .select();

        if (error) console.error(`Error inserting ${loc.name}:`, error);
        else console.log(`Inserted/Updated: ${loc.name}`, data[0].id);
    }
}

insertMissingLocations();
