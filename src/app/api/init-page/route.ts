import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { NATIONS, DEFAULT_HEGEMONY } from '@/constants/nations';
import { PartyService } from '@/services/partyService';
import { QuestService } from '@/services/questService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/init-page
 * 拠点ページ初期化に必要なデータを一括取得する統合APIエンドポイント。
 * profile, hub_state, world_state, hegemony, reputation, gougai, 
 * および tavern_shadows, party_members, location_quests, gossip_data を並列クエリで取得し、
 * 1回のリクエストで返す（Eager Load）。
 */
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const prefetchQuestId = url.searchParams.get('prefetch_quest_id');
        const supabaseAuth = createAuthClient(req);

        // ── 認証チェック ──
        const authHeader = req.headers.get('authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '') : '';
        const { data: { user } } = await supabaseAuth.auth.getUser(token || undefined);

        if (!user) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        // ── Phase 1: プロフィール・装備・ハブ状態を並列取得 ──
        const [profileResult, equipResult, hubResult] = await Promise.all([
            supabaseAuth
                .from('user_profiles')
                .select('*, locations:locations!fk_current_location(name, slug, type, ruling_nation_id)')
                .eq('id', user.id)
                .single(),
            supabaseServer
                .from('inventory')
                .select('item:items(effect_data)')
                .eq('user_id', user.id)
                .eq('is_equipped', true),
            supabaseAuth
                .from('user_hub_states')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle(),
        ]);

        // プロフィール取得失敗時は profile: null で返す（クライアント側でリダイレクト）
        const profile = profileResult.data;

        // 装備ボーナス計算
        const equipBonus = { atk: 0, def: 0, hp: 0 };
        if (equipResult.data) {
            for (const eq of equipResult.data) {
                const effectData = (eq as any).item?.effect_data;
                if (effectData) {
                    equipBonus.atk += effectData.atk_bonus || 0;
                    equipBonus.def += effectData.def_bonus || 0;
                    equipBonus.hp += effectData.hp_bonus || 0;
                }
            }
        }

        // ハブ状態（なければデフォルト作成）
        let hubState = hubResult.data;
        if (!hubState && !hubResult.error) {
            const { data: newHub } = await supabaseAuth
                .from('user_hub_states')
                .insert([{ user_id: user.id, is_in_hub: false }])
                .select()
                .single();
            hubState = newHub || { user_id: user.id, is_in_hub: false };
        }

        // ── ロケーション名の決定 ──
        let targetLocationName = '国境の町';
        if (hubState?.is_in_hub) {
            targetLocationName = '名もなき旅人の拠所';
        } else if (profile?.locations?.name) {
            targetLocationName = profile.locations.name;
        }

        const isHub = hubState?.is_in_hub === true;
        const locationId = profile?.current_location_id;

        // ── Phase 2: ワールド状態・覇権・評判・号外・施設キャッシュデータを並列取得 ──
        const [
            worldResult,
            hegemonyResult,
            reputationResult,
            viewResult,
            historyResult,
            tavernShadows,
            partyMembers,
            locationQuests,
            pinnedSystemPostResult,
            gossipPostsResult,
            colosseumRewardsResult,
            completedQuestsResult
        ] = await Promise.all([
            // ワールド状態
            supabaseAuth
                .from('world_states')
                .select('*')
                .eq('location_name', targetLocationName)
                .maybeSingle(),
            // 覇権計算用データ
            supabaseAuth
                .from('world_states')
                .select('controlling_nation'),
            // 評判（ハブでない場合のみ）
            isHub
                ? Promise.resolve({ data: null, error: null })
                : supabaseAuth
                    .from('reputations')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('location_name', targetLocationName)
                    .maybeSingle(),
            // 号外: ユーザーの最終閲覧ID
            supabaseAuth
                .from('user_world_views')
                .select('last_seen_history_id')
                .eq('user_id', user.id)
                .maybeSingle(),
            // 号外: 最新の世界履歴
            supabaseAuth
                .from('world_states_history')
                .select('*, location:locations!world_states_history_location_id_fkey(name)')
                .order('created_at', { ascending: false })
                .limit(10),

            // ── 新規追加の並列クエリ ──
            // 1. tavernShadows (ShadowService.findShadowsAtLocation)
            (!isHub && locationId)
                ? (async () => {
                      const { ShadowService } = await import('@/services/shadowService');
                      const shadowService = new ShadowService(supabaseServer);
                      return shadowService.findShadowsAtLocation(locationId, user.id);
                  })()
                : Promise.resolve([]),

            // 2. partyMembers (PartyService.getEnrichedPartyMembers)
            PartyService.getEnrichedPartyMembers(user.id),

            // 3. locationQuests (QuestService.getQuestsForLocation)
            (!isHub && locationId)
                ? QuestService.getQuestsForLocation(user.id, locationId, prefetchQuestId || undefined)
                : Promise.resolve({ quests: [], special_quests: [], normal_quests: [] }),

            // 4. gossip - pinned system post
            supabaseServer
                .from('gossip_posts')
                .select('*')
                .eq('is_system', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(),

            // 5. gossip - timeline posts
            supabaseServer
                .from('gossip_posts')
                .select('*, user_profiles(subscription_tier)')
                .order('created_at', { ascending: false })
                .limit(30),

            // 6. colosseum_rewards_notifications
            supabaseServer
                .from('notifications')
                .select('id, message')
                .eq('user_id', user.id)
                .eq('read', false)
                .eq('type', 'system')
                .like('message', '🏆 コロシアムランキング報酬獲得！%'),

            // 7. completedQuests
            supabaseAuth
                .from('user_completed_quests')
                .select('scenario_id, ugc_scenario_id')
                .eq('user_id', user.id)
        ]);

        // ── 覇権計算 ──
        let hegemony = DEFAULT_HEGEMONY;
        if (hegemonyResult.data && hegemonyResult.data.length > 0) {
            const states = hegemonyResult.data;
            const totalCount = states.length || 1;
            const counts: Record<string, number> = {};
            NATIONS.forEach(n => { counts[n.id] = 0; });

            states.forEach((s: any) => {
                const nation = s.controlling_nation;
                if (nation && counts[nation] !== undefined) {
                    counts[nation]++;
                }
            });

            const calculated = NATIONS.map(n => ({
                name: n.nameShort,
                power: Math.round((counts[n.id] / totalCount) * 100),
                locations: counts[n.id],
                color: n.color,
            }));

            // 合計100%補正
            const totalPower = calculated.reduce((acc, curr) => acc + curr.power, 0);
            if (totalPower !== 100 && totalPower > 0) {
                const diff = 100 - totalPower;
                const maxIdx = calculated.reduce((maxI, curr, i, arr) => curr.power > arr[maxI].power ? i : maxI, 0);
                calculated[maxIdx].power += diff;
            }

            hegemony = calculated;
        }

        // ── ワールド状態にhegemonyを付与 ──
        const worldState = worldResult.data
            ? { ...worldResult.data, hegemony }
            : null;

        // ── 号外フィルタリング ──
        let gougai: any[] = [];
        const history = historyResult.data;
        if (history && history.length > 0) {
            const lastSeenId = viewResult.data?.last_seen_history_id;
            if (lastSeenId) {
                const index = history.findIndex((h: any) => h.id === lastSeenId);
                if (index !== -1) {
                    // 降順なので index より前が新しいニュース
                    gougai = history.slice(0, index);
                } else {
                    gougai = history;
                }
            } else {
                // 初回: 最新1件のみ表示
                gougai = [history[0]];
            }
        }

        // ── gossip_data の組み立て ──
        let gossipData: any = null;
        if (!isHub && locationId) {
            const pinnedSystemPost = pinnedSystemPostResult?.data || null;
            let posts = gossipPostsResult?.data || [];
            if (pinnedSystemPost && posts.length > 0) {
                if (posts[0].id === pinnedSystemPost.id) {
                    posts = posts.slice(1);
                }
            }
            gossipData = {
                pinned_system_post: pinnedSystemPost,
                posts: posts
            };
        }

        // ── レスポンス組み立て ──
        const completed_quests = completedQuestsResult.data || [];
        if (prefetchQuestId && !completed_quests.some((q: any) => String(q.scenario_id) === String(prefetchQuestId))) {
            completed_quests.push({
                scenario_id: isNaN(Number(prefetchQuestId)) ? prefetchQuestId : Number(prefetchQuestId),
                ugc_scenario_id: null
            });
        }

        const response: any = {
            profile: profile ? { ...profile, equip_bonus: equipBonus } : null,
            hub_state: hubState,
            world_state: worldState,
            reputation: reputationResult.data || null,
            gougai,
            tavern_shadows: tavernShadows || [],
            party_members: partyMembers || [],
            location_quests: locationQuests || { quests: [], special_quests: [], normal_quests: [] },
            gossip_data: gossipData,
            completed_quests: completed_quests,
            colosseum_rewards: colosseumRewardsResult?.data || []
        };

        return NextResponse.json(response);
    } catch (err: any) {
        console.error('[init-page] エラー:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
