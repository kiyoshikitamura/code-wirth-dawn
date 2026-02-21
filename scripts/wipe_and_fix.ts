
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function wipeAndFix() {
    console.log("WIPING LOCATIONS...");

    // 1. Get Hub ID
    const { data: hub } = await supabase.from('locations').select('id').eq('slug', 'loc_hub').single();
    if (!hub) throw new Error("HUB NOT FOUND");

    // 2. Clear FK dependencies targeting old locations
    const { data: oldLocs } = await supabase.from('locations').select('id, name').neq('slug', 'loc_hub');
    if (oldLocs && oldLocs.length > 0) {
        const ids = oldLocs.map(l => l.id);
        const names = oldLocs.map(l => l.name);
        console.log(`Clearing dependencies for ${ids.length} locations...`);

        await supabase.from('prayer_logs').delete().in('location_id', ids);
        await supabase.from('reputations').delete().in('location_id', ids);
        await supabase.from('user_profiles').update({ current_location_id: hub.id }).in('current_location_id', ids); // Keep this line, but modify to use 'in'
        await supabase.from('scenarios').update({ location_id: null }).in('location_id', ids);
        await supabase.from('npcs').update({ current_location_id: null }).in('current_location_id', ids);
        await supabase.from('world_states').delete().in('location_name', names);
        await supabase.from('world_histories').delete().in('location_name', names);

        // 3. Delete all other locations
        const { error: delErr } = await supabase.from('locations').delete().in('id', ids);
        if (delErr) console.error("DELETE ERR:", delErr);
        else console.log("WIPE SUCCESS.");
    }

    // 4. Run the fix logic (Inlined for reliability)
    const LOCATIONS = [
        { slug: 'loc_regalia', name: '王都レガリア', type: 'Capital', nation_id: 'Roland', map_x: 20, map_y: 80, neighbors: { 'loc_white_fort': 2, 'loc_port_city': 3, 'loc_border_town': 4 }, description: 'ローランド聖帝国の首都。' },
        { slug: 'loc_white_fort', name: '白亜の砦', type: 'Fort', nation_id: 'Roland', map_x: 35, map_y: 70, neighbors: { 'loc_regalia': 2, 'loc_iron_mine': 3, 'loc_plains_city': 4 }, description: '堅牢な砦。' },
        { slug: 'loc_port_city', name: '港町', type: 'City', nation_id: 'Roland', map_x: 10, map_y: 90, neighbors: { 'loc_regalia': 3, 'loc_resort': 5 }, description: '活気ある港町。' },
        { slug: 'loc_border_town', name: '国境の町', type: 'Town', nation_id: 'Roland', map_x: 10, map_y: 60, neighbors: { 'loc_regalia': 4, 'loc_iron_mine': 3, 'loc_frontier_village': 5 }, description: '静かな町。' },
        { slug: 'loc_iron_mine', name: '鉄の鉱山村', type: 'Town', nation_id: 'Roland', map_x: 25, map_y: 55, neighbors: { 'loc_border_town': 3, 'loc_white_fort': 3, 'loc_valley': 4, 'loc_monitor_post': 4 }, description: '鉄鉱石が採れる村。' },
        { slug: 'loc_meridia', name: '黄金都市イスハーク', type: 'Capital', nation_id: 'Markand', map_x: 80, map_y: 50, neighbors: { 'loc_market_town': 2, 'loc_oasis': 3, 'loc_highland': 4 }, description: '砂塵の王国の首都。' },
        { slug: 'loc_market_town', name: '市場町', type: 'Town', nation_id: 'Markand', map_x: 70, map_y: 60, neighbors: { 'loc_meridia': 2, 'loc_plains_city': 3 }, description: '巨大市場。' },
        { slug: 'loc_oasis', name: 'オアシスの村', type: 'Town', nation_id: 'Markand', map_x: 65, map_y: 40, neighbors: { 'loc_meridia': 3, 'loc_ancient_ruins': 4, 'loc_monitor_post': 5 }, description: '休息の地。' },
        { slug: 'loc_plains_city', name: '平原の都市', type: 'City', nation_id: 'Markand', map_x: 50, map_y: 60, neighbors: { 'loc_white_fort': 4, 'loc_market_town': 3, 'loc_north_fort': 4 }, description: '交通の要衝。' },
        { slug: 'loc_highland', name: '高原の村', type: 'Village', nation_id: 'Markand', map_x: 90, map_y: 30, neighbors: { 'loc_meridia': 4, 'loc_ancient_ruins': 3 }, description: '高原の村。' },
        { slug: 'loc_yato', name: '神都「出雲」', type: 'Capital', nation_id: 'Yato', map_x: 20, map_y: 20, neighbors: { 'loc_temple_town': 2, 'loc_valley': 3, 'loc_resort': 4 }, description: '夜刀神国の首都。' },
        { slug: 'loc_temple_town', name: '門前町', type: 'Town', nation_id: 'Yato', map_x: 30, map_y: 30, neighbors: { 'loc_yato': 2, 'loc_monitor_post': 3 }, description: '門前町。' },
        { slug: 'loc_valley', name: '谷間の集落', type: 'Village', nation_id: 'Yato', map_x: 15, map_y: 40, neighbors: { 'loc_yato': 3, 'loc_iron_mine': 4, 'loc_frontier_village': 3 }, description: '谷間の集落。' },
        { slug: 'loc_frontier_village', name: '最果ての村', type: 'Village', nation_id: 'Yato', map_x: 5, map_y: 50, neighbors: { 'loc_border_town': 5, 'loc_valley': 3 }, description: '世界の果ての村。' },
        { slug: 'loc_resort', name: '保養地', type: 'Town', nation_id: 'Yato', map_x: 10, map_y: 10, neighbors: { 'loc_yato': 4, 'loc_port_city': 6 }, description: '湯治場。' },
        { slug: 'loc_charon', name: '天極城「龍京」', type: 'Capital', nation_id: 'Karyu', map_x: 60, map_y: 20, neighbors: { 'loc_north_fort': 2, 'loc_coliseum': 3, 'loc_ancient_ruins': 4 }, description: '華龍神朝の首都。' },
        { slug: 'loc_north_fort', name: '北の防衛砦', type: 'Fort', nation_id: 'Karyu', map_x: 50, map_y: 30, neighbors: { 'loc_charon': 2, 'loc_plains_city': 4, 'loc_monitor_post': 3 }, description: '軍事拠点。' },
        { slug: 'loc_monitor_post', name: '監視哨', type: 'Fort', nation_id: 'Karyu', map_x: 40, map_y: 40, neighbors: { 'loc_north_fort': 3, 'loc_iron_mine': 4, 'loc_temple_town': 3, 'loc_oasis': 5 }, description: '監視塔。' },
        { slug: 'loc_ancient_ruins', name: '古代遺跡の町', type: 'Town', nation_id: 'Karyu', map_x: 75, map_y: 30, neighbors: { 'loc_charon': 4, 'loc_oasis': 4, 'loc_highland': 3 }, description: '古代の遺跡。' },
        { slug: 'loc_coliseum', name: '闘技都市', type: 'City', nation_id: 'Karyu', map_x: 70, map_y: 10, neighbors: { 'loc_charon': 3 }, description: '強者が集う都市。' }
    ];

    for (const loc of LOCATIONS) {
        process.stdout.write(`Inserting ${loc.slug}... `);
        const { error: locErr } = await supabase.from('locations').insert({
            slug: loc.slug, name: loc.name, type: loc.type, nation_id: loc.nation_id, description: loc.description,
            map_x: loc.map_x, map_y: loc.map_y, x: loc.map_x, y: loc.map_y, neighbors: loc.neighbors,
            ruling_nation_id: loc.nation_id, prosperity_level: 3,
            connections: Object.keys(loc.neighbors)
        });
        if (locErr) {
            console.log("FAIL");
            console.error(`Error for ${loc.slug}:`, JSON.stringify(locErr, null, 2));
        } else {
            console.log("OK");
        }

        const { error: wsErr } = await supabase.from('world_states').upsert({
            location_name: loc.name, controlling_nation: loc.nation_id, status: 'Prosperous', attribute_name: '至高の平穏',
            order_score: 10, chaos_score: 10, justice_score: 10, evil_score: 10, background_url: '/backgrounds/default.jpg', total_days_passed: 0
        }, { onConflict: 'location_name' });
        if (wsErr) console.error(`WS Error for ${loc.name}:`, wsErr);
    }
    console.log("RE-SYNC ATTEMPT COMPLETE.");
}

async function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
wipeAndFix();
