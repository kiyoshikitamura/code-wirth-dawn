
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const QUEST_DATA = {
    slug: 'quest_escort_empire_v1',
    title: '帝都への要人護衛',
    description: '王都から帝都カロンへ向かう錬金術師の護衛任務。長路となるため、準備を怠らないように。',
    client_name: '怪しい錬金術師', // Updated client
    type: 'Delivery',
    difficulty: 3,
    rec_level: 5,
    is_urgent: true,
    time_cost: 0,
    ruling_nation_id: 'Roland',
    conditions: { min_level: 5 },
    rewards: { gold: 5000, reputation_diff: { loc_regalia: 10, loc_charon: 10 } },
    flow_nodes: [
        {
            id: 'start',
            type: 'dialogue',
            text: '「ククク... 君が護衛か？ 帝都カロンまで私の研究成果を届けたいのだ。邪魔が入らぬよう頼むよ。」',
            bg_key: '/backgrounds/castle_gate.jpg',
            choices: [{ label: '出発する', next_node: 'guest_join' }] // Join first
        },
        {
            id: 'guest_join',
            type: 'guest_join',
            params: { guest_id: '4014' }, // Alchemist Zoe ID
            next: 'move_fort'
        },
        // Leg 1: Arcadia -> White Fort
        {
            id: 'move_fort',
            type: 'travel',
            target_location_slug: 'loc_jgxgj3', // White Fort
            text_start: '王都を後にし、白亜の砦を目指す。',
            encounter_rate: 0.5,
            next_node_battle: 'battle_1',
            next_node_success: 'arrive_fort'
        },
        {
            id: 'battle_1',
            type: 'battle',
            enemy_group_id: 'wolf_shadow', // Shadow Wolf Slug
            next_node: 'arrive_fort'
        },
        {
            id: 'arrive_fort',
            type: 'dialogue',
            text: '白亜の砦に到着した。「ふむ、ここまでは順調か。少し実験道具の整理をさせてもらおう。」',
            bg_key: '/backgrounds/fort.jpg',
            action: 'heal_partial',
            choices: [{ label: '先を急ぐ (鉄の鉱山村へ)', next_node: 'move_mine' }]
        },
        // Leg 2: White Fort -> Iron Mine
        {
            id: 'move_mine',
            type: 'travel',
            target_location_slug: 'loc_d0etgt', // Iron Mine
            text_start: '街道を南下し、鉄の鉱山村へ向かう。',
            encounter_rate: 0.6,
            next_node_battle: 'battle_2',
            next_node_success: 'arrive_mine'
        },
        {
            id: 'battle_2',
            type: 'battle',
            enemy_group_id: 'wolf_shadow', // Shadow Wolf
            next_node: 'arrive_mine'
        },
        {
            id: 'arrive_mine',
            type: 'dialogue',
            text: '鉄の鉱山村に辿り着いた。「鉄の匂い... 興奮するねえ。だが長居は無用だ。」',
            bg_key: '/backgrounds/mine.jpg',
            choices: [{ label: '帝都へ向かう', next_node: 'move_capital' }]
        },
        // Leg 3: Iron Mine -> Karon
        {
            id: 'move_capital',
            type: 'travel',
            target_location_slug: 'loc_charon', // Karon
            text_start: '最後の難所を越え、帝都カロンを目指す。',
            encounter_rate: 0.7,
            next_node_battle: 'battle_3',
            next_node_success: 'arrive_capital'
        },
        {
            id: 'battle_3',
            type: 'battle',
            enemy_group_id: 'wolf_shadow', // Shadow Wolf
            next_node: 'arrive_capital'
        },
        {
            id: 'arrive_capital',
            type: 'dialogue',
            text: '帝都カロンに到着した。「素晴らしい護衛だったよ。これが報酬だ。また縁があれば頼む。」',
            bg_key: '/backgrounds/empire_city.jpg',
            choices: [{ label: '報酬を受け取る', next_node: 'complete' }]
        },
        {
            id: 'complete',
            type: 'process_rewards',
            next_node: 'end'
        }
    ]
};

async function insertQuest() {
    // 1. Get Location ID
    const { data: loc } = await supabase.from('locations').select('id').eq('slug', 'loc_regalia').single();
    if (!loc) { console.error('Location not found'); return; }

    // 2. Insert Scenario
    const { data, error } = await supabase
        .from('scenarios')
        .upsert([{
            ...QUEST_DATA,
            location_id: loc.id
        }], { onConflict: 'slug' })
        .select();

    if (error) console.error('Insert Error:', error);
    else console.log('Quest Updated:', data[0].title);
}

insertQuest();
