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

        // Fetch top 500 for Wins and Streaks
        const [winsRankRes, streakRankRes] = await Promise.all([
            supabaseService
                .from('ranking_colosseum_cache')
                .select('user_id, user_name, avatar_url, wins, max_streak, rank_by_wins')
                .order('rank_by_wins', { ascending: true })
                .limit(RANKING_LIMIT),
            supabaseService
                .from('ranking_colosseum_cache')
                .select('user_id, user_name, avatar_url, wins, max_streak, rank_by_streak')
                .order('rank_by_streak', { ascending: true })
                .limit(RANKING_LIMIT)
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
                maxStreak: r.max_streak
            }));

        const streakRanking = (streakRankRes.data || [])
            .filter((r: any) => !excludedUserIds.includes(r.user_id))
            .map((r: any) => ({
                rank: r.rank_by_streak,
                userId: r.user_id,
                name: r.user_name || '名もなき旅人',
                avatarUrl: r.avatar_url,
                wins: r.wins,
                maxStreak: r.max_streak
            }));

        // Determine user stats
        const { data: userStats } = await supabaseService
            .from('colosseum_user_stats')
            .select('wins, losses, current_streak, max_streak')
            .eq('user_id', userId)
            .maybeSingle();

        let myStats: any = null;
        if (userStats) {
            const hasPlayed = (userStats.wins + userStats.losses) > 0;
            if (hasPlayed) {
                // Find if user is in the cache
                const cachedUserWins = winsRanking.find(r => r.userId === userId);
                const cachedUserStreak = streakRanking.find(r => r.userId === userId);

                let myWinsRank = cachedUserWins?.rank || null;
                let myStreakRank = cachedUserStreak?.rank || null;

                // If not in cache (below 500th place), calculate real-time rank count
                if (!myWinsRank) {
                    const { count: winsAhead } = await supabaseService
                        .from('colosseum_user_stats')
                        .select('user_id', { count: 'exact', head: true })
                        .or(`wins.gt.${userStats.wins},and(wins.eq.${userStats.wins},max_streak.gt.${userStats.max_streak})`);
                    myWinsRank = (winsAhead || 0) + 1;
                }

                if (!myStreakRank) {
                    const { count: streakAhead } = await supabaseService
                        .from('colosseum_user_stats')
                        .select('user_id', { count: 'exact', head: true })
                        .or(`max_streak.gt.${userStats.max_streak},and(max_streak.eq.${userStats.max_streak},wins.gt.${userStats.wins})`);
                    myStreakRank = (streakAhead || 0) + 1;
                }

                myStats = {
                    wins: userStats.wins,
                    losses: userStats.losses,
                    currentStreak: userStats.current_streak,
                    maxStreak: userStats.max_streak,
                    winsRank: myWinsRank,
                    streakRank: myStreakRank
                };
            }
        }

        return NextResponse.json({
            success: true,
            winsRanking,
            streakRanking,
            myStats,
            aggregatedAt
        });

    } catch (e: any) {
        console.error('[Ranking Colosseum] API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
