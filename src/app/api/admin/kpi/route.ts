import { NextResponse } from 'next/server';
import { getDashboardSupabase } from '@/lib/supabase-dashboard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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

        // ═══════════════════════════════════════
        // §1. Query database Views & RPCs (In Parallel)
        // ═══════════════════════════════════════
        const [
            profileSummaryResult,
            levelDistResult,
            subDistResult,
            questStatsData,
            paySummaryDataResult,
            dailyKpiResult,
            monthlyKpiResult,
            colStatsResult,
            colDailyResult,
            acadStatsResult,
            acadDailyResult
        ] = await Promise.all([
            supabaseServer.from('user_profile_summary_view').select('*').single(),
            supabaseServer.from('user_level_distribution_view').select('*').single(),
            supabaseServer.from('user_subscription_distribution_view').select('*').single(),
            fetchAll<any>(supabaseServer.from('quest_activity_stats_view').select('scenario_id, title, quest_type, start_count, complete_count, abandon_count'), 'scenario_id'),
            supabaseServer.from('payment_summary_view').select('*'),
            supabaseServer.rpc('get_daily_kpi', { days_limit: days }),
            supabaseServer.from('monthly_kpi_view').select('*'),
            supabaseServer.rpc('get_colosseum_summary_stats'),
            supabaseServer.rpc('get_colosseum_daily_stats', { days_limit: days }),
            supabaseServer.rpc('get_academy_summary_stats'),
            supabaseServer.rpc('get_academy_daily_stats', { days_limit: days })
        ]);

        // A. User Profiles Summary unpacking
        const { data: profileSummary, error: profSumErr } = profileSummaryResult;
        if (profSumErr) throw profSumErr;

        const totalUsers = profileSummary.total_users || 0;
        const anonUsers = profileSummary.anon_users || 0;
        const authUsers = profileSummary.auth_users || 0;
        const totalGold = Number(profileSummary.total_gold || 0);
        const avgGold = Math.round(Number(profileSummary.avg_gold || 0));
        const maxGold = profileSummary.max_gold || 0;
        const avgLevel = Math.round(Number(profileSummary.avg_level || 0) * 10) / 10;

        // No anonymous map or dailyActiveUserIds list needed in JS (done in RPC)

        // B. Level Distribution unpacking
        const { data: levelDist, error: lvlDistErr } = levelDistResult;
        if (lvlDistErr) throw lvlDistErr;

        const levelDistribution = {
            '1': levelDist.range_1 || 0,
            '2-5': levelDist.range_2_5 || 0,
            '6-10': levelDist.range_6_10 || 0,
            '11-15': levelDist.range_11_15 || 0,
            '16+': levelDist.range_16_plus || 0
        };

        // C. Subscription Distribution unpacking
        const { data: subDist, error: subDistErr } = subDistResult;
        if (subDistErr) throw subDistErr;

        const subscriptionDistribution = {
            free: subDist.free_count || 0,
            basic: subDist.basic_count || 0,
            premium: subDist.premium_count || 0
        };

        // D. Quest stats processing
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

        // E. Payment summary stats unpacking
        const { data: paySummaryData, error: paySumErr } = paySummaryDataResult;
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

        // F. Daily KPI calculations using get_daily_kpi RPC
        const { data: dailyKpiData, error: dailyKpiErr } = dailyKpiResult;
        if (dailyKpiErr) throw dailyKpiErr;

        const dailyKPI = (dailyKpiData || []).map((row: any) => ({
            date: row.kpi_date,
            newUsers: row.new_users,
            newUsersRegistered: row.new_users_registered,
            newUsersGuest: row.new_users_guest,
            totalBattles: row.total_battles,
            victories: row.victories,
            defeats: row.defeats,
            fleds: row.fleds,
            winRate: row.total_battles > 0 ? Math.round((row.victories / row.total_battles) * 100) : 0,
            dau: row.dau,
            mau: row.mau,
            anonMau: row.anon_mau,
            authMau: row.auth_mau,
            revenue: row.revenue,
            dpu: row.dpu,
            pu: row.dpu, // Crucial compatibility key for d.pu.toLocaleString() in page.tsx
            mpu: row.mpu
        }));

        // G. Map target days and months lists (used by Colosseum/Academy KPI mapping)
        const targetDaysList: string[] = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            targetDaysList.push(toJstDateStr(d));
        }

        const targetMonthsList: string[] = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            targetMonthsList.push(toJstMonthStr(d));
        }

        // H. Map monthly KPI array from database view monthly_kpi_view
        const { data: monthlyKpiData, error: monthlyKpiErr } = monthlyKpiResult;
        if (monthlyKpiErr) throw monthlyKpiErr;

        const monthlyKPI = (monthlyKpiData || []).map((row: any) => ({
            month: row.month,
            revenue: Number(row.revenue || 0),
            mau: row.mau || 0,
            mpu: row.mpu || 0,
            newUsersRegistered: row.new_users_registered || 0,
            newUsersGuest: row.new_users_guest || 0
        }));

        // Sum overall total battles and wins from all daily stats
        let totalBattles = 0;
        let totalVictories = 0;
        dailyKPI.forEach((row: any) => {
            totalBattles += row.totalBattles || 0;
            totalVictories += row.victories || 0;
        });
        const winRate = totalBattles > 0 ? Math.round((totalVictories / totalBattles) * 100) : 0;

        // Extract latest values for DAU/MAU/DPU/MPU summaries from the last row of dailyKPI
        const todayRow = dailyKPI[dailyKPI.length - 1] || {
            dau: 0,
            mau: 0,
            anonMau: 0,
            authMau: 0,
            dpu: 0,
            mpu: 0
        };
        const dau = todayRow.dau;
        const mau = todayRow.mau;
        const anonMau = todayRow.anonMau;
        const authMau = todayRow.authMau;
        const dpu = todayRow.dpu;
        const mpu = todayRow.mpu;

        // Fetch Colosseum stats via RPC unpacking
        const { data: colStats, error: colStatsErr } = colStatsResult;
        const { data: colDaily, error: colDailyErr } = colDailyResult;

        if (colStatsErr) console.error('[Admin KPI] Colosseum summary RPC error:', colStatsErr);
        if (colDailyErr) console.error('[Admin KPI] Colosseum daily RPC error:', colDailyErr);

        let colSummary = {
            totalPlayers: 0,
            totalBattles: 0,
            winRate: 0,
            maxStreak: 0,
            totalGoldSpent: 0
        };

        if (!colStatsErr && colStats && colStats.length > 0) {
            const row = colStats[0];
            const battles = Number(row.total_battles || 0);
            const wins = Number(row.total_wins || 0);
            colSummary = {
                totalPlayers: Number(row.total_players || 0),
                totalBattles: battles,
                winRate: battles > 0 ? Math.round((wins / battles) * 100) : 0,
                maxStreak: Number(row.max_streak || 0),
                totalGoldSpent: Number(row.total_gold_spent || 0),
            };
        }

        const colDailyMap: Record<string, { 
            starts: Record<string, number>, 
            completes: Record<string, number>, 
            abandons: Record<string, number>,
            goldSpent: number 
        }> = {};

        const colMonthlyMap: Record<string, { 
            starts: Record<string, number>, 
            completes: Record<string, number>, 
            abandons: Record<string, number>,
            goldSpent: number 
        }> = {};

        (colDaily || []).forEach((row: any) => {
            const date = row.date;
            const month = date.slice(0, 7).replace('-', '/');
            
            // Daily Grouping
            if (!colDailyMap[date]) {
                colDailyMap[date] = {
                    starts: { easy: 0, normal: 0, hard: 0 },
                    completes: { easy: 0, normal: 0, hard: 0 },
                    abandons: { easy: 0, normal: 0, hard: 0 },
                    goldSpent: 0
                };
            }
            
            // Monthly Grouping
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

            colDailyMap[date].goldSpent += gold;
            colMonthlyMap[month].goldSpent += gold;

            if (action === 'start') {
                colDailyMap[date].starts[diff] = count;
                colMonthlyMap[month].starts[diff] = (colMonthlyMap[month].starts[diff] || 0) + count;
            } else if (action === 'complete') {
                colDailyMap[date].completes[diff] = count;
                colMonthlyMap[month].completes[diff] = (colMonthlyMap[month].completes[diff] || 0) + count;
            } else if (action === 'abandon') {
                colDailyMap[date].abandons[diff] = count;
                colMonthlyMap[month].abandons[diff] = (colMonthlyMap[month].abandons[diff] || 0) + count;
            }
        });

        const dailyColosseumKPI = targetDaysList.map((date: string) => {
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

        const monthlyColosseumKPI = targetMonthsList.map((month: string) => {
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

        // Fetch Magic Academy stats via RPC unpacking
        const { data: acadStats, error: acadStatsErr } = acadStatsResult;
        const { data: acadDaily, error: acadDailyErr } = acadDailyResult;

        if (acadStatsErr) console.error('[Admin KPI] Academy summary RPC error:', acadStatsErr);
        if (acadDailyErr) console.error('[Admin KPI] Academy daily RPC error:', acadDailyErr);

        let acadSummary = {
            totalPlayers: 0,
            totalPacks: 0,
            totalGoldSpent: 0,
            totalRefundGold: 0
        };

        if (!acadStatsErr && acadStats && acadStats.length > 0) {
            const row = acadStats[0];
            acadSummary = {
                totalPlayers: Number(row.total_players || 0),
                totalPacks: Number(row.total_packs || 0),
                totalGoldSpent: Number(row.total_gold_spent || 0),
                totalRefundGold: Number(row.total_refund_gold || 0)
            };
        }

        const acadDailyMap: Record<string, {
            packs: Record<string, number>,
            goldSpent: Record<string, number>,
            refundGold: Record<string, number>
        }> = {};

        const acadMonthlyMap: Record<string, {
            packs: Record<string, number>,
            goldSpent: Record<string, number>,
            refundGold: Record<string, number>
        }> = {};

        (acadDaily || []).forEach((row: any) => {
            const date = row.date;
            const month = date.slice(0, 7).replace('-', '/');
            
            // Daily Grouping
            if (!acadDailyMap[date]) {
                acadDailyMap[date] = {
                    packs: {},
                    goldSpent: {},
                    refundGold: {}
                };
            }

            // Monthly Grouping
            if (!acadMonthlyMap[month]) {
                acadMonthlyMap[month] = {
                    packs: {},
                    goldSpent: {},
                    refundGold: {}
                };
            }

            const series = row.pack_series || 'chaos_and_rebellion';
            const packCount = Number(row.pack_count || 0);
            const goldSpent = Number(row.gold_spent || 0);
            const refundGold = Number(row.refund_gold || 0);

            acadDailyMap[date].packs[series] = packCount;
            acadDailyMap[date].goldSpent[series] = goldSpent;
            acadDailyMap[date].refundGold[series] = refundGold;

            acadMonthlyMap[month].packs[series] = (acadMonthlyMap[month].packs[series] || 0) + packCount;
            acadMonthlyMap[month].goldSpent[series] = (acadMonthlyMap[month].goldSpent[series] || 0) + goldSpent;
            acadMonthlyMap[month].refundGold[series] = (acadMonthlyMap[month].refundGold[series] || 0) + refundGold;
        });

        const dailyAcademyKPI = targetDaysList.map((date: string) => {
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

        const monthlyAcademyKPI = targetMonthsList.map((month: string) => {
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

        return NextResponse.json({
            summary: {
                totalUsers,
                anonUsers,
                authUsers,
                totalGold,
                avgGold,
                maxGold,
                avgLevel,
                totalBattles,
                winRate,
                dau,
                mau,
                anonMau,
                authMau,
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
            dailyKPI,
            monthlyKPI,
            colosseum: {
                summary: colSummary,
                daily: dailyColosseumKPI,
                monthly: monthlyColosseumKPI
            },
            academy: {
                summary: acadSummary,
                daily: dailyAcademyKPI,
                monthly: monthlyAcademyKPI
            }
        });

    } catch (err: any) {
        console.error('[Admin KPI] API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
