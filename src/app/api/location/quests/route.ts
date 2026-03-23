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

        const currentProsperity = worldState?.prosperity_level || 50;
        debug.push(`prosperity = ${currentProsperity} `);

        // 3. Fetch User Inventory (for has_item checks)
        const { data: inventory } = await supabaseServer
            .from('inventory')
            .select('item_id, quantity')
            .eq('user_id', userId);

        const ownedItemIds = new Set((inventory || []).map((i: any) => String(i.item_id)));

        // 4. Fetch User Reputations (for min_reputation checks)
        const { data: reputations } = await supabaseServer
            .from('reputations')
            .select('location_id, reputation_score')
            .eq('user_id', userId);

        const repMap: Record<string, number> = {};
        for (const rep of (reputations || [])) {
            repMap[rep.location_id] = rep.reputation_score || 0;
        }

        // 4.5 Fetch User Completed Quests (for prerequisites)
        const { data: completedQuests } = await supabaseServer
            .from('user_completed_quests')
            .select('scenario_id')
            .eq('user_id', userId);

        const completedQuestIds = new Set((completedQuests || []).map((q: any) => String(q.scenario_id)));

        // 5. Fetch Quests
        const { data: quests, error: qError } = await supabaseServer
            .from('scenarios')
            .select('id, slug, title, description, quest_type, requirements, conditions, rewards, rec_level, is_urgent, client_name, impact, location_id, max_reputation')
            .in('quest_type', ['normal', 'special'])
            .limit(100);

        debug.push(`quest_fetch: ${qError ? 'ERROR: ' + qError.message : 'OK, count=' + (quests?.length || 0)} `);

        if (qError) {
            return NextResponse.json({ error: qError.message, debug }, { status: 500 });
        }

        if (!quests || quests.length === 0) {
            debug.push('NO QUESTS FOUND - returning empty');
            return NextResponse.json({ special_quests: [], normal_quests: [], debug });
        }

        // 6. Filter Special Quests (v3.1 Requirements Evaluation)
        const specialQuests = quests.filter((q: any) => {
            if (q.quest_type !== 'special') return false;

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

            // completed_quest: 前提クエスト完了必須
            if (reqs.completed_quest) {
                const reqId = String(reqs.completed_quest);
                if (!completedQuestIds.has(reqId)) return false;
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

            const conds = q.conditions || {};
            const reqs = q.requirements || {};

            // Prosperity Check
            if (conds.min_prosperity && currentProsperity < conds.min_prosperity) return false;
            if (conds.max_prosperity && currentProsperity > conds.max_prosperity) return false;

            // Location tag check
            if (conds.location_tags && locationId) {
                const tags = Array.isArray(conds.location_tags)
                    ? conds.location_tags
                    : String(conds.location_tags).split(',').map((t: string) => t.trim());
                if (!tags.includes('all') && !tags.includes(locationId)) return false;
            }

            // v12.0: rec_level / min_reputation をサーバー側で完全フィルタリング
            const rec = q.rec_level || reqs.min_level || 0;
            if (rec > 0 && user.level < rec) return false;

            const minRep = reqs.min_reputation;
            if (minRep) {
                const repRequired = typeof minRep === 'number'
                    ? minRep
                    : (minRep[locationId || q.location_id] || 0);
                const repActual = repMap[locationId || q.location_id] || 0;
                if (repActual < repRequired) return false;
            }

            // v16: max_reputation フィルタ（悪人限定クエスト）
            if (q.max_reputation !== null && q.max_reputation !== undefined) {
                const repActual = repMap[locationId || q.location_id] || 0;
                if (repActual > q.max_reputation) return false;
            }

            return true;
        });

        debug.push(`filtered: special = ${specialQuests.length}, normal = ${normalQuests.length} `);

        // Map DB columns to expected frontend format
        const mapQuest = (q: any) => ({
            ...q,
            // Map rewards json to flat fields if needed, or frontend can handle it.
            // But QuestBoardModal expects reward_gold.
            reward_gold: q.rewards?.gold || 0,
            reward_exp: q.rewards?.exp || 0,
            impacts: q.impact, // Rename back to impacts for frontend
        });

        // 8. Randomize Normal Quests (Pick 6)
        const shuffled = normalQuests.sort(() => 0.5 - Math.random());
        const finalNormalQuests = shuffled.slice(0, 6).map(mapQuest);

        // 9. Sort Special Quests (Urgent first)
        const sortedSpecial = specialQuests.sort((a: any, b: any) =>
            (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0)
        ).map(mapQuest);

        return NextResponse.json({
            special_quests: sortedSpecial,
            normal_quests: finalNormalQuests,
            debug
        });

    } catch (e: any) {
        console.error("Quest API Error:", e);
        return NextResponse.json({ error: e.message, debug }, { status: 500 });
    }
}
