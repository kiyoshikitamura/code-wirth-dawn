import { NextResponse } from 'next/server';
import { updateWorldSimulation } from '@/lib/world-simulation';
import { supabaseServer } from '@/lib/supabase-admin';
import { resetStaleAlignmentScores } from '@/services/worldStateReset';

export const dynamic = 'force-dynamic';

/**
 * 共通の定期アップデート処理
 * @param isForceUgcReset UGC追加インポート回数リセットを強制するか
 */
async function performUpdate(isForceUgcReset: boolean) {
    const logs: string[] = [];

    // 1. 世界シミュレーションのアップデート (6時間ごと)
    const result = await updateWorldSimulation();
    if (!result.success) {
        throw new Error(result.error || 'updateWorldSimulation failed');
    }
    logs.push(...result.logs);

    // 2. 世界アライメントスコアの6時間リセット (world-reset と同等の処理)
    // 6時間以上経過しているものをリセット
    try {
        const { resetCount, debug: resetDebug } = await resetStaleAlignmentScores();
        logs.push(`[WorldReset] reset ${resetCount} states. ${resetDebug.join(', ')}`);
    } catch (e: any) {
        logs.push(`[WorldReset] error: ${e.message}`);
    }

    // 2.5. 名声とアライメントランキングのデータベース集計
    try {
        const { data: worldStateRes } = await supabaseServer
            .from('world_states')
            .select('updated_at')
            .order('updated_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        const cycleStartedAt = worldStateRes?.updated_at
            ? new Date(worldStateRes.updated_at).toISOString()
            : new Date().toISOString();

        const { error: repErr } = await supabaseServer.rpc('aggregate_reputation_ranking');
        if (repErr) throw repErr;

        const { error: alignErr } = await supabaseServer.rpc('aggregate_alignment_ranking', {
            p_cycle_started_at: cycleStartedAt
        });
        if (alignErr) throw alignErr;

        const { error: colosseumErr } = await supabaseServer.rpc('aggregate_colosseum_ranking');
        if (colosseumErr) throw colosseumErr;

        logs.push(`[RankingAggregation] Reputation, Alignment, and Colosseum rankings aggregated via RPC`);

        // 2.6. コロシアムランキング報酬付与処理 (6時間ごと)
        try {
            const { data: topWins, error: topWinsErr } = await supabaseServer
                .from('ranking_colosseum_cache')
                .select('user_id, rank_by_wins, user_name')
                .lte('rank_by_wins', 3)
                .order('rank_by_wins', { ascending: true });

            const { data: topStreaks, error: topStreaksErr } = await supabaseServer
                .from('ranking_colosseum_cache')
                .select('user_id, rank_by_streak, user_name')
                .lte('rank_by_streak', 3)
                .order('rank_by_streak', { ascending: true });

            if (topWinsErr) throw topWinsErr;
            if (topStreaksErr) throw topStreaksErr;

            const rewardMap: Map<string, {
                gold: number;
                reasons: string[];
                userName: string;
            }> = new Map();

            const prizeList = [20000, 10000, 5000];

            if (topWins && topWins.length > 0) {
                for (const u of topWins) {
                    const rank = u.rank_by_wins;
                    if (rank && rank >= 1 && rank <= 3) {
                        const prize = prizeList[rank - 1];
                        const current = rewardMap.get(u.user_id) || { gold: 0, reasons: [] as string[], userName: u.user_name || '旅人' };
                        current.gold += prize;
                        current.reasons.push(`勝利数ランキング第${rank}位 (${prize.toLocaleString()}G)`);
                        rewardMap.set(u.user_id, current);
                    }
                }
            }

            if (topStreaks && topStreaks.length > 0) {
                for (const u of topStreaks) {
                    const rank = u.rank_by_streak;
                    if (rank && rank >= 1 && rank <= 3) {
                        const prize = prizeList[rank - 1];
                        const current = rewardMap.get(u.user_id) || { gold: 0, reasons: [] as string[], userName: u.user_name || '旅人' };
                        current.gold += prize;
                        current.reasons.push(`連勝数ランキング第${rank}位 (${prize.toLocaleString()}G)`);
                        rewardMap.set(u.user_id, current);
                    }
                }
            }

            let colosseumRewardCount = 0;
            for (const [userId, info] of rewardMap.entries()) {
                // 1. ゴールド付与
                const { data: isSuccess, error: goldErr } = await supabaseServer
                    .rpc('increment_gold', { p_user_id: userId, p_amount: info.gold });

                if (goldErr) {
                    logs.push(`[ColosseumReward] Failed to award gold to user ${userId}: ${goldErr.message}`);
                    continue;
                }

                // 2. システム通知インサート
                const reasonText = info.reasons.join('、および');
                const message = `🏆 コロシアムランキング報酬獲得！ ${reasonText} を達成し、合計 ${info.gold.toLocaleString()}G を獲得しました。郵便受け（所持金）に直接付与されました。`;
                
                await supabaseServer.from('notifications').insert({
                    user_id: userId,
                    type: 'system',
                    message: message,
                    read: false
                });

                // 3. user_profiles からロケーションIDや累積日数を引く
                const { data: profile } = await supabaseServer
                    .from('user_profiles')
                    .select('current_location_id, accumulated_days')
                    .eq('id', userId)
                    .single();

                let locationName = null;
                if (profile?.current_location_id) {
                    const { data: loc } = await supabaseServer
                        .from('locations')
                        .select('name')
                        .eq('id', profile.current_location_id)
                        .maybeSingle();
                    locationName = loc?.name || null;
                }

                // 4. user_chronicles インサート
                await supabaseServer.from('user_chronicles').insert({
                    user_id: userId,
                    event_type: 'system_reward',
                    accumulated_days: profile?.accumulated_days || 0,
                    location_id: profile?.current_location_id || null,
                    location_name: locationName,
                    title: '闘技場ランキング報酬獲得',
                    description: `闘技場の定期集計において優秀な戦績を残し、${reasonText}の栄誉と賞金 ${info.gold.toLocaleString()}G を獲得した。`,
                    param_changes: { gold: info.gold },
                    is_major_event: true
                });

                // 5. world_states_history へのインサート（街の噂話の「冒険者の噂」に流す）
                await supabaseServer.from('world_states_history').insert({
                    location_id: profile?.current_location_id || null,
                    event_type: 'colosseum_ranking',
                    old_value: '---',
                    new_value: `${info.gold.toLocaleString()}G`,
                    message: `冒険者「${info.userName}」が闘技場の定期集計にて優秀な戦績を収め、${reasonText}の賞金として ${info.gold.toLocaleString()}G を獲得したそうだ！`,
                });

                colosseumRewardCount++;
            }

            logs.push(`[ColosseumReward] Awarded colosseum ranking prizes to ${colosseumRewardCount} users`);
        } catch (colosseumRewardErr: any) {
            logs.push(`[ColosseumReward] error: ${colosseumRewardErr.message}`);
        }
    } catch (rankErr: any) {
        logs.push(`[RankingAggregation] error: ${rankErr.message}`);
    }

    // 3. 失効した匿名（テストプレイ）プロファイルを削除 (daily)
    // 安全のため失敗しても全体は継続する
    let cleanupLog = 'skipped';
    try {
        const now = new Date().toISOString();
        const { count, error: deleteError } = await supabaseServer
            .from('user_profiles')
            .delete({ count: 'exact' })
            .eq('is_anonymous', true)
            .lt('expires_at', now);
        cleanupLog = deleteError
            ? `error: ${deleteError.message}`
            : `deleted ${count ?? 0} expired anonymous profiles`;
    } catch (cleanupErr: any) {
        cleanupLog = `exception: ${cleanupErr.message}`;
    }

    // 4. Weeklyログインボーナス (daily check)
    // Basic: 2,000G/週, Premium: 5,000G/週
    let weeklyBonusLog = 'skipped';
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // 対象: 有効な（トライアル中ではない）Basic/Premium ユーザーで、最終ボーナスが7日以上前 or null
        const { data: eligibleUsers, error: fetchErr } = await supabaseServer
            .from('user_profiles')
            .select('id, subscription_tier, last_weekly_bonus_at')
            .in('subscription_tier', ['basic', 'premium'])
            .eq('subscription_status', 'active')
            .eq('is_anonymous', false);

        if (fetchErr) throw fetchErr;

        let bonusCount = 0;
        for (const user of (eligibleUsers || [])) {
            // 最終ボーナスから7日未経過ならスキップ
            if (user.last_weekly_bonus_at && user.last_weekly_bonus_at > sevenDaysAgo) continue;

            const amount = user.subscription_tier === 'premium' ? 5000 : 2000;

            // アトミックRPCを呼び出して二重付与を完全に防止し、同時に日付を更新する
            const { data: isSuccess, error: goldErr } = await supabaseServer
                .rpc('process_weekly_gold_bonus', { p_user_id: user.id, p_amount: amount });

            if (goldErr) {
                logs.push(`[WeeklyBonus] Failed to award user ${user.id}: ${goldErr.message}`);
            } else if (isSuccess) {
                bonusCount++;
            }
        }
        weeklyBonusLog = `awarded ${bonusCount} users`;
    } catch (bonusErr: any) {
        weeklyBonusLog = `exception: ${bonusErr.message}`;
    }

    // 5. UGC: ゴールド購入による日次インポート追加枠をリセット
    // UTC 0:00 の時間帯 (0時台) に実行された場合、または force フラグが真の場合のみリセット
    let ugcDailyResetLog = 'skipped';
    const now = new Date();
    const isUtcMidnight = now.getUTCHours() === 0;

    if (isUtcMidnight || isForceUgcReset) {
        try {
            const { count, error: resetErr } = await supabaseServer
                .from('user_profiles')
                .update({ ugc_extra_daily_import: 0 }, { count: 'exact' })
                .gt('ugc_extra_daily_import', 0);
            ugcDailyResetLog = resetErr
                ? `error: ${resetErr.message}`
                : `reset ${count ?? 0} users`;
        } catch (resetErr: any) {
            ugcDailyResetLog = `exception: ${resetErr.message}`;
        }
    } else {
        ugcDailyResetLog = `skipped (UTC hour is ${now.getUTCHours()})`;
    }

    return {
        success: true,
        logs,
        hegemony: result.hegemony,
        cleanup: cleanupLog,
        weekly_bonus: weeklyBonusLog,
        ugc_daily_reset: ugcDailyResetLog
    };
}

export async function POST(req: Request) {
    if (process.env.SUSPEND_CRON === 'true') {
        return NextResponse.json({ success: true, message: 'Cron is suspended' });
    }

    // CRON_SECRET によるアクセス制限
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        console.warn(`[Security] Cron job unauthorized call. CRON_SECRET set: ${!!cronSecret}`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // POST 呼び出し時は手動強制等も考慮し、UGC追加インポートリセットを強制実行します
        const result = await performUpdate(true);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    if (process.env.SUSPEND_CRON === 'true') {
        return NextResponse.json({ success: true, message: 'Cron is suspended' });
    }

    // CRON_SECRET によるアクセス制限
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const forceUgcReset = searchParams.get('forceUgcReset') === 'true';

    try {
        const result = await performUpdate(forceUgcReset);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
