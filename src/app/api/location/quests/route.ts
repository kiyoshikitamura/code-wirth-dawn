import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/location/quests
 * Returns quests separated by type (special / normal) with requirement evaluation.
 * Spec v3.1 & v3.3
 */
export async function GET(req: Request) {
    const debug: string[] = [];

    try {
        const { searchParams } = new URL(req.url);
        const reqUserId = searchParams.get('userId');
        const locationId = searchParams.get('locationId');
        let userId = reqUserId;

        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) {
                userId = user.id;
            }
        }

        debug.push(`userId = ${userId}, locationId = ${locationId} `);

        if (!userId) {
            return NextResponse.json({ error: 'Authentication required', debug }, { status: 401 });
        }

        // 1. Fetch User Profile
        const { data: user, error: uError } = await supabaseServer
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        debug.push(`user_fetch: ${uError ? 'ERROR: ' + uError.message : 'OK, level=' + user?.level} `);

        if (uError || !user) {
            return NextResponse.json({ error: 'User not found', debug, uError: uError?.message }, { status: 404 });
        }

        // 2. Fetch World State
        const { data: worldState } = await supabaseServer
            .from('world_states')
            .select('*')
            .maybeSingle();

        // prosperity_level は DB上で1-5のスケール
        const currentProsperity = worldState?.prosperity_level || 3;
        debug.push(`prosperity = ${currentProsperity} (scale: 1-5) `);

        // 3. Fetch User Inventory (for has_item checks)
        const { data: inventory } = await supabaseServer
            .from('inventory')
            .select('item_id, quantity')
            .eq('user_id', userId);

        const ownedItemIds = new Set((inventory || []).map((i: any) => String(i.item_id)));

        // 4. Fetch User Reputations (for min_reputation checks)
        const { data: reputations } = await supabaseServer
            .from('reputations')
            .select('location_name, score')
            .eq('user_id', userId);

        const repMap: Record<string, number> = {};
        for (const rep of (reputations || [])) {
            repMap[rep.location_name] = rep.score || 0;
        }

        // 4.5 Fetch User Completed Quests (for prerequisites)
        const { data: completedQuests } = await supabaseServer
            .from('user_completed_quests')
            .select('scenario_id')
            .eq('user_id', userId);

        const completedQuestIds = new Set((completedQuests || []).map((q: any) => String(q.scenario_id)));

        // 4.6 Fetch current location's ruling_nation_id for P2 location filtering
        let currentNationSlug: string | null = null;
        if (locationId) {
            const { data: locData } = await supabaseServer
                .from('locations')
                .select('ruling_nation_id')
                .eq('id', locationId)
                .maybeSingle();
            currentNationSlug = locData?.ruling_nation_id || null;
        }

        // 5. Fetch Quests
        const { data: quests, error: qError } = await supabaseServer
            .from('scenarios')
            .select('id, slug, title, description, quest_type, requirements, conditions, rewards, rec_level, difficulty, is_urgent, client_name, impact, location_id, max_reputation, script_data')
            .in('quest_type', ['normal', 'special'])
            .not('slug', 'like', 'ugc_%') // v21: UGCクエスト（slug が ugc_ 始まり）を除外
            .limit(200);

        // 5.1 Build slug→id map for completed_quest prerequisite resolution
        const slugToIdMap: Record<string, string> = {};
        if (quests) {
            for (const q of quests) {
                if (q.slug) slugToIdMap[q.slug] = String(q.id);
            }
        }

        // Nation slug mapping for P2 location filtering
        const nationSlugToLocationTag: Record<string, string> = {
            'Roland': 'loc_holy_empire',
            'Markand': 'loc_marcund',
            'Yato': 'loc_yatoshin',
            'Karyu': 'loc_haryu',
        };
        const currentLocationTag = currentNationSlug ? nationSlugToLocationTag[currentNationSlug] || null : null;

        debug.push(`quest_fetch: ${qError ? 'ERROR: ' + qError.message : 'OK, count=' + (quests?.length || 0)} `);

        if (qError) {
            return NextResponse.json({ error: qError.message, debug }, { status: 500 });
        }

        if (!quests || quests.length === 0) {
            debug.push('NO QUESTS FOUND - returning empty');
            return NextResponse.json({ special_quests: [], normal_quests: [], debug });
        }

        // Helper: resolve completed_quest value (slug or id) to check against completedQuestIds
        const hasCompletedPrereq = (reqValue: string | number): boolean => {
            const reqStr = String(reqValue);
            // Direct ID match
            if (completedQuestIds.has(reqStr)) return true;
            // Slug → ID resolution
            const resolvedId = slugToIdMap[reqStr];
            if (resolvedId && completedQuestIds.has(resolvedId)) return true;
            return false;
        };

        // 6. Filter Special Quests (v3.1 Requirements Evaluation)
        const specialQuests = quests.filter((q: any) => {
            if (q.quest_type !== 'special') return false;

            // P0: クリア済クエストは非表示
            if (completedQuestIds.has(String(q.id))) return false;

            const reqs = q.requirements || {};

            // nation_id: 現在地が指定国でなければ非表示（メインシナリオは除外: 舞台設定であり現在地制限ではない）
            const isMainScenario = q.slug && q.slug.startsWith('main_ep');
            if (!isMainScenario && reqs.nation_id && locationId && reqs.nation_id !== locationId) return false;

            // event_trigger: イベントトリガー型は専用イベント発生時のみ表示（未実装のため常に非表示）
            if (reqs.event_trigger) return false;

            // require_item_id: 特定アイテム所持必須
            if (reqs.require_item_id && !ownedItemIds.has(String(reqs.require_item_id))) return false;

            // has_item: アイテム所持は完全に限定（スポイラー防止）
            if (reqs.has_item && !ownedItemIds.has(String(reqs.has_item))) return false;

            // completed_quest: 前提クエスト完了必須 (P0: slug/ID両対応)
            if (reqs.completed_quest) {
                if (!hasCompletedPrereq(reqs.completed_quest)) return false;
            }

            // 陰陽/秩序 alignment（隠しクエスト）
            if (reqs.align_evil && !(user.evil_pts > user.justice_pts)) return false;
            if (reqs.min_align_chaos && (user.chaos_pts || 0) < reqs.min_align_chaos) return false;
            if (reqs.min_align_order && (user.order_pts || 0) < reqs.min_align_order) return false;

            // 繁栄度条件
            if (reqs.max_prosperity && currentProsperity > reqs.max_prosperity) return false;
            if (reqs.min_prosperity && currentProsperity < reqs.min_prosperity) return false;

            // min_vitality: 体力(Vitality)制限
            if (reqs.min_vitality && (user.vitality || 0) < reqs.min_vitality) return false;

            // v12.0: min_level / min_reputation もサーバー側で完全フィルタリング
            if (reqs.min_level && user.level < reqs.min_level) return false;
            if (reqs.min_reputation) {
                const repRequired = typeof reqs.min_reputation === 'number'
                    ? reqs.min_reputation
                    : (reqs.min_reputation[locationId || q.location_id] || 0);
                const repActual = repMap[locationId || q.location_id] || 0;
                if (repActual < repRequired) return false;
            }

            // v16: max_reputation フィルタ（悪人限定クエスト: 名声が高すぎると受注不可）
            if (q.max_reputation !== null && q.max_reputation !== undefined) {
                const repActual = repMap[locationId || q.location_id] || 0;
                if (repActual > q.max_reputation) return false;
            }

            return true;
        });

        // 7. Filter Normal Quests (location + prosperity + level + reputation — server-side v12.0)
        const normalQuests = quests.filter((q: any) => {
            if (q.quest_type !== 'normal') return false;

            // P0: クリア済クエストは非表示 (normalクエストはリピート可能なので除外しない)
            // if (completedQuestIds.has(String(q.id))) return false;

            const conds = q.conditions || {};
            const reqs = q.requirements || {};

            // Prosperity Check
            if (conds.min_prosperity && currentProsperity < conds.min_prosperity) return false;
            if (conds.max_prosperity && currentProsperity > conds.max_prosperity) return false;

            // P2: Location tag check — ruling_nation_id ベースで照合
            if (conds.location_tags) {
                const tags = Array.isArray(conds.location_tags)
                    ? conds.location_tags
                    : String(conds.location_tags).split(',').map((t: string) => t.trim());
                if (!tags.includes('all')) {
                    // currentLocationTag (e.g. 'loc_holy_empire') と照合
                    if (!currentLocationTag || !tags.includes(currentLocationTag)) return false;
                }
            }

            // P0: completed_quest 前提条件 (normalクエストのconditions内)
            if (conds.completed_quest) {
                if (!hasCompletedPrereq(conds.completed_quest)) return false;
            }

            // rec_level は UI（❗アイコン）で警告表示するのみ。受注自体は制限しない。

            const minRep = conds.min_reputation || reqs.min_reputation;
            if (minRep) {
                const repRequired = typeof minRep === 'number'
                    ? minRep
                    : (minRep[locationId || q.location_id] || 0);
                const repActual = repMap[locationId || q.location_id] || 0;
                if (repActual < repRequired) return false;
            }

            // v16: max_reputation フィルタ（悪人限定クエスト）
            const maxRep = conds.max_reputation ?? q.max_reputation;
            if (maxRep !== null && maxRep !== undefined) {
                const repActual = repMap[locationId || q.location_id] || 0;
                if (repActual > maxRep) return false;
            }

            return true;
        });

        debug.push(`filtered: special = ${specialQuests.length}, normal = ${normalQuests.length} `);

        // difficulty_tier: rec_level ベースで分類 (Easy≤3, Normal4-7, Hard≥8)
        const getDifficultyTier = (recLevel: number): 'easy' | 'normal' | 'hard' => {
            if (recLevel <= 3) return 'easy';
            if (recLevel <= 7) return 'normal';
            return 'hard';
        };

        const mapQuest = (q: any) => {
            const recLevel = q.rec_level || q.requirements?.min_level || 1;
            const rewards = q.rewards || {};
            return {
                ...q,
                reward_gold: rewards.gold || 0,
                reward_exp: rewards.exp || 0,
                reward_reputation: rewards.reputation || 0,
                reward_items: rewards.items || [],
                reward_alignment: rewards.alignment_shift || null,
                reward_vitality: rewards.vitality_cost || 0,
                reward_npc: rewards.npc_reward || null,
                impacts: q.impact,
                difficulty_tier: getDifficultyTier(recLevel),
                short_flavor: q.script_data?.short_description || q.description || '',
                long_flavor: q.script_data?.nodes?.start?.text || q.description || '',
                is_ugc: q.slug?.startsWith('ugc_') || false,
            };
        };

        // 8. Merge all quests, sort: urgent first, then by rec_level
        // normalクエストをシャッフルし、tierごとに件数制限 (Easy=5, Normal=3, Hard=1)
        const shuffled = [...normalQuests].sort(() => Math.random() - 0.5);
        const tierLimits: Record<string, number> = { easy: 0, normal: 0, hard: 0 };
        const TIER_MAX: Record<string, number> = { easy: 5, normal: 3, hard: 1 };
        const limitedNormalQuests = shuffled.filter((q: any) => {
            const recLevel = q.rec_level || q.requirements?.min_level || 1;
            const tier = getDifficultyTier(recLevel);
            if (tierLimits[tier] >= TIER_MAX[tier]) return false;
            tierLimits[tier]++;
            return true;
        });

        // specialクエストにもtier制限を適用（メインシナリオは免除: チェーン条件で最大1件に制限されるため）
        const SPECIAL_TIER_MAX: Record<string, number> = { easy: 3, normal: 2, hard: 2 };
        const specialTierLimits: Record<string, number> = { easy: 0, normal: 0, hard: 0 };
        const shuffledSpecial = [...specialQuests].sort(() => Math.random() - 0.5);
        const limitedSpecialQuests = shuffledSpecial.filter((q: any) => {
            const isMainScenario = q.slug && q.slug.startsWith('main_ep');
            if (isMainScenario) return true; // メインシナリオは常に表示（前提条件で自然に1件に絞られる）
            const recLevel = q.rec_level || q.requirements?.min_level || 1;
            const tier = getDifficultyTier(recLevel);
            if (specialTierLimits[tier] >= SPECIAL_TIER_MAX[tier]) return false;
            specialTierLimits[tier]++;
            return true;
        });

        const allQuests = [...limitedSpecialQuests, ...limitedNormalQuests]
            .sort((a: any, b: any) => {
                if (a.is_urgent !== b.is_urgent) return (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0);
                return (a.rec_level || 1) - (b.rec_level || 1);
            })
            .map(mapQuest);

        debug.push(`limited: special=${limitedSpecialQuests.length}/${specialQuests.length}, normal=${limitedNormalQuests.length}/${normalQuests.length}, nationTag=${currentLocationTag || 'none'} `);

        return NextResponse.json({
            quests: allQuests,
            // Backward compatibility
            special_quests: allQuests.filter((q: any) => q.quest_type === 'special'),
            normal_quests: allQuests.filter((q: any) => q.quest_type === 'normal'),
            debug
        });

    } catch (e: any) {
        console.error("Quest API Error:", e);
        return NextResponse.json({ error: e.message, debug }, { status: 500 });
    }
}
