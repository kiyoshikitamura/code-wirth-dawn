
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
    // Roland (North West) - Blue
    { name: '王都アーカディア', x: 200, y: 200 },
    { name: '聖教会都市', x: 320, y: 150 },
    { name: '騎士団駐屯地', x: 120, y: 300 },
    { name: '巡礼の宿場町', x: 300, y: 320 },
    { name: '白亜の砦', x: 150, y: 120 },

    // Markand (North East) - Yellow
    { name: '交易都市メリディア', x: 800, y: 200 },
    { name: 'カジノタウン', x: 880, y: 150 },
    { name: '自由の関所', x: 650, y: 280 },
    { name: 'オアシスの村', x: 800, y: 350 },
    { name: 'スラム街', x: 720, y: 180 },

    // Karyu (South West) - Emerald
    { name: '帝都カロン', x: 200, y: 800 },
    { name: '処刑場の街', x: 120, y: 750 },
    { name: 'カロン国境砦', x: 320, y: 720 },
    { name: '鉄の鉱山村', x: 250, y: 650 },
    { name: '地下監獄', x: 150, y: 880 },

    // Yato (South East) - Purple
    { name: '神都ヤト', x: 800, y: 800 },
    { name: '黄泉の門前町', x: 680, y: 750 },
    { name: '彼岸花の里', x: 880, y: 820 },
    { name: '霧の渡し守', x: 750, y: 650 },
    { name: '呪われた廃村', x: 650, y: 850 },

    // Neutral
    { name: '名もなき旅人の拠所', x: 500, y: 500 }
];

async function updateLocations() {
    console.log('Updating location coordinates...');

    for (const loc of updates) {
        const { error } = await supabase
            .from('locations')
            .update({ x: loc.x, y: loc.y })
            .eq('name', loc.name);

        if (error) {
            console.error(`Failed to update ${loc.name}:`, error);
        } else {
            console.log(`Updated ${loc.name} to (${loc.x}, ${loc.y})`);
        }
    }
    console.log('Done.');
}

updateLocations();
