process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://zvoroixjuypnintkpmux.supabase.co";
const supabaseKey = process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // すべてのユーザーでシミュレートしてみる
    const { data: users } = await supabase.from('user_profiles').select('*').limit(20);
    const { data: scenario } = await supabase.from('scenarios').select('*').eq('id', 7060).single();
    
    if (!users || !scenario) {
        console.error('Missing users or scenario 7060');
        return;
    }
    
    console.log('--- Quest 7060 requirements:', scenario.requirements);
    console.log('--- Quest 7060 is_repeatable:', scenario.is_repeatable);
    
    for (const user of users) {
        console.log(`\n=== Simulating for User: ${user.id} (Level ${user.level}) ===`);
        
        // 完了したクエスト
        const { data: completed } = await supabase.from('user_completed_quests').select('scenario_id').eq('user_id', user.id);
        const completedQuestIds = new Set((completed || []).map((q: any) => String(q.scenario_id)));
        
        console.log('Completed quest IDs:', Array.from(completedQuestIds));
        
        // 所持品
        const { data: inventory } = await supabase.from('inventory').select('item_id').eq('user_id', user.id);
        const ownedItemIds = new Set((inventory || []).map((i: any) => String(i.item_id)));
        
        // 国・位置情報の解決
        const { data: loc } = await supabase.from('locations').select('name, slug, ruling_nation_id').eq('id', user.current_location_id).maybeSingle();
        const currentNationSlug = loc?.ruling_nation_id || null;
        
        // 判定
        const reqs = scenario.requirements || {};
        let eligible = true;
        const reasons: string[] = [];
        
        // P0: クリア済クエストは非表示 (is_repeatable なクエストは除外しない)
        const isCompleted = completedQuestIds.has(String(scenario.id));
        const isRepeatable = scenario.is_repeatable;
        const isScriptDataRepeatable = scenario.script_data?.is_repeatable;
        
        if (isCompleted && !isRepeatable && !isScriptDataRepeatable) {
            eligible = false;
            reasons.push(`Excluded because completed: isCompleted=${isCompleted}, isRepeatable=${isRepeatable}, script_repeatable=${isScriptDataRepeatable}`);
        }
        
        // 他の条件チェック
        if (reqs.min_level && user.level < reqs.min_level) {
            eligible = false;
            reasons.push(`Excluded by min_level: ${reqs.min_level}`);
        }
        
        if (reqs.nation_id && currentNationSlug) {
            const reqNation = reqs.nation_id.toLowerCase();
            const curNation = currentNationSlug.toLowerCase();
            if (!curNation.includes(reqNation) && !reqNation.includes(curNation)) {
                eligible = false;
                reasons.push(`Excluded by nation_id: req=${reqs.nation_id}, cur=${currentNationSlug}`);
            }
        }
        
        if (eligible) {
            console.log('Result: ELIGIBLE (Quest should appear on board)');
        } else {
            console.log('Result: EXCLUDED. Reasons:', reasons);
        }
    }
}

run();
