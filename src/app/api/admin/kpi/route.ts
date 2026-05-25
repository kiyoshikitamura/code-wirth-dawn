import { NextResponse } from 'next/server';
import { supabaseDashboard, isDashboardProduction } from '@/lib/supabase-dashboard';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // 1. 認証チェック
        const adminKey = req.headers.get('x-admin-key');
        if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!supabaseDashboard) {
            return NextResponse.json({ error: 'Dashboard Supabase client not initialized' }, { status: 500 });
        }

        const supabaseServer = supabaseDashboard;

        // 2. 各データのフェッチ
        // ユーザープロフィール
        let profilesData: any[] = [];
        let profileError: any = null;

        const { data: dataWithCreated, error: errCreated } = await supabaseServer
            .from('user_profiles')
            .select('created_at, updated_at, gold, level, subscription_tier');

        if (errCreated) {
            const { data: dataWithUpdated, error: errUpdated } = await supabaseServer
                .from('user_profiles')
                .select('updated_at, gold, level, subscription_tier');
            
            if (errUpdated) {
                profileError = errUpdated;
            } else {
                profilesData = dataWithUpdated || [];
            }
        } else {
            profilesData = dataWithCreated || [];
        }
        
        if (profileError) {
            console.error('[Admin KPI] User profiles fetch error:', profileError);
            return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 });
        }

        // バトルセッション
        const { data: battleSessions, error: battleError } = await supabaseServer
            .from('battle_sessions')
            .select('created_at, status, user_id');
        if (battleError) {
            console.warn('[Admin KPI] Battle sessions fetch error:', battleError);
        }

        // クエスト行動ログ
        const { data: questLogs, error: questLogsErr } = await supabaseServer
            .from('quest_activity_logs')
            .select('created_at, user_id, scenario_id, action');
        if (questLogsErr) {
            console.warn('[Admin KPI] Quest activity logs fetch error:', questLogsErr);
        }

        // 決済ログ
        const { data: paymentLogs, error: paymentsErr } = await supabaseServer
            .from('payment_logs')
            .select('created_at, user_id, amount, gold_amount, type');
        if (paymentsErr) {
            console.warn('[Admin KPI] Payment logs fetch error:', paymentsErr);
        }

        // シナリオ一覧
        const { data: scenarios, error: scenariosError } = await supabaseServer
            .from('scenarios')
            .select('id, title, quest_type');
        if (scenariosError) {
            console.warn('[Admin KPI] Scenarios fetch error:', scenariosError);
        }

        // 3. データ加工
        const nowMs = Date.now();
        const oneDayAgo = nowMs - 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = nowMs - 30 * 24 * 60 * 60 * 1000;

        // --- ユーザープロフィール集計 ---
        let totalGold = 0;
        let maxGold = 0;
        let totalLevel = 0;
        const subscriptionDistribution = { free: 0, basic: 0, premium: 0 };
        const levelDistribution = { '1-5': 0, '6-10': 0, '11-15': 0, '16+': 0 };
        const userRegistrationsByDate: { [key: string]: number } = {};

        const activeUsers24h = new Set<string>();
        const activeUsers30d = new Set<string>();

        (profilesData || []).forEach((profile: any) => {
            const rawDate = profile.created_at || profile.updated_at;
            const dateStr = rawDate 
                ? new Date(rawDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];
                
            userRegistrationsByDate[dateStr] = (userRegistrationsByDate[dateStr] || 0) + 1;

            // プロフィール更新によるアクティブ判定
            const updatedTime = new Date(profile.updated_at || Date.now()).getTime();
            if (updatedTime >= oneDayAgo) activeUsers24h.add(profile.id || '');
            if (updatedTime >= thirtyDaysAgo) activeUsers30d.add(profile.id || '');

            // サブスク分布
            const tier = profile.subscription_tier || 'free';
            if (tier === 'basic') subscriptionDistribution.basic++;
            else if (tier === 'premium') subscriptionDistribution.premium++;
            else subscriptionDistribution.free++;

            // ゴールド集計
            const gold = profile.gold || 0;
            totalGold += gold;
            if (gold > maxGold) maxGold = gold;

            // レベル集計
            const lvl = profile.level || 1;
            totalLevel += lvl;
            if (lvl <= 5) levelDistribution['1-5']++;
            else if (lvl <= 10) levelDistribution['6-10']++;
            else if (lvl <= 15) levelDistribution['11-15']++;
            else levelDistribution['16+']++;
        });

        const avgGold = profilesData.length > 0 ? Math.round(totalGold / profilesData.length) : 0;
        const avgLevel = profilesData.length > 0 ? Math.round((totalLevel / profilesData.length) * 10) / 10 : 0;

        // --- バトル・クエストによるアクティブUU集計 ---
        const userActivityByDate: { [key: string]: Set<string> } = {};
        const battlesByDate: { [key: string]: { total: number; victory: number; defeat: number; fled: number } } = {};
        let totalBattles = 0;
        let totalVictories = 0;

        (battleSessions || []).forEach((session: any) => {
            const rawDate = session.created_at;
            const dateStr = rawDate
                ? new Date(rawDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];
            
            // バトル勝敗集計
            if (!battlesByDate[dateStr]) {
                battlesByDate[dateStr] = { total: 0, victory: 0, defeat: 0, fled: 0 };
            }
            battlesByDate[dateStr].total++;
            totalBattles++;

            if (session.status === 'victory') {
                battlesByDate[dateStr].victory++;
                totalVictories++;
            } else if (session.status === 'defeat') {
                battlesByDate[dateStr].defeat++;
            } else if (session.status === 'fled') {
                battlesByDate[dateStr].fled++;
            }

            // アクティブUU集計
            if (session.user_id) {
                if (!userActivityByDate[dateStr]) {
                    userActivityByDate[dateStr] = new Set<string>();
                }
                userActivityByDate[dateStr].add(session.user_id);

                const createdTime = new Date(rawDate).getTime();
                if (createdTime >= oneDayAgo) activeUsers24h.add(session.user_id);
                if (createdTime >= thirtyDaysAgo) activeUsers30d.add(session.user_id);
            }
        });

        // クエストログによるアクティブUU集計
        let totalQuests = 0;
        (questLogs || []).forEach((log: any) => {
            const rawDate = log.created_at;
            const dateStr = rawDate
                ? new Date(rawDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];

            if (log.action === 'start') {
                totalQuests++;
            }

            if (log.user_id) {
                if (!userActivityByDate[dateStr]) {
                    userActivityByDate[dateStr] = new Set<string>();
                }
                userActivityByDate[dateStr].add(log.user_id);

                const createdTime = new Date(rawDate).getTime();
                if (createdTime >= oneDayAgo) activeUsers24h.add(log.user_id);
                if (createdTime >= thirtyDaysAgo) activeUsers30d.add(log.user_id);
            }
        });

        const dau = activeUsers24h.size;
        const mau = activeUsers30d.size;

        // --- 課金決済集計 ---
        let totalRevenue = 0;
        let subscriptionRevenue = 0;
        let subscriptionCount = 0;
        let goldPurchaseRevenue = 0;
        let goldPurchaseCount = 0;
        let totalGoldCharged = 0;

        const payingUsers24h = new Set<string>();
        const payingUsers30d = new Set<string>();

        const payingUsersByDate: { [key: string]: Set<string> } = {};
        const paymentsByDate: { [key: string]: number } = {};

        (paymentLogs || []).forEach((log: any) => {
            const amount = log.amount || 0;
            totalRevenue += amount;

            if (log.type === 'subscription') {
                subscriptionRevenue += amount;
                subscriptionCount++;
            } else if (log.type === 'gold_purchase') {
                goldPurchaseRevenue += amount;
                goldPurchaseCount++;
                totalGoldCharged += log.gold_amount || 0;
            }

            const rawDate = log.created_at;
            const dateStr = rawDate
                ? new Date(rawDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];

            if (log.user_id) {
                if (!payingUsersByDate[dateStr]) {
                    payingUsersByDate[dateStr] = new Set<string>();
                }
                payingUsersByDate[dateStr].add(log.user_id);

                const createdTime = new Date(rawDate).getTime();
                if (createdTime >= oneDayAgo) payingUsers24h.add(log.user_id);
                if (createdTime >= thirtyDaysAgo) payingUsers30d.add(log.user_id);
            }

            paymentsByDate[dateStr] = (paymentsByDate[dateStr] || 0) + amount;
        });

        const dpu = payingUsers24h.size;
        const mpu = payingUsers30d.size;

        // GET params
        const url = new URL(req.url);
        const daysParam = url.searchParams.get('days');
        const days = daysParam ? parseInt(daysParam, 10) : 30;

        // --- 過去N日間の日別KPI集計 ---
        const targetDaysList: string[] = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            targetDaysList.push(d.toISOString().split('T')[0]);
        }

        // windowDays日間の一意のアクティブユーザー数を計算するヘルパー
        const getUniqueUsersInWindow = (activityMap: { [key: string]: Set<string> }, targetDateStr: string, windowDays: number = 30): number => {
            const targetDate = new Date(targetDateStr);
            const uniqueUsers = new Set<string>();
            
            for (let i = 0; i < windowDays; i++) {
                const d = new Date(targetDate);
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const usersOnDay = activityMap[dateStr];
                if (usersOnDay) {
                    usersOnDay.forEach(uid => uniqueUsers.add(uid));
                }
            }
            return uniqueUsers.size;
        };

        const dailyKPI = targetDaysList.map(date => {
            const battles = battlesByDate[date] || { total: 0, victory: 0, defeat: 0, fled: 0 };
            return {
                date,
                newUsers: userRegistrationsByDate[date] || 0,
                totalBattles: battles.total,
                victories: battles.victory,
                defeats: battles.defeat,
                fleds: battles.fled,
                winRate: battles.total > 0 ? Math.round((battles.victory / battles.total) * 100) : 0,
                dau: userActivityByDate[date] ? userActivityByDate[date].size : 0,
                mau: getUniqueUsersInWindow(userActivityByDate, date, 30),
                revenue: paymentsByDate[date] || 0,
                dpu: payingUsersByDate[date] ? payingUsersByDate[date].size : 0,
                mpu: getUniqueUsersInWindow(payingUsersByDate, date, 30)
            };
        });

        // --- 全クエスト統計の算出 ---
        const scenarioMap: Record<number | string, { title: string; quest_type: string }> = {};
        (scenarios || []).forEach((s: any) => {
            scenarioMap[s.id] = { title: s.title, quest_type: s.quest_type || 'main' };
        });

        const questStatsMap: Record<number | string, { id: number | string; title: string; quest_type: string; startCount: number; completeCount: number; abandonCount: number }> = {};
        
        // ログが存在するシナリオをまず集計
        (questLogs || []).forEach((log: any) => {
            const sId = log.scenario_id;
            if (!questStatsMap[sId]) {
                const sInfo = scenarioMap[sId] || { title: `シナリオ ID ${sId}`, quest_type: 'unknown' };
                questStatsMap[sId] = {
                    id: sId,
                    title: sInfo.title,
                    quest_type: sInfo.quest_type,
                    startCount: 0,
                    completeCount: 0,
                    abandonCount: 0
                };
            }

            if (log.action === 'start') {
                questStatsMap[sId].startCount++;
            } else if (log.action === 'complete') {
                questStatsMap[sId].completeCount++;
            } else if (log.action === 'abandon') {
                questStatsMap[sId].abandonCount++;
            }
        });

        // 全シナリオ（ログがないものも含める）を網羅する
        (scenarios || []).forEach((s: any) => {
            if (!questStatsMap[s.id]) {
                questStatsMap[s.id] = {
                    id: s.id,
                    title: s.title,
                    quest_type: s.quest_type || 'main',
                    startCount: 0,
                    completeCount: 0,
                    abandonCount: 0
                };
            }
        });

        const questStats = Object.values(questStatsMap).map(q => {
            const clearRate = q.startCount > 0 ? Math.round((q.completeCount / q.startCount) * 100) : 0;
            return {
                ...q,
                clearRate
            };
        }).sort((a, b) => b.startCount - a.startCount); // 開始回数が多い順

        // 互換性のための古いランキング形式
        const questRanking = questStats.slice(0, 10).map(q => ({
            id: q.id,
            title: q.title,
            count: q.completeCount
        }));

        return NextResponse.json({
            summary: {
                totalUsers: profilesData.length,
                totalGold,
                avgGold,
                maxGold,
                avgLevel,
                totalBattles,
                winRate: totalBattles > 0 ? Math.round((totalVictories / totalBattles) * 100) : 0,
                dau,
                mau,
                totalQuests,
                pendingReports: 0, // 互換性のため
                
                // Payments
                totalRevenue,
                subscriptionRevenue,
                subscriptionCount,
                goldPurchaseRevenue,
                goldPurchaseCount,
                totalGoldCharged,
                dpu,
                mpu
            },
            levelDistribution,
            subscriptionDistribution,
            questRanking, // 互換性のため
            questStats,
            dailyKPI
        });

    } catch (err: any) {
        console.error('[Admin KPI] API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
