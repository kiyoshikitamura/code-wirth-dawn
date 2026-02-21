
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateQuestFlow() {
    console.log("--- UPDATING QUEST FLOW (Hubs & Battle Fix) ---");

    const newFlow = [
        // 1. Start & Join
        {
            id: 'start',
            type: 'dialogue',
            text: '「帝都カロンへの護衛をお願いしたい。道中、いくつかの拠点を経由することになるだろう。」',
            choices: [{ label: '引き受ける', next: 'guest_join' }]
        },
        {
            id: 'guest_join',
            type: 'guest_join',
            params: { guest_id: 'npc_alchemist_zoe' },
            next: 'intro_zoe'
        },
        {
            id: 'intro_zoe',
            type: 'dialogue',
            text: '怪しい錬金術師「ふふ、よろしく頼むよ。私の実験材料...いや、護衛としてね。」',
            choices: [{ label: '出発する (白亜の砦へ)', next: 'move_fort' }]
        },

        // 2. Leg 1: Regalia -> Fort
        {
            id: 'move_fort',
            type: 'travel',
            params: { target_location_slug: 'loc_white_fort' },
            encounter_rate: 0.4,
            next_node_success: 'arrive_fort',
            next_node_battle: 'battle_1'
        },
        {
            id: 'battle_1',
            type: 'battle',
            enemy_group_id: 'wolf_shadow',
            next: 'arrive_fort'
        },

        // 3. Hub: White Fortress
        {
            id: 'arrive_fort',
            type: 'dialogue', // Or specialized 'hub' type if engine supports, but choices works
            text: '白亜の砦に到着した。ここで休憩するか、先へ急ぐか選べるようだ。',
            bg_key: 'city_castle',
            choices: [
                { label: '休憩する (HP回復)', next: 'rest_fort' },
                { label: '補給する (特別商店)', next: 'shop_fort' },
                { label: '出発する (鉄の鉱山村へ)', next: 'move_mine' }
            ]
        },
        {
            id: 'rest_fort',
            type: 'dialogue',
            action: 'heal_partial', // ScenarioEngine supports this
            text: '砦の兵舎で少し休ませてもらった。(HPが回復した)',
            choices: [{ label: '戻る', next: 'arrive_fort' }] // Loop back to hub choice
        },
        {
            id: 'shop_fort',
            type: 'shop_special', // Changed to shop_special
            next: 'arrive_fort'
        },

        // 4. Leg 2: Fort -> Mine
        {
            id: 'move_mine',
            type: 'travel',
            params: { target_location_slug: 'loc_iron_mine' },
            encounter_rate: 0.5,
            next_node_success: 'arrive_mine',
            next_node_battle: 'battle_2'
        },
        {
            id: 'battle_2',
            type: 'battle',
            enemy_group_id: 'wolf_shadow',
            next: 'arrive_mine'
        },

        // 5. Hub: Iron Mine
        {
            id: 'arrive_mine',
            type: 'dialogue',
            text: '鉄の鉱山村に到着した。活気のある声が聞こえてくる。',
            bg_key: 'city_market',
            choices: [
                { label: '休憩する (HP回復)', next: 'rest_mine' },
                { label: '補給する (特別商店)', next: 'shop_mine' },
                { label: '出発する (帝都カロンへ)', next: 'move_capital' }
            ]
        },
        {
            id: 'rest_mine',
            type: 'dialogue',
            action: 'heal_partial',
            text: '鉱夫たちの宿舎で休ませてもらった。(HPが回復した)',
            choices: [{ label: '戻る', next: 'arrive_mine' }]
        },
        {
            id: 'shop_mine',
            type: 'shop_special', // Changed to shop_special
            next: 'arrive_mine'
        },

        // 6. Leg 3: Mine -> Capital
        {
            id: 'move_capital',
            type: 'travel',
            params: { target_location_slug: 'loc_charon' },
            encounter_rate: 0.6,
            next_node_success: 'arrive_capital',
            next_node_battle: 'battle_3'
        },
        {
            id: 'battle_3',
            type: 'battle',
            enemy_group_id: 'wolf_shadow',
            next: 'arrive_capital'
        },

        // 7. Endpoint
        {
            id: 'arrive_capital',
            type: 'dialogue',
            text: 'ついに帝都カロンに到着した。長旅だったが、無事に送り届けることができたようだ。',
            bg_key: 'city_castle',
            choices: [{ label: '報酬を受け取る', next: 'complete' }]
        },
        {
            id: 'complete', // Alias for end logic
            type: 'end',
            result: 'success'
        },
        {
            id: 'end', // Safe fallback
            type: 'end',
            result: 'success'
        }
    ];

    const { error: uErr } = await supabase
        .from('scenarios')
        .update({ flow_nodes: newFlow })
        .eq('slug', 'quest_escort_empire_v1');

    if (uErr) console.error("Quest Update Error:", uErr);
    else console.log("Quest Updated with Intermediate Hubs.");
}

updateQuestFlow();
