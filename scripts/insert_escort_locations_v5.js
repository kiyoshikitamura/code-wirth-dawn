
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertMissingLocations() {
    console.log("--- INSERTING MISSING LOCATIONS (CONFLICT FIX) ---");

    const newLocations = [
        {
            slug: 'loc_white_fort',
            name: '白亜の砦',
            type: 'fort',
            description: '王都と帝都を結ぶ街道の要所。白い石壁が特徴。',
            x: -20,
            y: -40,
            ruling_nation_id: 'Roland'
        },
        {
            slug: 'loc_iron_mine',
            name: '鉄の鉱山村',
            type: 'village',
            description: '豊富な鉄鉱石が採れる村。鍛冶屋が多い。',
            x: -50,
            y: -80,
            ruling_nation_id: 'Empire'
        }
    ];

    for (const loc of newLocations) {
        // First check if name exists under different slug
        const { data: existing } = await supabase.from('locations').select('slug').eq('name', loc.name).single();
        if (existing && existing.slug !== loc.slug) {
            console.log(`Name conflict for ${loc.name} with ${existing.slug}. Modifying name.`);
            loc.name = loc.name + " (Quest)";
        }

        const { data, error } = await supabase
            .from('locations')
            .upsert(loc, { onConflict: 'slug' })
            .select();

        if (error) {
            console.error(`Error inserting ${loc.name}:`, JSON.stringify(error, null, 2));
            // Try without ruling_nation_id if FK fails
            if (error.code === '23503') { // FK violation
                console.log("Retrying without nation ID...");
                delete loc.ruling_nation_id;
                const { data: retry, error: retryErr } = await supabase
                    .from('locations')
                    .upsert(loc, { onConflict: 'slug' })
                    .select();
                if (retryErr) console.error("Retry Error:", retryErr);
                else console.log(`Retry Success: ${loc.name}`);
            }
        } else {
            console.log(`Inserted/Updated: ${loc.name} (ID: ${data[0].id})`);
        }
    }
}

insertMissingLocations();
