import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const RANKING_LIMIT = 20;

/**
 * GET /api/ranking
 * Returns reputation and alignment rankings with on-demand aggregation.
 * spec_v19 §4
 */
export async function GET(req: Request) {
    try {
        // Auth
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

        // Parallel: fetch current caches + world state + user data
        const [repCacheRes, alignCacheRes, worldStateRes, userProfileRes, userRepsRes] = await Promise.all([
            supabaseService.from('ranking_reputation_cache').select('*').order('aggregated_at', { ascending: false }).limit(1),
            supabaseService.from('ranking_alignment_cache').select('*').order('aggregated_at', { ascending: false }).limit(1),
            supabaseService.from('world_states').select('updated_at').order('updated_at', { ascending: true }).limit(1).maybeSingle(),
            supabaseService.from('user_profiles').select('id, name, order_pts, chaos_pts, justice_pts, evil_pts').eq('id', userId).single(),
            supabaseService.from('reputations').select('score').eq('user_id', userId),
        ]);

        const now = Date.now();
        const worldUpdatedAt = worldStateRes.data?.updated_at ? new Date(worldStateRes.data.updated_at).getTime() : now;
        const cycleStartedAt = new Date(worldUpdatedAt).toISOString();
        const cycleEndsAt = new Date(worldUpdatedAt + SIX_HOURS_MS).toISOString();

        // --- Reputation Ranking (Fetches from cache, aggregates on-demand if stale) ---
        let repAggregatedAt = repCacheRes.data?.[0]?.aggregated_at || null;
        let repStatus = 'ready';

        const lastRepAggregation = repAggregatedAt ? new Date(repAggregatedAt).getTime() : 0;
        const repStale = !repAggregatedAt || (now - lastRepAggregation > FIFTEEN_MIN_MS);

        if (repStale) {
            repStatus = 'aggregating';
            try {
                const { error: repErr } = await supabaseService.rpc('aggregate_reputation_ranking');
                if (!repErr) {
                    repStatus = 'ready';
                    repAggregatedAt = new Date().toISOString();
                } else {
                    console.error('[Ranking] RPC aggregate_reputation_ranking failed:', repErr);
                }
            } catch (e) {
                console.error('[Ranking] Reputation aggregation failed:', e);
            }
        }

        const [repDescRes, repAscRes] = await Promise.all([
            supabaseService.from('ranking_reputation_cache').select('*').neq('user_id', 'c1cf67dd-527a-497e-bf88-ce10c2cb516f').order('rank_desc', { ascending: true }).limit(RANKING_LIMIT),
            supabaseService.from('ranking_reputation_cache').select('*').neq('user_id', 'c1cf67dd-527a-497e-bf88-ce10c2cb516f').order('rank_asc', { ascending: true }).limit(RANKING_LIMIT),
        ]);


        const topDesc = (repDescRes.data || []).map((r: any) => ({
            rank: r.rank_desc, userId: r.user_id, name: r.user_name || '名もなき旅人', value: r.total_reputation,
        }));
        const topAsc = (repAscRes.data || []).map((r: any) => ({
            rank: r.rank_asc, userId: r.user_id, name: r.user_name || '名もなき旅人', value: r.total_reputation,
        }));


        // --- Alignment Ranking (Fetches from cache, aggregates on-demand if stale) ---
        let alignAggregatedAt = alignCacheRes.data?.[0]?.aggregated_at || null;
        let alignStatus = 'ready';

        const lastAlignAggregation = alignAggregatedAt ? new Date(alignAggregatedAt).getTime() : 0;
        const alignStale = !alignAggregatedAt || (now - lastAlignAggregation > FIFTEEN_MIN_MS);

        if (alignStale) {
            alignStatus = 'aggregating';
            try {
                // Get stable cycle_started_at from alignment_baseline if exists, fallback to cycleStartedAt
                const { data: baselineRow } = await supabaseService
                    .from('alignment_baseline')
                    .select('cycle_started_at')
                    .limit(1)
                    .maybeSingle();
                const stableCycleStart = baselineRow?.cycle_started_at || cycleStartedAt;

                const { error: alignErr } = await supabaseService.rpc('aggregate_alignment_ranking', {
                    p_cycle_started_at: stableCycleStart
                });
                if (!alignErr) {
                    alignStatus = 'ready';
                    alignAggregatedAt = new Date().toISOString();
                } else {
                    console.error('[Ranking] RPC aggregate_alignment_ranking failed:', alignErr);
                }
            } catch (e) {
                console.error('[Ranking] Alignment aggregation failed:', e);
            }
        }

        const alignTopRes = await supabaseService
            .from('ranking_alignment_cache')
            .select('*')
            .neq('user_id', 'c1cf67dd-527a-497e-bf88-ce10c2cb516f')
            .order('rank', { ascending: true })
            .limit(RANKING_LIMIT);


        const alignTop = (alignTopRes.data || []).map((r: any) => ({
            rank: r.rank,
            userId: r.user_id,
            name: r.user_name || '名もなき旅人',
            order: r.order_gained,
            chaos: r.chaos_gained,
            justice: r.justice_gained,
            evil: r.evil_gained,
            total: r.total_gained,
        }));

        // --- My values (always real-time) ---
        const myRepTotal = (userRepsRes.data || []).reduce((sum: number, r: any) => sum + (r.score || 0), 0);
        const myProfile = userProfileRes.data;

        // Fetch my baseline for alignment delta
        const { data: myBaseline } = await supabaseService
            .from('alignment_baseline').select('*').eq('user_id', userId).maybeSingle();

        const myAlignValues = {
            order: (myProfile?.order_pts || 0) - (myBaseline?.order_pts || 0),
            chaos: (myProfile?.chaos_pts || 0) - (myBaseline?.chaos_pts || 0),
            justice: (myProfile?.justice_pts || 0) - (myBaseline?.justice_pts || 0),
            evil: (myProfile?.evil_pts || 0) - (myBaseline?.evil_pts || 0),
            total: 0,
        };
        myAlignValues.total = myAlignValues.order + myAlignValues.chaos + myAlignValues.justice + myAlignValues.evil;

        // Inject current user's real-time values into reputation list (topDesc / topAsc)
        const injectRealtimeRep = (list: any[], order: 'desc' | 'asc') => {
            let newList = [...list];
            if (userId === 'c1cf67dd-527a-497e-bf88-ce10c2cb516f') {
                newList.forEach((entry: any, index: number) => {
                    entry.rank = index + 1;
                });
                return newList;
            }
            let me = newList.find((r: any) => r.userId === userId);
            if (me) {
                me.value = myRepTotal;
                me.name = myProfile?.name || '名もなき旅人';
            } else {
                const lastVal = newList.length > 0 ? newList[newList.length - 1].value : (order === 'desc' ? -Infinity : Infinity);
                const qualifies = order === 'desc' ? (myRepTotal >= lastVal) : (myRepTotal <= lastVal);
                if (qualifies || newList.length < RANKING_LIMIT) {
                    newList.push({
                        rank: 999,
                        userId: userId,
                        name: myProfile?.name || '名もなき旅人',
                        value: myRepTotal
                    });
                }
            }
            if (order === 'desc') {
                newList.sort((a, b) => b.value - a.value);
            } else {
                newList.sort((a, b) => a.value - b.value);
            }
            newList = newList.slice(0, RANKING_LIMIT);
            newList.forEach((entry: any, index: number) => {
                entry.rank = index + 1;
            });
            return newList;
        };

        const finalTopDesc = injectRealtimeRep(topDesc, 'desc');
        const finalTopAsc = injectRealtimeRep(topAsc, 'asc');

        // Inject current user's real-time values into alignment list (alignTop)
        let finalAlignTop = [...alignTop];
        if (userId !== 'c1cf67dd-527a-497e-bf88-ce10c2cb516f') {
            let meAlign = finalAlignTop.find((r: any) => r.userId === userId);
            if (meAlign) {
                meAlign.order = myAlignValues.order;
                meAlign.chaos = myAlignValues.chaos;
                meAlign.justice = myAlignValues.justice;
                meAlign.evil = myAlignValues.evil;
                meAlign.total = myAlignValues.total;
                meAlign.name = myProfile?.name || '名もなき旅人';
            } else {
                const lastVal = finalAlignTop.length > 0 ? finalAlignTop[finalAlignTop.length - 1].total : -Infinity;
                if (myAlignValues.total >= lastVal || finalAlignTop.length < RANKING_LIMIT) {
                    finalAlignTop.push({
                        rank: 999,
                        userId: userId,
                        name: myProfile?.name || '名もなき旅人',
                        order: myAlignValues.order,
                        chaos: myAlignValues.chaos,
                        justice: myAlignValues.justice,
                        evil: myAlignValues.evil,
                        total: myAlignValues.total
                    });
                }
            }
        }
        finalAlignTop.sort((a, b) => b.total - a.total);
        finalAlignTop = finalAlignTop.slice(0, RANKING_LIMIT);
        finalAlignTop.forEach((entry: any, index: number) => {
            entry.rank = index + 1;
        });


        return NextResponse.json({
            reputation: {
                status: repStatus,
                aggregated_at: repAggregatedAt,
                top_desc: finalTopDesc,
                top_asc: finalTopAsc,
                my_value: myRepTotal,
            },
            alignment: {
                status: alignStatus,
                aggregated_at: alignAggregatedAt,
                cycle_started_at: cycleStartedAt,
                cycle_ends_at: cycleEndsAt,
                top: finalAlignTop,
                my_values: myAlignValues,
            },
        });
    } catch (e: any) {
        console.error('[Ranking API] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

