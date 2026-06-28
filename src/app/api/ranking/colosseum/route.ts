process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';

const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const RANKING_LIMIT = 500;

/**
 * GET /api/ranking/colosseum
 * Returns Wins and Streak rankings for Colosseum, with on-demand aggregation.
 */
export async function GET(req: Request) {
    try {
        // Authentication
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.length <= 7) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }
        const userId = user.id;

        // Fetch current cache state
        const { data: latestCache, error: cacheErr } = await supabaseService
            .from('ranking_colosseum_cache')
            .select('*')
            .order('aggregated_at', { ascending: false })
            .limit(1);

        const now = Date.now();
        let aggregatedAt = latestCache?.[0]?.aggregated_at || null;
        let isStale = !aggregatedAt || (now - new Date(aggregatedAt).getTime() > FIFTEEN_MIN_MS);

        if (isStale) {
            try {
                const { error: aggErr } = await supabaseService.rpc('aggregate_colosseum_ranking');
                if (!aggErr) {
                    aggregatedAt = new Date().toISOString();
                } else {
                    console.error('[Ranking Colosseum] RPC aggregate_colosseum_ranking failed:', aggErr);
                }
            } catch (e) {
                console.error('[Ranking Colosseum] Aggregation failed:', e);
            }
        }

        // Fetch top 500 for Wins and Easy/Normal/Hard Streaks
        const [winsRankRes, streakEasyRes, streakNormalRes, streakHardRes] = await Promise.all([
            supabaseService
                .from('ranking_colosseum_cache')
                .select('user_id, user_name, avatar_url, wins, max_streak_easy, max_streak_normal, max_streak_hard, rank_by_wins')
                .order('rank_by_wins', { ascending: true })
                .limit(RANKING_LIMIT),
            supabaseService
                .from('ranking_colosseum_cache')
                .select('user_id, user_name, avatar_url, wins, max_streak_easy, rank_by_streak_easy')
                .order('rank_by_streak_easy', { ascending: true })
                .limit(RANKING_LIMIT),
            supabaseService
                .from('ranking_colosseum_cache')
                .select('user_id, user_name, avatar_url, wins, max_streak_normal, rank_by_streak_normal')
                .order('rank_by_streak_normal', { ascending: true })
                .limit(RANKING_LIMIT),
            supabaseService
                .from('ranking_colosseum_cache')
                .select('user_id, user_name, avatar_url, wins, max_streak_hard, rank_by_streak_hard')
                .order('rank_by_streak_hard', { ascending: true })
                .limit(RANKING_LIMIT),
        ]);

        const excludedUserIds = ['c1cf67dd-527a-497e-bf88-ce10c2cb516f', '5ad434ec-763f-473e-939f-14a5e9e1cc93'];

        const winsRanking = (winsRankRes.data || [])
            .filter((r: any) => !excludedUserIds.includes(r.user_id))
            .map((r: any) => ({
                rank: r.rank_by_wins,
                userId: r.user_id,
                name: r.user_name || '名もなき旅人',
                avatarUrl: r.avatar_url,
                wins: r.wins,
                maxStreakEasy: r.max_streak_easy,
                maxStreakNormal: r.max_streak_normal,
                maxStreakHard: r.max_streak_hard,
            }));

        const streakRankingEasy = (streakEasyRes.data || [])
            .filter((r: any) => !excludedUserIds.includes(r.user_id))
            .map((r: any) => ({
                rank: r.rank_by_streak_easy,
                userId: r.user_id,
                name: r.user_name || '名もなき旅人',
                avatarUrl: r.avatar_url,
                wins: r.wins,
                maxStreak: r.max_streak_easy
            }));

        const streakRankingNormal = (streakNormalRes.data || [])
            .filter((r: any) => !excludedUserIds.includes(r.user_id))
            .map((r: any) => ({
                rank: r.rank_by_streak_normal,
                userId: r.user_id,
                name: r.user_name || '名もなき旅人',
                avatarUrl: r.avatar_url,
                wins: r.wins,
                maxStreak: r.max_streak_normal
            }));

        const streakRankingHard = (streakHardRes.data || [])
            .filter((r: any) => !excludedUserIds.includes(r.user_id))
            .map((r: any) => ({
                rank: r.rank_by_streak_hard,
                userId: r.user_id,
                name: r.user_name || '名もなき旅人',
                avatarUrl: r.avatar_url,
                wins: r.wins,
                maxStreak: r.max_streak_hard
            }));

        // Determine user stats
        const { data: userStats } = await supabaseService
            .from('colosseum_user_stats')
            .select('wins, losses, current_streak_easy, max_streak_easy, current_streak_normal, max_streak_normal, current_streak_hard, max_streak_hard')
            .eq('user_id', userId)
            .maybeSingle();

        let myStats: any = null;
        if (userStats) {
            const hasPlayed = (userStats.wins + userStats.losses) > 0;
            if (hasPlayed) {
                // Find if user is in the cache
                const cachedUserWins = winsRanking.find(r => r.userId === userId);
                const cachedUserEasy = streakRankingEasy.find(r => r.userId === userId);
                const cachedUserNormal = streakRankingNormal.find(r => r.userId === userId);
                const cachedUserHard = streakRankingHard.find(r => r.userId === userId);

                let myWinsRank = cachedUserWins?.rank || null;
                let myEasyRank = cachedUserEasy?.rank || null;
                let myNormalRank = cachedUserNormal?.rank || null;
                let myHardRank = cachedUserHard?.rank || null;

                const maxStreakVal = Math.max(userStats.max_streak_easy, userStats.max_streak_normal, userStats.max_streak_hard);

                // If not in cache (below 500th place), calculate real-time rank count
                if (!myWinsRank) {
                    const { count: winsAhead } = await supabaseService
                        .from('colosseum_user_stats')
                        .select('user_id', { count: 'exact', head: true })
                        .or(`wins.gt.${userStats.wins},and(wins.eq.${userStats.wins},greatest(max_streak_easy,max_streak_normal,max_streak_hard).gt.${maxStreakVal})`);
                    myWinsRank = (winsAhead || 0) + 1;
                }

                if (!myEasyRank) {
                    const { count: easyAhead } = await supabaseService
                        .from('colosseum_user_stats')
                        .select('user_id', { count: 'exact', head: true })
                        .or(`max_streak_easy.gt.${userStats.max_streak_easy},and(max_streak_easy.eq.${userStats.max_streak_easy},wins.gt.${userStats.wins})`);
                    myEasyRank = (easyAhead || 0) + 1;
                }

                if (!myNormalRank) {
                    const { count: normalAhead } = await supabaseService
                        .from('colosseum_user_stats')
                        .select('user_id', { count: 'exact', head: true })
                        .or(`max_streak_normal.gt.${userStats.max_streak_normal},and(max_streak_normal.eq.${userStats.max_streak_normal},wins.gt.${userStats.wins})`);
                    myNormalRank = (normalAhead || 0) + 1;
                }

                if (!myHardRank) {
                    const { count: hardAhead } = await supabaseService
                        .from('colosseum_user_stats')
                        .select('user_id', { count: 'exact', head: true })
                        .or(`max_streak_hard.gt.${userStats.max_streak_hard},and(max_streak_hard.eq.${userStats.max_streak_hard},wins.gt.${userStats.wins})`);
                    myHardRank = (hardAhead || 0) + 1;
                }

                myStats = {
                    wins: userStats.wins,
                    losses: userStats.losses,
                    currentStreakEasy: userStats.current_streak_easy,
                    maxStreakEasy: userStats.max_streak_easy,
                    currentStreakNormal: userStats.current_streak_normal,
                    maxStreakNormal: userStats.max_streak_normal,
                    currentStreakHard: userStats.current_streak_hard,
                    maxStreakHard: userStats.max_streak_hard,
                    winsRank: myWinsRank,
                    streakRankEasy: myEasyRank,
                    streakRankNormal: myNormalRank,
                    streakRankHard: myHardRank,
                };
            }
        }

        return NextResponse.json({
            success: true,
            winsRanking,
            streakRankingEasy,
            streakRankingNormal,
            streakRankingHard,
            myStats,
            aggregatedAt
        });

    } catch (e: any) {
        console.error('[Ranking Colosseum] API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
