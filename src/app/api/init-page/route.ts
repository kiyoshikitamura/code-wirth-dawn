import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { NATIONS, DEFAULT_HEGEMONY } from '@/constants/nations';
import { PartyService } from '@/services/partyService';
import { QuestService } from '@/services/questService';

export const dynamic = 'force-dynamic';

/**
 * requirements オブジェクトを「ヒント文」に変換（意図的に曖昧）
 */
function formatRequirementsHint(req: any): string {
    if (!req) return 'この情報の詳細は不明だ…';

    const parts: string[] = [];
    try {
        const parsed = typeof req === 'string' ? JSON.parse(req) : req;
        if (parsed.min_reputation) parts.push(`相応の名声を持つ者`);
        if (parsed.max_reputation) parts.push(`世を忍ぶ者`);
        if (parsed.align_evil) parts.push(`後ろ暗い過去のある者`);
        if (parsed.min_align_order) parts.push(`秩序を重んじる者`);
        if (parsed.completed_quest) parts.push(`実績のある冒険者`);
        if (parsed.min_level) parts.push(`相応の腕前がある者`);
        if (parsed.nation_id) {
            const nationMap: Record<string, string> = {
                loc_holy_empire: 'ローランドの縁者',
                loc_marcund: 'マルカンドの通',
                loc_yatoshin: '夜刀に精通した者',
                loc_haryu: '華龍の習わしを知る者',
            };
            parts.push(nationMap[parsed.nation_id] || '縁のある者');
        }
    } catch {
        return 'この情報の詳細は不明だ…';
    }

    return parts.length > 0
        ? `${parts.join('・')}に向けた依頼らしい…`
        : '詳細は口外できないが、かなり危険な案件のようだ…';
}

/**
 * GET /api/init-page
 * 拠点ページ初期化に必要なデータを一括取得する統合APIエンドポイント。
 * profile, hub_state, world_state, hegemony, reputation, gougai, 
 * および tavern_shadows, party_members, location_quests, gossip_data を並列クエリで取得し、
 * 1回のリクエストで返す（Eager Load）。
 */
export async function GET(req: Request) {
    try {
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
            loreDataResult,
            secretQuestsResult,
            resonanceCountResult
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
                ? QuestService.getQuestsForLocation(user.id, locationId)
                : Promise.resolve({ quests: [], special_quests: [], normal_quests: [] }),

            // 4. gossip - loreData (rumors & items)
            (!isHub && locationId)
                ? (async () => {
                      const { data: locData } = await supabaseServer
                          .from('locations')
                          .select('name, ruling_nation_id, world_states(controlling_nation)')
                          .eq('id', locationId)
                          .maybeSingle();

                      const locName = locData?.name || '旅先の街';
                      const nationName = (locData?.world_states as any)?.[0]?.controlling_nation || locData?.ruling_nation_id || '未知の国';

                      const [rumorRowsResult, blackMarketItemsResult] = await Promise.all([
                          supabaseServer
                              .from('rumors')
                              .select('id, content, rarity, nation_tag')
                              .eq('category', 'lore')
                              .or(`nation_tag.is.null,nation_tag.eq.${nationName}`),
                          supabaseServer
                              .from('items')
                              .select('id, name, nation_tags, min_prosperity')
                              .eq('is_black_market', true)
                              .limit(5)
                      ]);

                      let rumorRows = rumorRowsResult.data || [];
                      if (rumorRows.length === 0) {
                          const { data: fallbackRows } = await supabaseServer
                              .from('rumors')
                              .select('id, content, rarity, nation_tag')
                              .eq('category', 'lore')
                              .is('nation_tag', null);
                          rumorRows = fallbackRows || [];
                      }

                      return {
                          locName,
                          nationName,
                          rumorRows,
                          blackMarketItems: blackMarketItemsResult.data || []
                      };
                  })()
                : Promise.resolve(null),

            // 5. gossip - secretQuests
            (!isHub && locationId)
                ? supabaseServer
                      .from('scenarios')
                      .select('id, slug, title, quest_type, requirements, difficulty, location_id, location:locations(name, ruling_nation_id)')
                      .eq('quest_type', 'special')
                      .eq('is_urgent', false)
                      .not('slug', 'like', 'main_%')
                : Promise.resolve({ data: null }),

            // 6. gossip - resonanceCount
            (!isHub && locationId)
                ? supabaseServer
                      .from('user_profiles')
                      .select('id', { count: 'exact', head: true })
                      .eq('current_location_id', locationId)
                      .neq('id', user.id)
                      .eq('is_alive', true)
                      .not('name', 'is', null)
                      .gt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                : Promise.resolve({ count: null })
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
            // ① news
            let unreadCount = 0;
            if (history && history.length > 0) {
                const lastSeenId = viewResult.data?.last_seen_history_id;
                if (lastSeenId) {
                    const idx = history.findIndex((h: any) => h.id === lastSeenId);
                    unreadCount = idx === -1 ? history.length : idx;
                } else {
                    unreadCount = history.length > 0 ? 1 : 0;
                }
            }
            const worldNews = history || [];
            const shuffledNews = [...worldNews].sort(() => Math.random() - 0.5).slice(0, 3);

            // ② lore
            let loreTips: any[] = [];
            if (loreDataResult) {
                const { locName, nationName, rumorRows, blackMarketItems } = loreDataResult;
                const blackMarketLore = blackMarketItems.map((it: any) => ({
                    id: `bm-${it.id}`,
                    content: `「${it.name}……普通じゃ手に入らない代物だ。どこかの闇市を探せば見つかるかもしれないが、危険を覚悟しろよ。」`,
                    rarity: 3,
                    nation_tag: it.nation_tags?.[0] || null
                }));
                const combinedLore = [...rumorRows, ...blackMarketLore];
                const shuffledLore = combinedLore.sort(() => Math.random() - 0.5).slice(0, 3);
                loreTips = shuffledLore.map((r: any) => ({
                    ...r,
                    content: r.content
                        .replace(/\{loc_name\}/g, locName)
                        .replace(/\{nation_name\}/g, nationName),
                }));
            }

            // ③ secret
            const specialQuests = secretQuestsResult.data || [];
            const shuffledQuests = [...specialQuests].sort(() => Math.random() - 0.5).slice(0, 3);
            const secretInfo = {
                quests: shuffledQuests.map((q: any) => ({
                    id: q.id,
                    title: q.title,
                    location_name: q.location?.name || '不明の地',
                    nation: q.location?.ruling_nation_id || '???',
                    difficulty: q.difficulty,
                    hint: formatRequirementsHint(q.requirements),
                }))
            };

            // ④ tavern
            const JOB_CLASS_JP_GOSSIP: Record<string, string> = {
                Warrior: '戦士', Fighter: '格闘家', Knight: '騎士', Mage: '魔法使い',
                Ranger: '狩人', Thief: '盗賊', Cleric: '僧侶', Bard: '吟遊詩人',
                Adventurer: '冒険者', Samurai: '侍', Ninja: '忍者', Mercenary: '傭兵',
            };
            const shuffledShadows = (tavernShadows || []).map((s: any) => ({
                id: s.profile_id,
                profile_id: s.profile_id,
                name: s.name,
                epithet: s.epithet || '',
                job_class: JOB_CLASS_JP_GOSSIP[s.job_class] || s.job_class || '傭兵',
                durability: s.stats?.hp || 100,
                max_durability: s.stats?.hp || 100,
                cover_rate: 0,
                avatar_url: s.npc_image_url || s.icon_url || s.image_url || undefined,
                origin_type: s.origin_type,
                level: s.level,
                flavor_text: s.flavor_text || undefined,
                introduction: s.introduction || undefined,
                stats: s.stats || { atk: 0, def: 0, hp: 100 },
                signature_deck_preview: s.signature_deck_preview || [],
                contract_fee: s.contract_fee || 0,
                subscription_tier: s.subscription_tier || 'free',
                icon_url: s.icon_url,
                npc_image_url: s.npc_image_url,
            }));
            const resonanceCount = resonanceCountResult.count || 0;

            gossipData = {
                world_news: shuffledNews,
                unread_count: unreadCount,
                lore_tips: loreTips,
                secret_info: secretInfo,
                tavern_shadows: shuffledShadows,
                resonance_count: resonanceCount
            };
        }

        // ── レスポンス組み立て ──
        const response: any = {
            profile: profile ? { ...profile, equip_bonus: equipBonus } : null,
            hub_state: hubState,
            world_state: worldState,
            reputation: reputationResult.data || null,
            gougai,
            tavern_shadows: tavernShadows || [],
            party_members: partyMembers || [],
            location_quests: locationQuests || { quests: [], special_quests: [], normal_quests: [] },
            gossip_data: gossipData
        };

        return NextResponse.json(response);
    } catch (err: any) {
        console.error('[init-page] エラー:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
