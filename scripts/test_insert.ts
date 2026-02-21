
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testInsert() {
    const loc = { slug: 'loc_regalia', name: '王都レガリア', type: 'Capital', nation_id: 'Roland', map_x: 20, map_y: 80, neighbors: { 'loc_white_fort': 2, 'loc_port_city': 3, 'loc_border_town': 4 }, description: 'ローランド聖帝国の首都。' };
    const { error } = await supabase.from('locations').insert({
        slug: loc.slug, name: loc.name, type: loc.type, nation_id: loc.nation_id, description: loc.description,
        map_x: loc.map_x, map_y: loc.map_y, x: loc.map_x, y: loc.map_y, neighbors: loc.neighbors,
        ruling_nation_id: loc.nation_id, prosperity_level: 3,
        connections: Object.keys(loc.neighbors)
    });
    if (error) console.error("INSERT ERROR:", JSON.stringify(error, null, 2));
    else console.log("INSERT SUCCESS");
}

testInsert();
