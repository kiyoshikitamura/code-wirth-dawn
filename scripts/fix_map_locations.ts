
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Static Map Data Definition ---

// Nation ID Mapping for clarity:
// Roland (Order), Markand (Chaos), Yato (Justice), Karyu (Evil)

type NeighborDef = Record<string, number>; // slug -> days

interface LocDef {
    slug: string;
    name: string;
    type: string;
    nation_id: string; // Initial Ruling Nation
    description: string;
    map_x: number;
    map_y: number;
    neighbors: NeighborDef;
}

const LOCATIONS: LocDef[] = [
    // --- 1. Roland (Order) ---
    {
        slug: 'loc_regalia', name: '王都レガリア', type: 'Capital', nation_id: 'Roland',
        description: 'ローランド聖帝国の首都。白き城壁が輝く秩序の象徴。',
        map_x: 20, map_y: 80,
        neighbors: { 'loc_white_fort': 2, 'loc_port_city': 3, 'loc_border_town': 4 }
    },
    {
        slug: 'loc_white_fort', name: '白亜の砦', type: 'Fort', nation_id: 'Roland',
        description: '王都を守護する堅牢な砦。',
        map_x: 35, map_y: 70,
        neighbors: { 'loc_regalia': 2, 'loc_iron_mine': 3, 'loc_plains_city': 4 }
    },
    {
        slug: 'loc_port_city', name: '港町', type: 'City', nation_id: 'Roland',
        description: '異国の船が行き交う活気ある港町。',
        map_x: 10, map_y: 90,
        neighbors: { 'loc_regalia': 3, 'loc_resort': 5 }
    },
    {
        slug: 'loc_border_town', name: '国境の町', type: 'Town', nation_id: 'Roland',
        description: '西の国境に位置する静かな町。',
        map_x: 10, map_y: 60,
        neighbors: { 'loc_regalia': 4, 'loc_iron_mine': 3, 'loc_frontier_village': 5 }
    },
    {
        slug: 'loc_iron_mine', name: '鉄の鉱山村', type: 'Town', nation_id: 'Roland',
        description: '良質な鉄鉱石が採れる村。武具の生産が盛ん。',
        map_x: 25, map_y: 55,
        neighbors: { 'loc_border_town': 3, 'loc_white_fort': 3, 'loc_valley': 4, 'loc_monitor_post': 4 }
    },

    // --- 2. Markand (Chaos) ---
    {
        slug: 'loc_meridia', name: '黄金都市イスハーク', type: 'Capital', nation_id: 'Markand',
        description: '砂塵の王国マルカンドの首都。交易と錬金術の聖地。',
        map_x: 80, map_y: 50,
        neighbors: { 'loc_market_town': 2, 'loc_oasis': 3, 'loc_highland': 4 }
    },
    {
        slug: 'loc_market_town', name: '市場町', type: 'Town', nation_id: 'Markand',
        description: '大陸中から珍しい品々が集まる巨大市場。',
        map_x: 70, map_y: 60,
        neighbors: { 'loc_meridia': 2, 'loc_plains_city': 3 }
    },
    {
        slug: 'loc_oasis', name: 'オアシスの村', type: 'Town', nation_id: 'Markand',
        description: '砂漠の旅人が喉を潤す休息の地。',
        map_x: 65, map_y: 40,
        neighbors: { 'loc_meridia': 3, 'loc_ancient_ruins': 4, 'loc_monitor_post': 5 }
    },
    {
        slug: 'loc_plains_city', name: '平原の都市', type: 'City', nation_id: 'Markand',
        description: '広大な平原の中央に位置する交通の要衝。',
        map_x: 50, map_y: 60,
        neighbors: { 'loc_white_fort': 4, 'loc_market_town': 3, 'loc_north_fort': 4 }
    },
    {
        slug: 'loc_highland', name: '高原の村', type: 'Village', nation_id: 'Markand',
        description: '涼しい風が吹き抜ける高原の村。',
        map_x: 90, map_y: 30,
        neighbors: { 'loc_meridia': 4, 'loc_ancient_ruins': 3 }
    },

    // --- 3. Yato (Justice) ---
    {
        slug: 'loc_yato', name: '神都「出雲」', type: 'Capital', nation_id: 'Yato',
        description: '夜刀神国の首都。八百万の神々を祀るいにしえの都。',
        map_x: 20, map_y: 20,
        neighbors: { 'loc_temple_town': 2, 'loc_valley': 3, 'loc_resort': 4 }
    },
    {
        slug: 'loc_temple_town', name: '門前町', type: 'Town', nation_id: 'Yato',
        description: '参拝客で賑わう門前町。神聖な空気に包まれている。',
        map_x: 30, map_y: 30,
        neighbors: { 'loc_yato': 2, 'loc_monitor_post': 3 }
    },
    {
        slug: 'loc_valley', name: '谷間の集落', type: 'Village', nation_id: 'Yato',
        description: '深い霧に包まれた谷間の集落。',
        map_x: 15, map_y: 40,
        neighbors: { 'loc_yato': 3, 'loc_iron_mine': 4, 'loc_frontier_village': 3 }
    },
    {
        slug: 'loc_frontier_village', name: '最果ての村', type: 'Village', nation_id: 'Yato',
        description: '世界の果てにある静かな村。',
        map_x: 5, map_y: 50,
        neighbors: { 'loc_border_town': 5, 'loc_valley': 3 }
    },
    {
        slug: 'loc_resort', name: '保養地', type: 'Town', nation_id: 'Yato',
        description: '古くから続く湯治場。戦士たちが傷を癒やす。',
        map_x: 10, map_y: 10,
        neighbors: { 'loc_yato': 4, 'loc_port_city': 6 }
    },

    // --- 4. Karyu (Evil) ---
    {
        slug: 'loc_charon', name: '天極城「龍京」', type: 'Capital', nation_id: 'Karyu',
        description: '華龍神朝の首都。力こそが正義。',
        map_x: 60, map_y: 20,
        neighbors: { 'loc_north_fort': 2, 'loc_coliseum': 3, 'loc_ancient_ruins': 4 }
    },
    {
        slug: 'loc_north_fort', name: '北の防衛砦', type: 'Fort', nation_id: 'Karyu',
        description: '帝都への道を扼する軍事拠点。',
        map_x: 50, map_y: 30,
        neighbors: { 'loc_charon': 2, 'loc_plains_city': 4, 'loc_monitor_post': 3 }
    },
    {
        slug: 'loc_monitor_post', name: '監視哨', type: 'Fort', nation_id: 'Karyu',
        description: '街道の安全を守るための監視塔。',
        map_x: 40, map_y: 40,
        neighbors: { 'loc_north_fort': 3, 'loc_iron_mine': 4, 'loc_temple_town': 3, 'loc_oasis': 5 }
    },
    {
        slug: 'loc_ancient_ruins', name: '古代遺跡の町', type: 'Town', nation_id: 'Karyu',
        description: '古代の遺跡の上に築かれた町。禁忌の技術が眠る。',
        map_x: 75, map_y: 30,
        neighbors: { 'loc_charon': 4, 'loc_oasis': 4, 'loc_highland': 3 }
    },
    {
        slug: 'loc_coliseum', name: '闘技都市', type: 'City', nation_id: 'Karyu',
        description: '強者が集い、血と汗が飛び交う熱狂の都市。',
        map_x: 70, map_y: 10,
        neighbors: { 'loc_charon': 3 }
    }
];

// --- Topology Validation ---

function validateTopology(locations: LocDef[]) {
    console.log("Validating topology...");
    const slugMap = new Set(locations.map(l => l.slug));
    const errors: string[] = [];

    // 1. Check for bi-directional consistency
    locations.forEach(loc => {
        Object.entries(loc.neighbors).forEach(([targetSlug, days]) => {
            if (!slugMap.has(targetSlug)) {
                errors.push(`[${loc.name}] targets unknown slug: ${targetSlug}`);
                return;
            }

            const target = locations.find(l => l.slug === targetSlug);
            if (!target) return; // Should not happen

            if (target.neighbors[loc.slug] === undefined) {
                errors.push(`[${loc.name}] -> [${target.name}] exists, but reverse link is missing.`);
            } else if (target.neighbors[loc.slug] !== days) {
                console.warn(`[WARN] Asymmetric travel time: ${loc.name}->${target.name}=${days}, Reverse=${target.neighbors[loc.slug]}`);
            }
        });
    });

    // 2. Check for connectivity (BFS from first node)
    if (locations.length > 0) {
        const visited = new Set<string>();
        const queue = [locations[0].slug];
        visited.add(locations[0].slug);

        while (queue.length > 0) {
            const current = queue.shift()!;
            const loc = locations.find(l => l.slug === current);
            if (!loc) continue;

            Object.keys(loc.neighbors).forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            });
        }

        if (visited.size !== locations.length) {
            const unvisited = locations.filter(l => !visited.has(l.slug)).map(l => l.name);
            errors.push(`Graph is not fully connected. Unreachable nodes: ${unvisited.join(', ')}`);
        }
    }

    if (errors.length > 0) {
        console.error("Topology Validation Failed:");
        errors.forEach(e => console.error("- " + e));
        throw new Error("Topology validation failed. Aborting DB update.");
    }
    console.log("Topology OK.");
}


async function fixLocations() {
    console.log("Starting Graph Update...");

    // Validate first
    try {
        validateTopology(LOCATIONS);
    } catch (e) {
        process.exit(1);
    }

    console.log("Dependencies Cleared. Proceeding to DB update...");

    // 1. Ensure Hub is there (idempotent)
    // We do NOT delete the Hub, but we need its ID to park users.
    const { data: hubData, error: hubError } = await supabase.from('locations').select('id, slug').eq('slug', 'loc_hub').maybeSingle();

    let hubId = hubData?.id;

    if (!hubData) {
        console.log("Creating Hub...");
        const { data: newHub, error: createHubError } = await supabase.from('locations').insert({
            slug: 'loc_hub',
            name: '名もなき旅人の拠所',
            type: 'Hub',
            description: '次元の狭間にある安息の地。',
            x: 0,
            y: 0,
            map_x: null,
            map_y: null,
            nation_id: 'Neutral',
            connections: [] // Legacy field
        }).select('id').single();

        if (createHubError) {
            console.error("Failed to create Hub:", createHubError);
            process.exit(1);
        }
        hubId = newHub.id;
    }

    // 2. Park All Users at Hub
    console.log("Moving users to Hub...");
    await supabase.from('user_profiles').update({ current_location_id: hubId }).neq('id', '00000000-0000-0000-0000-000000000000');

    // 3. Delete Old Locations (Non-Hub)
    // Need to clear dependencies first!

    // Get IDs of non-hub locations to clear references
    const { data: oldLocs } = await supabase.from('locations').select('id, name').neq('slug', 'loc_hub');
    if (oldLocs && oldLocs.length > 0) {
        const ids = oldLocs.map(l => l.id);
        const names = oldLocs.map(l => l.name);

        // Clear Scenarios
        await supabase.from('scenarios').update({ location_id: null }).in('location_id', ids);
        // Clear NPCs
        await supabase.from('npcs').update({ current_location_id: null }).in('current_location_id', ids);
        // Delete World States
        await supabase.from('world_states').delete().in('location_name', names);

        // Finally Delete Locations
        await supabase.from('locations').delete().in('id', ids);
    }

    // 4. Insert New Locations
    console.log("Inserting new locations...");

    for (const loc of LOCATIONS) {
        // Prepare insert payload
        const connections = Object.keys(loc.neighbors); // Legacy array for some UI?

        const payload = {
            slug: loc.slug,
            name: loc.name,
            type: loc.type,
            nation_id: loc.nation_id,
            description: loc.description,
            x: loc.map_x,
            y: loc.map_y,
            map_x: loc.map_x, // Legacy support
            map_y: loc.map_y,
            connections: connections,
            neighbors: loc.neighbors, // The JSONB field
            ruling_nation_id: loc.nation_id,
            prosperity_level: 3,
            current_attributes: { order: 10, chaos: 10, justice: 10, evil: 10 }
        };

        console.log(`Upserting ${loc.name} (${loc.slug})...`);
        const { error: insErr } = await supabase.from('locations').upsert(payload, { onConflict: 'slug' });
        if (insErr) {
            console.error(`Failed to upsert ${loc.name}:`, insErr);
        } else {
            console.log(`Successfully updated ${loc.name}`);
        }
    }

    // 5. Create World States
    console.log("Creating World States...");
    const allLocsForWS = [...LOCATIONS, { slug: 'loc_hub', name: '名もなき旅人の拠所', nation_id: 'Neutral' }];

    for (const loc of allLocsForWS) {
        // Double check not exists
        const { data: exists } = await supabase.from('world_states').select('id').eq('location_name', loc.name).maybeSingle();
        if (!exists) {
            const wsPayload = {
                location_name: loc.name,
                status: 'Prosperous',
                order_score: 10,
                chaos_score: 10,
                justice_score: 10,
                evil_score: 10,
                attribute_name: '至高の平穏',
                flavor_text: '静寂に包まれている。',
                background_url: '/backgrounds/default.jpg',
                total_days_passed: 0,
                controlling_nation: loc.nation_id || 'Neutral'
            };
            const { error: wsErr } = await supabase.from('world_states').insert(wsPayload);
            if (wsErr && !wsErr.message.includes('prosperity_level')) { // Ignore the known schema missing col if any
                console.error(`WS Error for ${loc.name}:`, wsErr);
            }
        }
    }

    console.log("Graph Update Complete.");
}

fixLocations();
