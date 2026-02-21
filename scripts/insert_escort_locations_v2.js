
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertMissingLocations() {
    console.log("--- INSERTING MISSING LOCATIONS ---");

    // Fetch Countries 
    let { data: countries, error: cErr } = await supabase.from('countries').select('id, name');

    // Fallback if country table is empty/error or doesn't have these
    // Assuming 'Roland' and 'Empire' are valid foreign keys or we need to insert them?
    // Let's assume ID 'Roland' exists as text ID or we find by name.

    let rolandId = 'Roland';
    let empireId = 'Empire';

    if (countries && countries.length > 0) {
        const r = countries.find(c => c.name === 'Roland' || c.id === 'Roland');
        if (r) rolandId = r.id;
        const e = countries.find(c => c.name === 'Empire' || c.id === 'Empire');
        if (e) empireId = e.id;
    }

    console.log(`Using Country IDs: Roland=${rolandId}, Empire=${empireId}`);

    const newLocations = [
        {
            slug: 'loc_white_fort',
            name: '白亜の砦',
            type: 'fort',
            description: '王都と帝都を結ぶ街道の要所。白い石壁が特徴。',
            x: -20,
            y: -40,
            danger_level: 2,
            country_id: rolandId
        },
        {
            slug: 'loc_iron_mine',
            name: '鉄の鉱山村',
            type: 'village',
            description: '豊富な鉄鉱石が採れる村。鍛冶屋が多い。',
            x: -50,
            y: -80,
            danger_level: 3,
            country_id: empireId
        }
    ];

    for (const loc of newLocations) {
        const { data, error } = await supabase
            .from('locations')
            .upsert(loc, { onConflict: 'slug' })
            .select();

        if (error) {
            console.error(`Error inserting ${loc.name}:`, error);
        } else {
            console.log(`Inserted/Updated: ${loc.name} (ID: ${data[0].id})`);
        }
    }
}

insertMissingLocations();
