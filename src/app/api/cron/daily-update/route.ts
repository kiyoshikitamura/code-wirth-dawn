import { NextResponse } from 'next/server';
import { updateWorldSimulation } from '@/lib/world-simulation';
import { supabaseServer } from '@/lib/supabase-admin';
import { resetStaleAlignmentScores } from '@/services/worldStateReset';
import { checkAndFireTrigger } from '@/lib/shareUtils';

export const dynamic = 'force-dynamic';

/**
 * 共通の定期アップデート処理
 * @param isForceUgcReset UGC追加インポート回数リセットを強制するか
 */
async function performUpdate(isForceUgcReset: boolean) {
    const logs: string[] = [];

    // 1. 世界シミュレーションのアップデート (6時間ごと)
    const result = await updateWorldSimulation(supabaseServer);
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

        // 2.5.5. 名声とアライメントランキングの1位自動BBS投稿処理
        // 1. 名声ランキング1位
        try {
            const { data: topRep } = await supabaseServer
                .from('ranking_reputation_cache')
                .select('user_id, user_name, total_reputation')
                .neq('user_id', 'c1cf67dd-527a-497e-bf88-ce10c2cb516f')
                .neq('user_id', '5ad434ec-763f-473e-939f-14a5e9e1cc93')
                .not('user_name', 'ilike', 'テスト%')
                .not('user_name', 'ilike', 'test%')
                .order('rank_desc', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (topRep && topRep.total_reputation > 0) {
                const fired = await checkAndFireTrigger(supabaseServer, topRep.user_id, 'ranking_fame_1st', '');
                if (fired) {
                    const { GossipService } = await import('@/services/gossipService');
                    const gossipService = new GossipService(supabaseServer);
                    // 投稿順序制御：世界情勢変化が最新（最上部）に来るように、ランキング投稿は5秒巻き戻す
                    const backdateStr = new Date(Date.now() - 5000).toISOString();
                    await gossipService.postSystemMessage(
                        `「名声ランキング第1位の栄座に冒険者『${topRep.user_name || '名もなき旅人'}』が輝いた。この世界で最も高名な旅人としてその名を轟かせている。」`,
                        null,
                        topRep.user_id,
                        backdateStr
                    );
                    logs.push(`[RankingGossip] Posted reputation rank #1 gossip for user ${topRep.user_id}`);
                }
            }
        } catch (repGossipErr: any) {
            logs.push(`[RankingGossip] Reputation #1 check error: ${repGossipErr.message}`);
        }

        // 2. アライメントランキング1位
        try {
            const { data: topAlign } = await supabaseServer
                .from('ranking_alignment_cache')
                .select('user_id, user_name, order_gained, chaos_gained, justice_gained, evil_gained, total_gained')
                .neq('user_id', 'c1cf67dd-527a-497e-bf88-ce10c2cb516f')
                .neq('user_id', '5ad434ec-763f-473e-939f-14a5e9e1cc93')
                .not('user_name', 'ilike', 'テスト%')
                .not('user_name', 'ilike', 'test%')
                .order('rank', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (topAlign && topAlign.total_gained > 0) {
                const fired = await checkAndFireTrigger(supabaseServer, topAlign.user_id, 'ranking_alignment_1st', '');
                if (fired) {
                    // 最も獲得量の多かった属性軸を判定
                    const axes = [
                        { key: '秩序', val: topAlign.order_gained || 0, flavor: '秩序をもたらす' },
                        { key: '混沌', val: topAlign.chaos_gained || 0, flavor: '混沌を司る' },
                        { key: '正義', val: topAlign.justice_gained || 0, flavor: '正義を貫く' },
                        { key: '悪', val: topAlign.evil_gained || 0, flavor: '畏怖される' },
                    ];
                    axes.sort((a, b) => b.val - a.val);
                    const topAxis = axes[0];

                    const { GossipService } = await import('@/services/gossipService');
                    const gossipService = new GossipService(supabaseServer);
                    // 投稿順序制御：世界情勢変化が最新（最上部）に来るように、ランキング投稿は5秒巻き戻す
                    const backdateStr = new Date(Date.now() - 5000).toISOString();
                    await gossipService.postSystemMessage(
                        `「${topAxis.key}ランキング第1位の栄冠は、冒険者『${topAlign.user_name || '名もなき旅人'}』の頭上に輝いた。この世界で最も${topAxis.flavor}存在として君臨している。」`,
                        null,
                        topAlign.user_id,
                        backdateStr
                    );
                    logs.push(`[RankingGossip] Posted alignment rank #1 gossip for user ${topAlign.user_id} (${topAxis.key})`);
                }
            }
        } catch (alignGossipErr: any) {
            logs.push(`[RankingGossip] Alignment #1 check error: ${alignGossipErr.message}`);
        }

        // 2.6. コロシアムランキング報酬付与処理 (6時間ごと)
        try {
            const [topWinsRes, topEasyRes, topNormalRes, topHardRes] = await Promise.all([
                supabaseServer
                    .from('ranking_colosseum_cache')
                    .select('user_id, rank_by_wins, user_name')
                    .lte('rank_by_wins', 3)
                    .order('rank_by_wins', { ascending: true }),
                supabaseServer
                    .from('ranking_colosseum_cache')
                    .select('user_id, rank_by_streak_easy, user_name')
                    .lte('rank_by_streak_easy', 3)
                    .order('rank_by_streak_easy', { ascending: true }),
                supabaseServer
                    .from('ranking_colosseum_cache')
                    .select('user_id, rank_by_streak_normal, user_name')
                    .lte('rank_by_streak_normal', 3)
                    .order('rank_by_streak_normal', { ascending: true }),
                supabaseServer
                    .from('ranking_colosseum_cache')
                    .select('user_id, rank_by_streak_hard, user_name')
                    .lte('rank_by_streak_hard', 3)
                    .order('rank_by_streak_hard', { ascending: true })
            ]);

            if (topWinsRes.error) throw topWinsRes.error;
            if (topEasyRes.error) throw topEasyRes.error;
            if (topNormalRes.error) throw topNormalRes.error;
            if (topHardRes.error) throw topHardRes.error;

            const topWins = topWinsRes.data;
            const topEasy = topEasyRes.data;
            const topNormal = topNormalRes.data;
            const topHard = topHardRes.data;

            const rewardMap: Map<string, {
                gold: number;
                items: { itemId: number; quantity: number }[];
                reasons: string[];
                userName: string;
            }> = new Map();

            const winsPrizes = [10000, 5000, 1000];
            const easyPrizes = [3000, 2000, 500];
            const normalPrizes = [5000, 3000, 1000];
            const hardPrizes = [10000, 5000, 3000];

            if (topWins && topWins.length > 0) {
                for (const u of topWins) {
                    const rank = u.rank_by_wins;
                    if (u.user_id && rank && rank >= 1 && rank <= 3) {
                        const prize = winsPrizes[rank - 1];
                        const current = rewardMap.get(u.user_id) || { gold: 0, items: [] as { itemId: number; quantity: number }[], reasons: [] as string[], userName: u.user_name || '旅人' };
                        current.gold += prize;
                        current.reasons.push(`勝利数ランキング第${rank}位 (${prize.toLocaleString()}G)`);
                        rewardMap.set(u.user_id, current);

                        // 個別通知インサート
                        const message = `🏆 コロシアムランキング報酬獲得！ 勝利数ランキング第${rank}位を達成し、賞金 ${prize.toLocaleString()}G を獲得しました。郵便受け（所持金）に直接付与されました。`;
                        await supabaseServer.from('notifications').insert({
                            user_id: u.user_id,
                            type: 'system',
                            message: message,
                            read: false
                        });
                    }
                }
            }

            if (topEasy && topEasy.length > 0) {
                for (const u of topEasy) {
                    const rank = u.rank_by_streak_easy;
                    if (u.user_id && rank && rank >= 1 && rank <= 3) {
                        const prize = easyPrizes[rank - 1];
                        const current = rewardMap.get(u.user_id) || { gold: 0, items: [] as { itemId: number; quantity: number }[], reasons: [] as string[], userName: u.user_name || '旅人' };
                        current.gold += prize;
                        
                        let itemText = '';
                        let itemLogText = '';
                        if (rank === 1) {
                            current.items.push({ itemId: 76, quantity: 1 });
                            itemText = ' ＋ 知識と契約の鍵 x1';
                            itemLogText = '、および 知識と契約の鍵 x1';
                        } else if (rank === 2) {
                            current.items.push({ itemId: 76, quantity: 1 });
                            itemText = ' ＋ 知識と契約の鍵 x1';
                            itemLogText = '、および 知識と契約の鍵 x1';
                        }
                        
                        current.reasons.push(`Easy連勝ランキング第${rank}位 (${prize.toLocaleString()}G${itemText})`);
                        rewardMap.set(u.user_id, current);

                        // 個別通知インサート
                        const message = `🏆 コロシアムランキング報酬獲得！ Easy連勝ランキング第${rank}位を達成し、賞金 ${prize.toLocaleString()}G${itemLogText} を獲得しました。郵便受け（所持金・バッグ）に直接付与されました。`;
                        await supabaseServer.from('notifications').insert({
                            user_id: u.user_id,
                            type: 'system',
                            message: message,
                            read: false
                        });
                    }
                }
            }

            if (topNormal && topNormal.length > 0) {
                for (const u of topNormal) {
                    const rank = u.rank_by_streak_normal;
                    if (u.user_id && rank && rank >= 1 && rank <= 3) {
                        const prize = normalPrizes[rank - 1];
                        const current = rewardMap.get(u.user_id) || { gold: 0, items: [] as { itemId: number; quantity: number }[], reasons: [] as string[], userName: u.user_name || '旅人' };
                        current.gold += prize;
                        
                        let itemText = '';
                        let itemLogText = '';
                        if (rank === 1) {
                            current.items.push({ itemId: 76, quantity: 1 });
                            itemText = ' ＋ 知識と契約の鍵 x1';
                            itemLogText = '、および 知識と契約 of 鍵 x1';
                        } else if (rank === 2) {
                            current.items.push({ itemId: 76, quantity: 1 });
                            itemText = ' ＋ 知識と契約の鍵 x1';
                            itemLogText = '、および 知識と契約 of 鍵 x1';
                        }
                        
                        current.reasons.push(`Normal連勝ランキング第${rank}位 (${prize.toLocaleString()}G${itemText})`);
                        rewardMap.set(u.user_id, current);

                        // 個別通知インサート
                        const message = `🏆 コロシアムランキング報酬獲得！ Normal連勝ランキング第${rank}位を達成し、賞金 ${prize.toLocaleString()}G${itemLogText} を獲得しました。郵便受け（所持金・バッグ）に直接付与されました。`;
                        await supabaseServer.from('notifications').insert({
                            user_id: u.user_id,
                            type: 'system',
                            message: message,
                            read: false
                        });
                    }
                }
            }

            if (topHard && topHard.length > 0) {
                for (const u of topHard) {
                    const rank = u.rank_by_streak_hard;
                    if (u.user_id && rank && rank >= 1 && rank <= 3) {
                        const prize = hardPrizes[rank - 1];
                        const current = rewardMap.get(u.user_id) || { gold: 0, items: [] as { itemId: number; quantity: number }[], reasons: [] as string[], userName: u.user_name || '旅人' };
                        current.gold += prize;
                        
                        let itemText = '';
                        let itemLogText = '';
                        if (rank === 1) {
                            current.items.push({ itemId: 77, quantity: 1 });
                            itemText = ' ＋ 魔道と鉄壁の鍵 x1';
                            itemLogText = '、および 魔道と鉄壁 of 鍵 x1';
                        } else if (rank === 2) {
                            current.items.push({ itemId: 77, quantity: 1 });
                            itemText = ' ＋ 魔道と鉄壁の鍵 x1';
                            itemLogText = '、および 魔道と鉄壁 of 鍵 x1';
                        }
                        
                        current.reasons.push(`Hard連勝ランキング第${rank}位 (${prize.toLocaleString()}G${itemText})`);
                        rewardMap.set(u.user_id, current);

                        // 個別通知インサート
                        const message = `🏆 コロシアムランキング報酬獲得！ Hard連勝ランキング第${rank}位を達成し、賞金 ${prize.toLocaleString()}G${itemLogText} を獲得しました。郵便受け（所持金・バッグ）に直接付与されました。`;
                        await supabaseServer.from('notifications').insert({
                            user_id: u.user_id,
                            type: 'system',
                            message: message,
                            read: false
                        });
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

                // 1.2. アイテム付与
                const itemsAddedTextList: string[] = [];
                for (const item of info.items) {
                    const { data: inv } = await supabaseServer
                        .from('inventory')
                        .select('id, quantity')
                        .eq('user_id', userId)
                        .eq('item_id', item.itemId)
                        .maybeSingle();

                    if (inv) {
                        const { error: invErr } = await supabaseServer
                            .from('inventory')
                            .update({ quantity: inv.quantity + item.quantity })
                            .eq('id', inv.id);
                        if (invErr) {
                            logs.push(`[ColosseumReward] Failed to add item ${item.itemId} to user ${userId}: ${invErr.message}`);
                        }
                    } else {
                        const { error: invErr } = await supabaseServer
                            .from('inventory')
                            .insert({
                                user_id: userId,
                                item_id: item.itemId,
                                quantity: item.quantity
                            });
                        if (invErr) {
                            logs.push(`[ColosseumReward] Failed to insert item ${item.itemId} to user ${userId}: ${invErr.message}`);
                        }
                    }
                    const itemName = item.itemId === 76 ? '知識と契約の鍵' : '魔道と鉄壁の鍵';
                    itemsAddedTextList.push(`${itemName} x${item.quantity}`);
                }

                const itemsText = itemsAddedTextList.length > 0 ? '、および ' + itemsAddedTextList.join('、') : '';
                const reasonText = info.reasons.join('、および');

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

                // 4. user_chronicles インサート (合算記録はそのまま維持)
                await supabaseServer.from('user_chronicles').insert({
                    user_id: userId,
                    event_type: 'system_reward',
                    accumulated_days: profile?.accumulated_days || 0,
                    location_id: profile?.current_location_id || null,
                    location_name: locationName,
                    title: '闘技場ランキング報酬獲得',
                    description: `闘技場の定期集計において優秀な戦績を残し、${reasonText}の栄誉と賞金 ${info.gold.toLocaleString()}G${itemsText} を獲得した。`,
                    param_changes: { gold: info.gold, items: info.items },
                    is_major_event: true
                });

                // 5. world_states_history へのインサート（街の噂話の「冒険者の噂」に流す - 合算記録維持）
                await supabaseServer.from('world_states_history').insert({
                    location_id: profile?.current_location_id || null,
                    event_type: 'colosseum_ranking',
                    old_value: '---',
                    new_value: `${info.gold.toLocaleString()}G`,
                    message: `冒険者「${info.userName}」が闘技場の定期集計にて優秀な戦績を収め、${reasonText}の賞金として ${info.gold.toLocaleString()}G${itemsText} を獲得したそうだ！`,
                });

                colosseumRewardCount++;
            }

            logs.push(`[ColosseumReward] Awarded colosseum ranking prizes to ${colosseumRewardCount} users`);
        } catch (colosseumRewardErr: any) {
            logs.push(`[ColosseumReward] error: ${colosseumRewardErr.message}`);
        }

        // 2.7. コロシアムユーザー戦績リセット処理 (6時間ごと、JST 6/19 12:00 から開始)
        try {
            const now = new Date();
            const resetStartTime = new Date('2026-06-19T12:00:00+09:00'); // JST 6/19 12:00
            if (now >= resetStartTime) {
                // A. ランキングキャッシュの履歴退避 (1ヶ月保存用)
                try {
                    const { data: cacheData } = await supabaseServer
                        .from('ranking_colosseum_cache')
                        .select('user_id, user_name, avatar_url, wins, max_streak_easy, max_streak_normal, max_streak_hard, rank_by_wins, rank_by_streak_easy, rank_by_streak_normal, rank_by_streak_hard, aggregated_at');

                    if (cacheData && cacheData.length > 0) {
                        const historyRecords = cacheData.map(r => ({
                            cycle_end_at: r.aggregated_at || now.toISOString(),
                            user_id: r.user_id,
                            user_name: r.user_name,
                            wins: r.wins,
                            max_streak_easy: r.max_streak_easy,
                            max_streak_normal: r.max_streak_normal,
                            max_streak_hard: r.max_streak_hard,
                            rank_by_wins: r.rank_by_wins,
                            rank_by_streak_easy: r.rank_by_streak_easy,
                            rank_by_streak_normal: r.rank_by_streak_normal,
                            rank_by_streak_hard: r.rank_by_streak_hard
                        }));

                        const { error: histError } = await supabaseServer
                            .from('colosseum_ranking_history')
                            .insert(historyRecords);
                        
                        if (histError) {
                            logs.push(`[ColosseumReset] Failed to archive ranking history: ${histError.message}`);
                        } else {
                            logs.push(`[ColosseumReset] Successfully archived ${historyRecords.length} ranking records to history`);
                        }
                    }
                } catch (archiveExc: any) {
                    logs.push(`[ColosseumReset] Archiving exception: ${archiveExc.message}`);
                }

                // B. キャッシュの即時リセット (表示クリア)
                const { error: cacheResetErr } = await supabaseServer
                    .from('ranking_colosseum_cache')
                    .delete()
                    .neq('user_id', '00000000-0000-0000-0000-000000000000');
                if (cacheResetErr) {
                    logs.push(`[ColosseumReset] Failed to clear ranking cache: ${cacheResetErr.message}`);
                } else {
                    logs.push(`[ColosseumReset] Successfully cleared ranking display cache`);
                }

                // C. 戦績テーブルのリセット
                const { error: resetErr } = await supabaseServer
                    .from('colosseum_user_stats')
                    .delete()
                    .neq('user_id', '00000000-0000-0000-0000-000000000000');

                if (resetErr) {
                    logs.push(`[ColosseumReset] Failed to reset user stats: ${resetErr.message}`);
                } else {
                    logs.push(`[ColosseumReset] Successfully reset user stats for the new 6h cycle`);
                }

                // D. 30日以上前の古い履歴のクリーンアップ (1ヶ月保存)
                try {
                    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
                    const { error: cleanError } = await supabaseServer
                        .from('colosseum_ranking_history')
                        .delete()
                        .lt('cycle_end_at', thirtyDaysAgo);
                    if (cleanError) {
                        logs.push(`[ColosseumReset] Failed to clean old history: ${cleanError.message}`);
                    } else {
                        logs.push(`[ColosseumReset] Cleaned up colosseum history older than 30 days`);
                    }
                } catch (cleanExc: any) {
                    logs.push(`[ColosseumReset] Cleanup exception: ${cleanExc.message}`);
                }
            } else {
                logs.push(`[ColosseumReset] Reset skipped (starts from JST 6/19 12:00)`);
            }
        } catch (resetExc: any) {
            logs.push(`[ColosseumReset] exception: ${resetExc.message}`);
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

            // アトミックRPCを呼び出してゴールド＋鍵を付与し、同時に日付を更新する
            const { data: isSuccess, error: bonusErr } = await supabaseServer
                .rpc('process_weekly_subscription_bonus', { p_user_id: user.id, p_tier: user.subscription_tier });

            if (bonusErr) {
                logs.push(`[WeeklyBonus] Failed to award user ${user.id}: ${bonusErr.message}`);
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
