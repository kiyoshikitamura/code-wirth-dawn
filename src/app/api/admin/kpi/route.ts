import { NextResponse } from 'next/server';
import { getDashboardSupabase } from '@/lib/supabase-dashboard';

export const dynamic = 'force-dynamic';

// Helper to fetch all records in range for views (light-weight since database handles aggregation)
async function fetchAll<T>(
    queryBuilder: any,
    selectColumns: string,
    orderColumn: string = 'id'
): Promise<T[]> {
    let allData: T[] = [];
    let from = 0;
    const limit = 1000;
    while (true) {
        const { data, error } = await queryBuilder
            .select(selectColumns)
            .order(orderColumn, { ascending: true })
            .range(from, from + limit - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < limit) break;
        from += limit;
    }
    return allData;
}

function toJstDateStr(dateInput: any): string {
    if (!dateInput) return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
    const d = new Date(dateInput);
    return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
}

export async function GET(req: Request) {
    try {
        // 1. Authorization Check
        const adminKey = req.headers.get('x-admin-key');
        if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseServer = getDashboardSupabase();
        if (!supabaseServer) {
            return NextResponse.json({ error: 'Dashboard Supabase client not initialized.' }, { status: 500 });
        }

        // GET params
        const url = new URL(req.url);
        const daysParam = url.searchParams.get('days');
        const days = daysParam ? parseInt(daysParam, 10) : 30;

        // ═══════════════════════════════════════
        // §1. Query database Views
        // ═══════════════════════════════════════

        // A. User Profiles Summary
        const { data: profileSummary, error: profSumErr } = await supabaseServer
            .from('user_profile_summary_view')
            .select('*')
            .single();
        if (profSumErr) throw profSumErr;

        const totalUsers = profileSummary.total_users || 0;
        const totalGold = Number(profileSummary.total_gold || 0);
        const avgGold = Math.round(Number(profileSummary.avg_gold || 0));
        const maxGold = profileSummary.max_gold || 0;
        const avgLevel = Math.round(Number(profileSummary.avg_level || 0) * 10) / 10;

        // B. Level Distribution
        const { data: levelDist, error: lvlDistErr } = await supabaseServer
            .from('user_level_distribution_view')
            .select('*')
            .single();
        if (lvlDistErr) throw lvlDistErr;

        const levelDistribution = {
            '1-5': levelDist.range_1_5 || 0,
            '6-10': levelDist.range_6_10 || 0,
            '11-15': levelDist.range_11_15 || 0,
            '16+': levelDist.range_16_plus || 0
        };

        // C. Subscription Distribution
        const { data: subDist, error: subDistErr } = await supabaseServer
            .from('user_subscription_distribution_view')
            .select('*')
            .single();
        if (subDistErr) throw subDistErr;

        const subscriptionDistribution = {
            free: subDist.free_count || 0,
            basic: subDist.basic_count || 0,
            premium: subDist.premium_count || 0
        };

        // D. Quest stats (starts, completes, abandons per scenario)
        const questStatsData = await fetchAll<any>(
            supabaseServer.from('quest_activity_stats_view'),
            'scenario_id, title, quest_type, start_count, complete_count, abandon_count',
            'scenario_id'
        );

        const questStats = questStatsData.map(q => {
            const startCount = q.start_count || 0;
            const completeCount = q.complete_count || 0;
            const abandonCount = q.abandon_count || 0;
            const clearRate = startCount > 0 ? Math.round((completeCount / startCount) * 100) : 0;
            return {
                id: q.scenario_id,
                title: q.title,
                quest_type: q.quest_type,
                startCount,
                completeCount,
                abandonCount,
                clearRate
            };
        }).sort((a, b) => b.startCount - a.startCount);

        const totalQuests = questStats.reduce((sum, q) => sum + q.startCount, 0);

        // Old ranking format for compatibility
        const questRanking = questStats.slice(0, 10).map(q => ({
            id: q.id,
            title: q.title,
            count: q.completeCount
        }));

        // E. Payment summary stats
        const { data: paySummaryData, error: paySumErr } = await supabaseServer
            .from('payment_summary_view')
            .select('*');
        if (paySumErr) throw paySumErr;

        let totalRevenue = 0;
        let subscriptionRevenue = 0;
        let subscriptionCount = 0;
        let goldPurchaseRevenue = 0;
        let goldPurchaseCount = 0;
        let totalGoldCharged = 0;

        (paySummaryData || []).forEach(p => {
            const rev = Number(p.revenue || 0);
            const count = p.count || 0;
            const gold = Number(p.total_gold || 0);

            totalRevenue += rev;
            if (p.type === 'subscription') {
                subscriptionRevenue = rev;
                subscriptionCount = count;
            } else if (p.type === 'gold_purchase') {
                goldPurchaseRevenue = rev;
                goldPurchaseCount = count;
                totalGoldCharged = gold;
            }
        });

        // F. Daily time-series stats (last 366 days in JST)
        const dailyBasicData = await fetchAll<any>(
            supabaseServer.from('daily_basic_stats_view'),
            'date, new_users, total_battles, victories, defeats, fleds, revenue, dpu, dau',
            'date'
        );

        // G. Light-weight user IDs per day to compute sliding window MAU/MPU
        const dailyActiveUserIds = await fetchAll<any>(
            supabaseServer.from('daily_active_user_ids_view'),
            'date, user_id',
            'date'
        );
        const dailyPayingUserIds = await fetchAll<any>(
            supabaseServer.from('daily_paying_user_ids_view'),
            'date, user_id',
            'date'
        );

        // Map user IDs sets per date
        const activeUsersByDate: Record<string, Set<string>> = {};
        const payingUsersByDate: Record<string, Set<string>> = {};

        dailyActiveUserIds.forEach(row => {
            if (!activeUsersByDate[row.date]) activeUsersByDate[row.date] = new Set();
            activeUsersByDate[row.date].add(row.user_id);
        });
        dailyPayingUserIds.forEach(row => {
            if (!payingUsersByDate[row.date]) payingUsersByDate[row.date] = new Set();
            payingUsersByDate[row.date].add(row.user_id);
        });

        // Helper to compute unique count in a window
        const getUniqueUsersInWindow = (activityMap: Record<string, Set<string>>, targetDateStr: string, windowDays: number = 30): number => {
            const targetDate = new Date(targetDateStr);
            const uniqueUsers = new Set<string>();
            for (let i = 0; i < windowDays; i++) {
                const d = new Date(targetDate);
                d.setDate(d.getDate() - i);
                const dateStr = toJstDateStr(d);
                const usersOnDay = activityMap[dateStr];
                if (usersOnDay) {
                    usersOnDay.forEach(uid => uniqueUsers.add(uid));
                }
            }
            return uniqueUsers.size;
        };

        // H. Map daily KPI array for the requested range
        const targetDaysList: string[] = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            targetDaysList.push(toJstDateStr(d));
        }

        const basicDataMap: Record<string, any> = {};
        dailyBasicData.forEach(row => {
            basicDataMap[row.date] = row;
        });

        const dailyKPI = targetDaysList.map(date => {
            const basic = basicDataMap[date] || {
                new_users: 0,
                total_battles: 0,
                victories: 0,
                defeats: 0,
                fleds: 0,
                revenue: 0,
                dpu: 0,
                dau: 0
            };
            return {
                date,
                newUsers: basic.new_users,
                totalBattles: basic.total_battles,
                victories: basic.victories,
                defeats: basic.defeats,
                fleds: basic.fleds,
                winRate: basic.total_battles > 0 ? Math.round((basic.victories / basic.total_battles) * 100) : 0,
                dau: basic.dau,
                mau: getUniqueUsersInWindow(activeUsersByDate, date, 30),
                revenue: basic.revenue,
                dpu: basic.dpu,
                mpu: getUniqueUsersInWindow(payingUsersByDate, date, 30)
            };
        });

        // Sum overall total battles and wins from all daily stats
        let totalBattles = 0;
        let totalVictories = 0;
        dailyBasicData.forEach(row => {
            totalBattles += row.total_battles || 0;
            totalVictories += row.victories || 0;
        });
        const winRate = totalBattles > 0 ? Math.round((totalVictories / totalBattles) * 100) : 0;

        // Extract latest values for DAU/MAU/DPU/MPU summaries
        const todayStr = toJstDateStr(new Date());
        const dau = activeUsersByDate[todayStr] ? activeUsersByDate[todayStr].size : 0;
        const mau = getUniqueUsersInWindow(activeUsersByDate, todayStr, 30);
        const dpu = payingUsersByDate[todayStr] ? payingUsersByDate[todayStr].size : 0;
        const mpu = getUniqueUsersInWindow(payingUsersByDate, todayStr, 30);

        return NextResponse.json({
            summary: {
                totalUsers,
                totalGold,
                avgGold,
                maxGold,
                avgLevel,
                totalBattles,
                winRate,
                dau,
                mau,
                totalQuests,
                pendingReports: 0,
                
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
            questRanking,
            questStats,
            dailyKPI
        });

    } catch (err: any) {
        console.error('[Admin KPI] API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
