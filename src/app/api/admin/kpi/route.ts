process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { getDashboardSupabase } from '@/lib/supabase-dashboard';

export const dynamic = 'force-dynamic';

// Helper to fetch all records in range for views (light-weight since database handles aggregation)
async function fetchAll<T>(
    query: any,
    orderColumn: string = 'id'
): Promise<T[]> {
    let allData: T[] = [];
    let from = 0;
    const limit = 1000;
    while (true) {
        const { data, error } = await query
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

function toJstMonthStr(dateInput: any): string {
    if (!dateInput) return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7).replace('-', '/');
    const d = new Date(dateInput);
    return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7).replace('-', '/');
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
        const category = url.searchParams.get('category') || 'all';

        const responseData: any = {};

        // ═══════════════════════════════════════
        // §1. Category: summary
        // ═══════════════════════════════════════
        if (category === 'summary' || category === 'all') {
            // A. User Profiles Summary
            const { data: profileSummary, error: profSumErr } = await supabaseServer
                .from('user_profile_summary_view')
                .select('total_users, avg_level, anon_users, auth_users')
                .single();
            if (profSumErr) throw profSumErr;

            const totalUsers = profileSummary.total_users || 0;
            const avgLevel = Math.round(Number(profileSummary.avg_level || 0) * 10) / 10;

            // B. Level Distribution
            const { data: levelDist, error: lvlDistErr } = await supabaseServer
                .from('user_level_distribution_view')
                .select('*')
                .single();
            if (lvlDistErr) throw lvlDistErr;

            const levelDistribution = {
                '1': levelDist.range_1 || 0,
                '2-5': levelDist.range_2_5 || 0,
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

            const anonUsers = profileSummary.anon_users || 0;
            const authUsers = profileSummary.auth_users || 0;

            // D. Get quick totals (battles and victories) from daily stats - REMOVED for performance

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

            // F. Calculate DAU/MAU/DPU/MPU for today (using fast parallel range queries and memory Set union)
            let dau = 0, dpu = 0;
            try {
                const { data: latestBasicData, error: latestBasicErr } = await supabaseServer
                    .from('daily_kpi_cache')
                    .select('dau, dpu')
                    .order('date', { ascending: false })
                    .limit(1)
                    .single();
                if (!latestBasicErr && latestBasicData) {
                    dau = latestBasicData.dau || 0;
                    dpu = latestBasicData.dpu || 0;
                }
            } catch (basicErr) {
                console.error('[Admin KPI] Fetching latest basic stats exception:', basicErr);
            }

            const mau = 0, mpu = 0;


            // G. Get total quest count from view starts - REMOVED for performance

            responseData.summary = {
                totalUsers,
                anonUsers,
                authUsers,
                avgLevel,
                dau,
                mau,
                pendingReports: 0,
                totalRevenue,
                subscriptionRevenue,
                subscriptionCount,
                goldPurchaseRevenue,
                goldPurchaseCount,
                totalGoldCharged,
                dpu,
                mpu
            };
            responseData.levelDistribution = levelDistribution;
            responseData.subscriptionDistribution = subscriptionDistribution;
        }

        // ═══════════════════════════════════════
        // §2. Category: daily (Daily Time-Series KPI)
        // ═══════════════════════════════════════
        if (category === 'daily' || category === 'all') {
            const targetDaysList: string[] = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                targetDaysList.push(toJstDateStr(d));
            }

            const oldestDateStr = targetDaysList[0];

            // Check if daily cache needs to be refreshed (if stale - older than 5 minutes)
            try {
                const todayJst = toJstDateStr(new Date());
                const { data: cacheStatus, error: statusErr } = await supabaseServer
                    .from('daily_kpi_cache')
                    .select('updated_at')
                    .eq('date', todayJst)
                    .single();

                const isStale = !cacheStatus || 
                                statusErr || 
                                (Date.now() - new Date(cacheStatus.updated_at).getTime() > 5 * 60 * 1000); // 5 minutes

                if (isStale) {
                    console.log('[Admin KPI] Cache is stale or missing. Refreshing daily KPI cache...');
                    await supabaseServer.rpc('refresh_daily_kpi_cache', { full_refresh: false });
                }
            } catch (cacheErr) {
                console.error('[Admin KPI] Failed to check/refresh daily KPI cache:', cacheErr);
            }

            // Query cached daily KPI stats
            const dailyBasicData = await fetchAll<any>(
                supabaseServer
                    .from('daily_kpi_cache')
                    .select('date, new_users, new_users_registered, new_users_guest, total_battles, victories, defeats, fleds, revenue, dpu, dau')
                    .gte('date', oldestDateStr),
                'date'
            );

            const basicDataMap: Record<string, any> = {};
            dailyBasicData.forEach(row => {
                basicDataMap[row.date] = row;
            });

            responseData.dailyKPI = targetDaysList.map(date => {
                const basic = basicDataMap[date] || {
                    new_users: 0,
                    new_users_registered: 0,
                    new_users_guest: 0,
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
                    newUsersRegistered: basic.new_users_registered,
                    newUsersGuest: basic.new_users_guest,
                    totalBattles: basic.total_battles,
                    victories: basic.victories,
                    defeats: basic.defeats,
                    fleds: basic.fleds,
                    winRate: basic.total_battles > 0 ? Math.round((basic.victories / basic.total_battles) * 100) : 0,
                    dau: basic.dau,
                    mau: basic.dau, // fallback sets MAU equivalent to DAU to prevent timeout
                    revenue: basic.revenue,
                    dpu: basic.dpu,
                    mpu: basic.dpu // fallback sets MPU equivalent to DPU to prevent timeout
                };
            });
        }

        // ═══════════════════════════════════════
        // §3. Category: quests (Quest statistics)
        // ═══════════════════════════════════════
        if (category === 'quests' || category === 'all') {
            const questStatsData = await fetchAll<any>(
                supabaseServer
                    .from('quest_activity_stats_view')
                    .select('scenario_id, title, quest_type, start_count, complete_count, abandon_count'),
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
            const questRanking = questStats.slice(0, 10).map(q => ({
                id: q.id,
                title: q.title,
                count: q.completeCount
            }));
            responseData.questStats = questStats;
            responseData.questRanking = questRanking;
            responseData.totalQuests = totalQuests;
        }

        // ═══════════════════════════════════════
        // §4. Category: colosseum (Colosseum metrics)
        // ═══════════════════════════════════════
        if (category === 'colosseum' || category === 'all') {
            const targetDaysList: string[] = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                targetDaysList.push(toJstDateStr(d));
            }

            const [colStatsResult, colDailyResult] = await Promise.all([
                supabaseServer.rpc('get_colosseum_summary_stats'),
                supabaseServer.rpc('get_colosseum_daily_stats', { days_limit: days })
            ]);

            const colStats = colStatsResult.data;
            const colDaily = colDailyResult.data;

            let colSummary = {
                totalPlayers: 0,
                totalBattles: 0,
                winRate: 0,
                maxStreak: 0,
                totalGoldSpent: 0
            };

            if (!colStatsResult.error && colStats && colStats.length > 0) {
                const row = colStats[0];
                const battles = Number(row.total_battles || 0);
                const wins = Number(row.total_wins || 0);
                colSummary = {
                    totalPlayers: Number(row.total_players || 0),
                    totalBattles: battles,
                    winRate: battles > 0 ? Math.round((wins / battles) * 100) : 0,
                    maxStreak: Number(row.max_streak || 0),
                    totalGoldSpent: Number(row.total_gold_spent || 0)
                };
            }

            const colDailyMap: Record<string, any> = {};
            (colDaily || []).forEach((row: any) => {
                const date = row.date;
                if (!colDailyMap[date]) {
                    colDailyMap[date] = {
                        starts: { easy: 0, normal: 0, hard: 0 },
                        completes: { easy: 0, normal: 0, hard: 0 },
                        abandons: { easy: 0, normal: 0, hard: 0 },
                        goldSpent: 0
                    };
                }
                const diff = (row.difficulty || 'easy') as 'easy' | 'normal' | 'hard';
                const action = (row.action || 'start') as 'start' | 'complete' | 'abandon';
                const count = Number(row.count || 0);
                const gold = Number(row.gold_spent || 0);

                colDailyMap[date].goldSpent += gold;
                if (action === 'start') {
                    colDailyMap[date].starts[diff] = count;
                } else if (action === 'complete') {
                    colDailyMap[date].completes[diff] = count;
                } else if (action === 'abandon') {
                    colDailyMap[date].abandons[diff] = count;
                }
            });

            const dailyColosseumKPI = targetDaysList.map(date => {
                const entry = colDailyMap[date] || {
                    starts: { easy: 0, normal: 0, hard: 0 },
                    completes: { easy: 0, normal: 0, hard: 0 },
                    abandons: { easy: 0, normal: 0, hard: 0 },
                    goldSpent: 0
                };
                return {
                    date,
                    starts: entry.starts,
                    completes: entry.completes,
                    abandons: entry.abandons,
                    goldSpent: entry.goldSpent
                };
            });

            responseData.colosseum = {
                summary: colSummary,
                daily: dailyColosseumKPI
            };
        }

        // ═══════════════════════════════════════
        // §5. Category: academy (Magic Academy metrics)
        // ═══════════════════════════════════════
        if (category === 'academy' || category === 'all') {
            const targetDaysList: string[] = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                targetDaysList.push(toJstDateStr(d));
            }

            const [acadStatsResult, acadDailyResult] = await Promise.all([
                supabaseServer.rpc('get_academy_summary_stats'),
                supabaseServer.rpc('get_academy_daily_stats', { days_limit: days })
            ]);

            const acadStats = acadStatsResult.data;
            const acadDaily = acadDailyResult.data;

            let acadSummary = {
                totalPlayers: 0,
                totalPacks: 0,
                totalGoldSpent: 0,
                totalRefundGold: 0
            };

            if (!acadStatsResult.error && acadStats && acadStats.length > 0) {
                const row = acadStats[0];
                acadSummary = {
                    totalPlayers: Number(row.total_players || 0),
                    totalPacks: Number(row.total_packs || 0),
                    totalGoldSpent: Number(row.total_gold_spent || 0),
                    totalRefundGold: Number(row.total_refund_gold || 0)
                };
            }

            const acadDailyMap: Record<string, any> = {};
            (acadDaily || []).forEach((row: any) => {
                const date = row.date;
                if (!acadDailyMap[date]) {
                    acadDailyMap[date] = {
                        packs: {},
                        goldSpent: {},
                        refundGold: {}
                    };
                }
                const series = row.pack_series || 'chaos_and_rebellion';
                acadDailyMap[date].packs[series] = Number(row.pack_count || 0);
                acadDailyMap[date].goldSpent[series] = Number(row.gold_spent || 0);
                acadDailyMap[date].refundGold[series] = Number(row.refund_gold || 0);
            });

            const dailyAcademyKPI = targetDaysList.map(date => {
                const entry = acadDailyMap[date] || {
                    packs: {},
                    goldSpent: {},
                    refundGold: {}
                };
                return {
                    date,
                    packs: entry.packs,
                    goldSpent: entry.goldSpent,
                    refundGold: entry.refundGold
                };
            });

            responseData.academy = {
                summary: acadSummary,
                daily: dailyAcademyKPI
            };
        }

        // ═══════════════════════════════════════
        // §5.1 Category: battles (Total battle count and win rate)
        // ═══════════════════════════════════════
        if (category === 'battles' || category === 'all') {
            const dailyBasicData = await fetchAll<any>(
                supabaseServer
                    .from('daily_basic_stats_view')
                    .select('total_battles, victories'),
                'date'
            );
            let totalBattles = 0;
            let totalVictories = 0;
            dailyBasicData.forEach(row => {
                totalBattles += row.total_battles || 0;
                totalVictories += row.victories || 0;
            });
            const winRate = totalBattles > 0 ? Math.round((totalVictories / totalBattles) * 100) : 0;
            responseData.battles = {
                totalBattles,
                winRate
            };
        }

        // ═══════════════════════════════════════
        // §5.2 Category: gold (Total gold flow metrics)
        // ═══════════════════════════════════════
        if (category === 'gold' || category === 'all') {
            const { data: profileSummary, error: profSumErr } = await supabaseServer
                .from('user_profile_summary_view')
                .select('total_gold, avg_gold, max_gold')
                .single();
            if (profSumErr) throw profSumErr;
            responseData.gold = {
                totalGold: Number(profileSummary.total_gold || 0),
                avgGold: Math.round(Number(profileSummary.avg_gold || 0)),
                maxGold: profileSummary.max_gold || 0
            };
        }

        // ═══════════════════════════════════════
        // §6. Category: monthly (Monthly Time-Series KPI)
        // ═══════════════════════════════════════
        if (category === 'monthly' || category === 'all') {
            // 1. Fetch pre-calculated monthly KPI metrics in JST from monthly_kpi_view
            const { data: monthlyData, error: monthlyErr } = await supabaseServer
                .from('monthly_kpi_view')
                .select('month, revenue, mau, mpu, new_users_registered, new_users_guest')
                .order('month', { ascending: true });
            
            if (monthlyErr) throw monthlyErr;

            const monthlyKPI = (monthlyData || []).map(row => ({
                month: row.month,
                revenue: Number(row.revenue || 0),
                mau: Number(row.mau || 0),
                mpu: Number(row.mpu || 0),
                newUsersRegistered: Number(row.new_users_registered || 0),
                newUsersGuest: Number(row.new_users_guest || 0)
            }));

            const targetMonthsLabels = monthlyKPI.map(m => m.month);

            // Fetch Colosseum monthly stats (using the daily RPC and grouping by month)
            const { data: colDaily } = await supabaseServer.rpc('get_colosseum_daily_stats', { days_limit: 366 });
            const colMonthlyMap: Record<string, any> = {};
            (colDaily || []).forEach((row: any) => {
                const date = row.date;
                const month = date.slice(0, 7).replace('-', '/');
                if (!colMonthlyMap[month]) {
                    colMonthlyMap[month] = {
                        starts: { easy: 0, normal: 0, hard: 0 },
                        completes: { easy: 0, normal: 0, hard: 0 },
                        abandons: { easy: 0, normal: 0, hard: 0 },
                        goldSpent: 0
                    };
                }
                const diff = (row.difficulty || 'easy') as 'easy' | 'normal' | 'hard';
                const action = (row.action || 'start') as 'start' | 'complete' | 'abandon';
                const count = Number(row.count || 0);
                const gold = Number(row.gold_spent || 0);

                colMonthlyMap[month].goldSpent += gold;
                if (action === 'start') {
                    colMonthlyMap[month].starts[diff] = (colMonthlyMap[month].starts[diff] || 0) + count;
                } else if (action === 'complete') {
                    colMonthlyMap[month].completes[diff] = (colMonthlyMap[month].completes[diff] || 0) + count;
                } else if (action === 'abandon') {
                    colMonthlyMap[month].abandons[diff] = (colMonthlyMap[month].abandons[diff] || 0) + count;
                }
            });

            const monthlyColosseumKPI = targetMonthsLabels.map(month => {
                const entry = colMonthlyMap[month] || {
                    starts: { easy: 0, normal: 0, hard: 0 },
                    completes: { easy: 0, normal: 0, hard: 0 },
                    abandons: { easy: 0, normal: 0, hard: 0 },
                    goldSpent: 0
                };
                return {
                    month,
                    starts: entry.starts,
                    completes: entry.completes,
                    abandons: entry.abandons,
                    goldSpent: entry.goldSpent
                };
            });

            // Fetch Academy monthly stats (using the daily RPC and grouping by month)
            const { data: acadDaily } = await supabaseServer.rpc('get_academy_daily_stats', { days_limit: 366 });
            const acadMonthlyMap: Record<string, any> = {};
            (acadDaily || []).forEach((row: any) => {
                const date = row.date;
                const month = date.slice(0, 7).replace('-', '/');
                if (!acadMonthlyMap[month]) {
                    acadMonthlyMap[month] = {
                        packs: {},
                        goldSpent: {},
                        refundGold: {}
                    };
                }
                const series = row.pack_series || 'chaos_and_rebellion';
                acadMonthlyMap[month].packs[series] = (acadMonthlyMap[month].packs[series] || 0) + Number(row.pack_count || 0);
                acadMonthlyMap[month].goldSpent[series] = (acadMonthlyMap[month].goldSpent[series] || 0) + Number(row.gold_spent || 0);
                acadMonthlyMap[month].refundGold[series] = (acadMonthlyMap[month].refundGold[series] || 0) + Number(row.refund_gold || 0);
            });

            const monthlyAcademyKPI = targetMonthsLabels.map(month => {
                const entry = acadMonthlyMap[month] || {
                    packs: {},
                    goldSpent: {},
                    refundGold: {}
                };
                return {
                    month,
                    packs: entry.packs,
                    goldSpent: entry.goldSpent,
                    refundGold: entry.refundGold
                };
            });

            responseData.monthly = {
                basic: monthlyKPI,
                colosseum: monthlyColosseumKPI,
                academy: monthlyAcademyKPI
            };
        }

        return NextResponse.json(responseData);

    } catch (err: any) {
        console.error('[Admin KPI] API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
