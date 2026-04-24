import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/seed-main-quests
 *
 * メインクエスト6001〜6020のマスタデータをDBに反映するシードエンドポイント。
 * 対象テーブル:
 *   1. scenarios: time_cost, days_success, days_failure, rec_level, difficulty, rewards, requirements
 *   2. npcs: ヴォルグ(npc_guest_volg)のhire_cost
 *
 * クエリパラメータ:
 *   - secret: ADMIN_SECRET_KEY (必須)
 *   - dry_run=true: 実際の書き込みをスキップして変更内容のみ返却
 *
 * 変更履歴:
 *   - 2026-04-24: 初版作成（time_cost調整 + ヴォルグhire_cost + 情勢報酬 + 難度修正）
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const dryRun = url.searchParams.get('dry_run') === 'true';

    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!serviceKey) {
        return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    // ─────────────────────────────────────────────
    // 1. メインクエスト scenarios テーブル更新
    // ─────────────────────────────────────────────

    // rewards の alignment_shift を CSVの rewards_summary から構築
    // CSV形式: "Gold:150|Rep:5|Order:5" → rewards JSONB
    interface QuestSeedData {
        id: number;
        slug: string;
        rec_level: number;
        difficulty: number;
        time_cost: number;
        days_success: number;
        days_failure: number;
        rewards: {
            gold: number;
            reputation?: number;
            items?: number[];
            alignment_shift?: {
                order?: number;
                chaos?: number;
                justice?: number;
                evil?: number;
            };
        };
        requirements?: Record<string, any>;
    }

    const mainQuests: QuestSeedData[] = [
        {
            id: 6001, slug: 'main_ep01', rec_level: 1, difficulty: 1,
            time_cost: 2, days_success: 2, days_failure: 1,
            rewards: { gold: 150, reputation: 5, alignment_shift: { order: 5 } },
        },
        {
            id: 6002, slug: 'main_ep02', rec_level: 2, difficulty: 1,
            time_cost: 3, days_success: 3, days_failure: 2,
            rewards: { gold: 200, reputation: 5, alignment_shift: { order: 5 } },
        },
        {
            id: 6003, slug: 'main_ep03', rec_level: 3, difficulty: 1,
            time_cost: 3, days_success: 3, days_failure: 2,
            rewards: { gold: 300, reputation: 10, alignment_shift: { justice: 5 } },
        },
        {
            id: 6004, slug: 'main_ep04', rec_level: 4, difficulty: 1,
            time_cost: 5, days_success: 5, days_failure: 3,
            rewards: { gold: 400, reputation: 10, alignment_shift: { justice: 10 } },
        },
        {
            id: 6005, slug: 'main_ep05', rec_level: 5, difficulty: 1,
            time_cost: 5, days_success: 5, days_failure: 3,
            rewards: { gold: 600, reputation: 15, items: [501], alignment_shift: { justice: 10 } },
        },
        {
            id: 6006, slug: 'main_ep06', rec_level: 6, difficulty: 2,
            time_cost: 5, days_success: 5, days_failure: 3,
            rewards: { gold: 700, reputation: 10, alignment_shift: { chaos: 5 } },
        },
        {
            id: 6007, slug: 'main_ep07', rec_level: 7, difficulty: 2,
            time_cost: 3, days_success: 3, days_failure: 2,
            rewards: { gold: 800, reputation: 10, alignment_shift: { justice: 5 } },
        },
        {
            id: 6008, slug: 'main_ep08', rec_level: 8, difficulty: 2,
            time_cost: 1, days_success: 1, days_failure: 1,
            rewards: { gold: 900, reputation: 10 },
        },
        {
            id: 6009, slug: 'main_ep09', rec_level: 9, difficulty: 2,
            time_cost: 3, days_success: 3, days_failure: 2,
            rewards: { gold: 1000, reputation: 10, alignment_shift: { evil: 5 } },
        },
        {
            id: 6010, slug: 'main_ep10', rec_level: 10, difficulty: 2,
            time_cost: 5, days_success: 5, days_failure: 3,
            rewards: { gold: 1500, reputation: 20, items: [502], alignment_shift: { justice: 15 } },
        },
        {
            id: 6011, slug: 'main_ep11', rec_level: 11, difficulty: 2,
            time_cost: 3, days_success: 3, days_failure: 2,
            rewards: { gold: 2000, reputation: 15, alignment_shift: { order: 10 } },
        },
        {
            id: 6012, slug: 'main_ep12', rec_level: 12, difficulty: 2,
            time_cost: 5, days_success: 5, days_failure: 3,
            rewards: { gold: 2500, reputation: 15, alignment_shift: { order: 10 } },
        },
        {
            id: 6013, slug: 'main_ep13', rec_level: 13, difficulty: 3,
            time_cost: 3, days_success: 3, days_failure: 2,
            rewards: { gold: 3500, reputation: 20 },
        },
        {
            id: 6014, slug: 'main_ep14', rec_level: 14, difficulty: 3,
            time_cost: 5, days_success: 5, days_failure: 3,
            rewards: { gold: 4000, reputation: 20, alignment_shift: { justice: 15 } },
        },
        {
            id: 6015, slug: 'main_ep15', rec_level: 15, difficulty: 4,
            time_cost: 7, days_success: 7, days_failure: 4,
            rewards: { gold: 5000, reputation: 30, items: [503], alignment_shift: { justice: 20 } },
        },
        {
            id: 6016, slug: 'main_ep16', rec_level: 16, difficulty: 4,
            time_cost: 3, days_success: 3, days_failure: 2,
            rewards: { gold: 6000, reputation: 20 },
        },
        {
            id: 6017, slug: 'main_ep17', rec_level: 18, difficulty: 5,
            time_cost: 5, days_success: 5, days_failure: 3,
            rewards: { gold: 7000, reputation: 25, alignment_shift: { order: 10 } },
        },
        {
            id: 6018, slug: 'main_ep18', rec_level: 20, difficulty: 5,
            time_cost: 7, days_success: 7, days_failure: 4,
            rewards: { gold: 8000, reputation: 30, alignment_shift: { chaos: 10 } },
        },
        {
            id: 6019, slug: 'main_ep19', rec_level: 22, difficulty: 6,
            time_cost: 5, days_success: 5, days_failure: 3,
            rewards: { gold: 10000, reputation: 40, alignment_shift: { justice: 20 } },
        },
        {
            id: 6020, slug: 'main_ep20', rec_level: 25, difficulty: 6,
            time_cost: 8, days_success: 8, days_failure: 5,
            rewards: { gold: 15000, reputation: 50, items: [504], alignment_shift: { justice: 30 } },
        },
    ];

    for (const quest of mainQuests) {
        const updatePayload = {
            rec_level: quest.rec_level,
            difficulty: quest.difficulty,
            time_cost: quest.time_cost,
            days_success: quest.days_success,
            days_failure: quest.days_failure,
            rewards: quest.rewards,
        };

        if (dryRun) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'dry_run',
                payload: updatePayload,
            });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('scenarios')
            .update(updatePayload)
            .eq('id', quest.id);

        if (error) {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'error',
                error: error.message,
            });
            errorCount++;
        } else {
            results.push({
                target: 'scenarios',
                id: quest.id,
                slug: quest.slug,
                status: 'updated',
                payload: updatePayload,
            });
            successCount++;
        }
    }

    // ─────────────────────────────────────────────
    // 1.5 6016のrequirements更新（世代条件 gen:2+）
    // ─────────────────────────────────────────────
    {
        // 既存のrequirementsを取得してマージ
        const { data: existing } = await supabase
            .from('scenarios')
            .select('requirements')
            .eq('id', 6016)
            .single();

        const mergedReqs = {
            ...(existing?.requirements || {}),
            min_generation: 2,
        };

        if (dryRun) {
            results.push({
                target: 'scenarios',
                id: 6016,
                slug: 'main_ep16',
                field: 'requirements',
                status: 'dry_run',
                payload: mergedReqs,
            });
        } else {
            const { error } = await supabase
                .from('scenarios')
                .update({ requirements: mergedReqs })
                .eq('id', 6016);

            results.push({
                target: 'scenarios',
                id: 6016,
                slug: 'main_ep16',
                field: 'requirements',
                status: error ? 'error' : 'updated',
                error: error?.message,
                payload: mergedReqs,
            });
            if (error) errorCount++;
            else successCount++;
        }
    }

    // ─────────────────────────────────────────────
    // 2. npcs テーブル: ヴォルグの hire_cost 更新
    // ─────────────────────────────────────────────
    {
        const volgUpdate = {
            hire_cost: 6000,
        };

        if (dryRun) {
            results.push({
                target: 'npcs',
                slug: 'npc_guest_volg',
                status: 'dry_run',
                payload: volgUpdate,
            });
            successCount++;
        } else {
            const { error } = await supabase
                .from('npcs')
                .update(volgUpdate)
                .eq('slug', 'npc_guest_volg');

            results.push({
                target: 'npcs',
                slug: 'npc_guest_volg',
                status: error ? 'error' : 'updated',
                error: error?.message,
                payload: volgUpdate,
            });
            if (error) errorCount++;
            else successCount++;
        }
    }

    return NextResponse.json({
        summary: {
            total: results.length,
            success: successCount,
            errors: errorCount,
            dry_run: dryRun,
            description: 'メインクエスト6001-6020 マスタデータシード（time_cost/days調整、情勢報酬、難度修正、ヴォルグhire_cost）',
        },
        results,
    });
}
