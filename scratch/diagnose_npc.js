// ShadowServiceを直接実行して結果を確認するテスト
require('dotenv').config({ path: '.env.preview.local' });

const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', url);
console.log('KEY:', key ? key.substring(0, 20) + '...' : 'MISSING');

const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
});

// ShadowService.findShadowsAtLocation の完全な再現
async function findShadowsAtLocation(locationId, currentUserId) {
    const results = [];

    // Step 0: パーティメンバー取得
    console.log('\n[Step 0] party_members query...');
    const { data: myParty, error: partyErr } = await supabase
        .from('party_members')
        .select('source_user_id, name, origin_type')
        .eq('owner_id', currentUserId)
        .eq('is_active', true);
    
    if (partyErr) {
        console.error('  ❌ party_members FAILED:', partyErr.message);
        throw partyErr; // ← findShadowsAtLocation ではここでクラッシュする
    }
    console.log(`  ✅ party: ${myParty?.length || 0} members`);

    const hiredNames = new Set(myParty?.map(p => p.name));

    // Step 1: アクティブユーザー (try/catch)
    console.log('\n[Step 1] Active users (in try/catch)...');
    try {
        const { data: activeUsers } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('current_location_id', locationId)
            .neq('id', currentUserId)
            .eq('is_alive', true)
            .gt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .neq('name', null)
            .limit(20);
        
        console.log(`  Active users found: ${activeUsers?.length || 0}`);

        if (activeUsers && activeUsers.length > 0) {
            // user_skills JOIN テスト
            const activeUserIds = activeUsers.map(u => u.id);
            const { data: equippedSkills, error: skillErr } = await supabase
                .from('user_skills')
                .select('user_id, cards!inner(name)')
                .in('user_id', activeUserIds)
                .eq('is_equipped', true)
                .limit(120);
            
            if (skillErr) {
                console.log(`  ⚠️ user_skills JOIN error (non-fatal): ${skillErr.message}`);
            }
        }
    } catch (e) {
        console.error('  ❌ Active users catch:', e.message);
    }

    // Step 2: generateSystemMercenaries
    console.log('\n[Step 2] generateSystemMercenaries...');
    try {
        const { data: loc } = await supabase
            .from('locations')
            .select('ruling_nation_id, prosperity_level')
            .eq('id', locationId)
            .single();
        
        const rulingNation = loc?.ruling_nation_id?.toLowerCase() || 'unknown';
        console.log(`  Location: ruling=${rulingNation}`);

        const { data: npcs, error: npcErr } = await supabase
            .from('npcs')
            .select('*')
            .eq('is_hireable', true);
        
        if (npcErr) {
            console.error('  ❌ npcs query error:', npcErr.message);
            return results;
        }
        console.log(`  NPCs (hireable): ${npcs?.length || 0}`);

        if (npcs) {
            const nativeNpcs = rulingNation === 'unknown'
                ? npcs
                : npcs.filter(n => n.slug?.toLowerCase().includes(rulingNation));
            const freeNpcs = npcs.filter(n => n.slug?.toLowerCase().includes('free'));
            const nonGuestNpcs = [...nativeNpcs, ...freeNpcs].filter(n => !n.slug?.toLowerCase().includes('guest'));
            
            console.log(`  Native: ${nativeNpcs.length}, Free: ${freeNpcs.length}, NonGuest: ${nonGuestNpcs.length}`);

            // ゲストNPCチェック (ヴォルグ)
            console.log('\n  [Step 2.5] Guest NPC unlock check...');
            const guestUnlockMap = { 'npc_guest_volg': 'main_ep13' };
            const guestSlugs = Object.keys(guestUnlockMap);
            const { data: guestNpcRows } = await supabase
                .from('npcs').select('*').in('slug', guestSlugs);
            console.log(`  Guest NPCs found: ${guestNpcRows?.length || 0}`);

            if (guestNpcRows && guestNpcRows.length > 0) {
                const requiredSlugs = [...new Set(guestNpcRows.map(n => guestUnlockMap[n.slug]))];
                const { data: scenarios, error: scenErr } = await supabase
                    .from('scenarios').select('id, slug').in('slug', requiredSlugs);
                
                if (scenErr) {
                    console.error(`  ❌ scenarios error: ${scenErr.message}`);
                } else {
                    console.log(`  Scenarios resolved: ${scenarios?.length || 0}`);
                    
                    if (scenarios && scenarios.length > 0) {
                        const scenarioIds = scenarios.map(s => String(s.id));
                        const { data: cleared, error: clearErr } = await supabase
                            .from('user_completed_quests')
                            .select('scenario_id')
                            .eq('user_id', currentUserId)
                            .in('scenario_id', scenarioIds);
                        
                        if (clearErr) {
                            console.error(`  ❌ user_completed_quests error: ${clearErr.message}`);
                            // ← これが throw されるとgenerateSystemMercenaries の catch に行く
                        } else {
                            console.log(`  Cleared: ${cleared?.length || 0}`);
                        }
                    }
                }
            }

            // カード解決
            const freeCandidates = nonGuestNpcs.filter(n => n.slug?.toLowerCase().includes('free'));
            const nonFreeCandidates = nonGuestNpcs.filter(n => !n.slug?.toLowerCase().includes('free'));
            const shuffledNpcs = [...freeCandidates.slice(0, 1), ...nonFreeCandidates.slice(0, 4)];
            
            console.log(`\n  Selected ${shuffledNpcs.length} NPCs for display`);
            
            for (const npc of shuffledNpcs) {
                results.push({
                    profile_id: npc.id,
                    name: npc.name,
                    origin_type: 'system_mercenary',
                });
            }
        }
    } catch (e) {
        console.error('  ❌ generateSystemMercenaries catch:', e.message);
    }

    return results;
}

async function main() {
    const locationId = 'a4b2251d-0ba3-47e0-94d9-5fe28737ac5e';
    const userId = '2f0dc5cd-25d0-456a-b3ed-11b7dd4d91a2';

    try {
        const shadows = await findShadowsAtLocation(locationId, userId);
        console.log(`\n=== FINAL RESULT: ${shadows.length} shadows ===`);
        shadows.forEach(s => console.log(`  - ${s.name} (${s.origin_type})`));
    } catch (e) {
        console.error(`\n=== UNCAUGHT ERROR: ${e.message} ===`);
    }
}

main();
