
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define 20 Locations with Topology
// Map Size: 1000x1000
// Roland (Order): Center-North [500, 300]
// Markand (Trade): West [200, 500]
// Karyu (Chaos): East [800, 300]
// Yato (Evil): South-East [800, 800]
// Neutral/Frontier: South-West [300, 700]

const locations = [
    // --- The Holy Empire of Roland (Order) ---
    {
        id: 'loc_regalia',
        name: '王都レガリア',
        ruling_nation_id: 'nation_roland',
        map_x: 500,
        map_y: 300,
        prosperity_level: 4,
        neighbors: {
            'loc_north_fort': { days: 1, type: 'road' },
            'loc_church_village': { days: 2, type: 'road' },
            'loc_crossroad': { days: 3, type: 'road' }
        }
    },
    {
        id: 'loc_north_fort',
        name: '北の砦',
        ruling_nation_id: 'nation_roland',
        map_x: 500,
        map_y: 150,
        prosperity_level: 3,
        neighbors: {
            'loc_regalia': { days: 1, type: 'road' },
            'loc_snow_peaks': { days: 2, type: 'mountain' }
        }
    },
    {
        id: 'loc_church_village',
        name: '教会領の村',
        ruling_nation_id: 'nation_roland',
        map_x: 600,
        map_y: 350,
        prosperity_level: 3,
        neighbors: {
            'loc_regalia': { days: 2, type: 'road' },
            'loc_plains_outpost': { days: 2, type: 'plains' }
        }
    },
    {
        id: 'loc_snow_peaks',
        name: '白銀の山嶺',
        ruling_nation_id: 'nation_roland',
        map_x: 450,
        map_y: 50,
        prosperity_level: 2,
        neighbors: {
            'loc_north_fort': { days: 2, type: 'mountain' },
            'loc_ancient_ruins': { days: 3, type: 'rough' } // Secret path
        }
    },
    {
        id: 'loc_port_city', // Shared with Markand access?
        name: '港湾都市リーベ',
        ruling_nation_id: 'nation_roland',
        map_x: 400,
        map_y: 400,
        prosperity_level: 5,
        neighbors: {
            'loc_regalia': { days: 2, type: 'road' },
            'loc_grand_bazaar': { days: 4, type: 'sea' }
        }
    },

    // --- The Trade Federation of Markand (Neutral/Profit) ---
    {
        id: 'loc_grand_bazaar',
        name: '大市場マルカンド',
        ruling_nation_id: 'nation_markand',
        map_x: 200,
        map_y: 500,
        prosperity_level: 5,
        neighbors: {
            'loc_port_city': { days: 4, type: 'sea' },
            'loc_oasis_town': { days: 2, type: 'desert' },
            'loc_crossroad': { days: 3, type: 'road' }
        }
    },
    {
        id: 'loc_oasis_town',
        name: '砂漠のオアシス',
        ruling_nation_id: 'nation_markand',
        map_x: 150,
        map_y: 600,
        prosperity_level: 3,
        neighbors: {
            'loc_grand_bazaar': { days: 2, type: 'desert' },
            'loc_salt_lake': { days: 1, type: 'desert' }
        }
    },
    {
        id: 'loc_salt_lake',
        name: '塩の湖',
        ruling_nation_id: 'nation_markand',
        map_x: 100,
        map_y: 550,
        prosperity_level: 2,
        neighbors: {
            'loc_oasis_town': { days: 1, type: 'desert' },
            'loc_mining_pit': { days: 3, type: 'rough' }
        }
    },
    {
        id: 'loc_mining_pit',
        name: '大鉱脈',
        ruling_nation_id: 'nation_markand',
        map_x: 250,
        map_y: 650,
        prosperity_level: 2,
        neighbors: {
            'loc_salt_lake': { days: 3, type: 'rough' },
            'loc_frontier_town': { days: 2, type: 'road' }
        }
    },
    {
        id: 'loc_crossroad',
        name: '交易路の十字路',
        ruling_nation_id: 'nation_markand',
        map_x: 350,
        map_y: 450,
        prosperity_level: 4,
        neighbors: {
            'loc_grand_bazaar': { days: 3, type: 'road' },
            'loc_regalia': { days: 3, type: 'road' },
            'loc_frontier_town': { days: 2, type: 'road' }
        }
    },

    // --- The Karyu Alliance (Chaos/Fire) ---
    {
        id: 'loc_dragon_peak',
        name: '竜の頂',
        ruling_nation_id: 'nation_karyu',
        map_x: 800,
        map_y: 300,
        prosperity_level: 4,
        neighbors: {
            'loc_magma_chamber': { days: 1, type: 'volcano' },
            'loc_ash_plains': { days: 2, type: 'rough' }
        }
    },
    {
        id: 'loc_magma_chamber',
        name: 'マグマ溜まり',
        ruling_nation_id: 'nation_karyu',
        map_x: 850,
        map_y: 250,
        prosperity_level: 1,
        neighbors: {
            'loc_dragon_peak': { days: 1, type: 'volcano' },
            'loc_crimson_shrine': { days: 2, type: 'volcano' }
        }
    },
    {
        id: 'loc_ash_plains',
        name: '灰の平原',
        ruling_nation_id: 'nation_karyu',
        map_x: 700,
        map_y: 350,
        prosperity_level: 2,
        neighbors: {
            'loc_dragon_peak': { days: 2, type: 'rough' },
            'loc_plains_outpost': { days: 3, type: 'plains' }
        }
    },
    {
        id: 'loc_forge_city',
        name: '鍛冶都市バルカン',
        ruling_nation_id: 'nation_karyu',
        map_x: 750,
        map_y: 200,
        prosperity_level: 5,
        neighbors: {
            'loc_dragon_peak': { days: 1, type: 'road' },
            'loc_ash_plains': { days: 2, type: 'road' }
        }
    },
    {
        id: 'loc_crimson_shrine',
        name: '紅蓮の祠',
        ruling_nation_id: 'nation_karyu',
        map_x: 900,
        map_y: 200,
        prosperity_level: 3,
        neighbors: {
            'loc_magma_chamber': { days: 2, type: 'volcano' }
        }
    },

    // --- The Yato Shogunate (Evil/Night) ---
    {
        id: 'loc_izumo',
        name: '神都出雲',
        ruling_nation_id: 'nation_yato',
        map_x: 800,
        map_y: 800,
        prosperity_level: 5,
        neighbors: {
            'loc_ghost_forest': { days: 2, type: 'forest' },
            'loc_moon_tower': { days: 1, type: 'road' }
        }
    },
    {
        id: 'loc_ghost_forest',
        name: '亡霊の森',
        ruling_nation_id: 'nation_yato',
        map_x: 700,
        map_y: 700,
        prosperity_level: 2,
        neighbors: {
            'loc_izumo': { days: 2, type: 'forest' },
            'loc_cursed_swamp': { days: 3, type: 'swamp' },
            'loc_frontier_town': { days: 4, type: 'forest' }
        }
    },
    {
        id: 'loc_moon_tower',
        name: '月読の塔',
        ruling_nation_id: 'nation_yato',
        map_x: 850,
        map_y: 750,
        prosperity_level: 4,
        neighbors: {
            'loc_izumo': { days: 1, type: 'road' },
            'loc_underworld_gate': { days: 2, type: 'dungeon' }
        }
    },
    {
        id: 'loc_underworld_gate',
        name: '黄泉比良坂',
        ruling_nation_id: 'nation_yato',
        map_x: 900,
        map_y: 850,
        prosperity_level: 1,
        neighbors: {
            'loc_moon_tower': { days: 2, type: 'dungeon' }
        }
    },
    {
        id: 'loc_cursed_swamp',
        name: '呪われた沼地',
        ruling_nation_id: 'nation_yato',
        map_x: 650,
        map_y: 800,
        prosperity_level: 1,
        neighbors: {
            'loc_ghost_forest': { days: 3, type: 'swamp' }
        }
    },

    // --- Frontier / Connectors ---
    {
        id: 'loc_frontier_town',
        name: '辺境の宿場町',
        ruling_nation_id: 'nation_neutral',
        map_x: 400,
        map_y: 600,
        prosperity_level: 3,
        neighbors: {
            'loc_crossroad': { days: 2, type: 'road' },
            'loc_mining_pit': { days: 2, type: 'road' },
            'loc_ghost_forest': { days: 4, type: 'forest' }
        }
    },
    {
        id: 'loc_plains_outpost',
        name: '平原の前哨基地',
        ruling_nation_id: 'nation_neutral',
        map_x: 650,
        map_y: 450,
        prosperity_level: 3,
        neighbors: {
            'loc_church_village': { days: 2, type: 'plains' },
            'loc_ash_plains': { days: 3, type: 'plains' }
        }
    },
    {
        id: 'loc_ancient_ruins',
        name: '古代遺跡',
        ruling_nation_id: 'nation_neutral',
        map_x: 50,
        map_y: 50,
        prosperity_level: 1,
        neighbors: {
            'loc_snow_peaks': { days: 3, type: 'rough' }
        }
    }
];

// Helper to calculate distance (optional usage for validation)
function getDist(a: any, b: any) {
    return Math.sqrt(Math.pow(a.map_x - b.map_x, 2) + Math.pow(a.map_y - b.map_y, 2));
}

async function main() {
    console.log(`Checking DB connection...`);
    const { data: test, error: testError } = await supabase.from('locations').select('id').limit(1);
    if (testError) {
        console.error('DB Connection Failed:', testError);
        return;
    }
    console.log(`Connected. Seeding ${locations.length} locations...`);

    for (const loc of locations) {
        const { error } = await supabase
            .from('locations')
            .upsert({
                id: loc.id,
                name: loc.name,
                ruling_nation_id: loc.ruling_nation_id,
                map_x: loc.map_x,
                map_y: loc.map_y,
                prosperity_level: loc.prosperity_level,
                neighbors: loc.neighbors,
                // Defaults/Placeholders
                description: `Location in ${loc.ruling_nation_id}`,
                current_attributes: { order: 0, chaos: 0, justice: 0, evil: 0 }
            }, { onConflict: 'id' });

        if (error) {
            console.error(`Error on ${loc.id}:`, error);
        } else {
            console.log(`Upserted: ${loc.name}`);
        }
    }
    console.log('Seeding Complete.');
}

main();
