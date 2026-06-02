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
            supabaseService.from('ranking_reputation_cache').select('*').order('rank_desc', { ascending: true }).limit(1),
            supabaseService.from('ranking_alignment_cache').select('*').order('rank', { ascending: true }).limit(1),
            supabaseService.from('world_states').select('updated_at').limit(1).maybeSingle(),
            supabaseService.from('user_profiles').select('id, name, order_pts, chaos_pts, justice_pts, evil_pts').eq('id', userId).single(),
            supabaseService.from('reputations').select('score').eq('user_id', userId),
        ]);

        const now = Date.now();
        const worldUpdatedAt = worldStateRes.data?.updated_at ? new Date(worldStateRes.data.updated_at).getTime() : now;
        const cycleStartedAt = new Date(worldUpdatedAt).toISOString();
        const cycleEndsAt = new Date(worldUpdatedAt + SIX_HOURS_MS).toISOString();

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

        // --- Reputation Ranking ---
        const lastRepAggregation = repCacheRes.data?.[0]?.aggregated_at;
        const repStale = !lastRepAggregation || (now - new Date(lastRepAggregation).getTime() > SIX_HOURS_MS);

        let repStatus: 'ready' | 'aggregating' = 'ready';
        let repAggregatedAt = lastRepAggregation || null;

        if (repStale) {
            repStatus = 'aggregating';
            try {
                await aggregateReputationRanking();
                repStatus = 'ready';
                repAggregatedAt = new Date().toISOString();
            } catch (e) {
                console.error('[Ranking] Reputation aggregation failed:', e);
            }
        }

        // Fetch ranked data
        const [repDescRes, repAscRes] = await Promise.all([
            supabaseService.from('ranking_reputation_cache').select('*').order('rank_desc', { ascending: true }).limit(RANKING_LIMIT),
            supabaseService.from('ranking_reputation_cache').select('*').order('rank_asc', { ascending: true }).limit(RANKING_LIMIT),
        ]);

        const topDesc = (repDescRes.data || []).map((r: any) => ({
            rank: r.rank_desc, userId: r.user_id, name: r.user_name || '名もなき旅人', value: r.total_reputation,
        }));
        const topAsc = (repAscRes.data || []).map((r: any) => ({
            rank: r.rank_asc, userId: r.user_id, name: r.user_name || '名もなき旅人', value: r.total_reputation,
        }));

        // --- Alignment Ranking ---
        const lastAlignAggregation = alignCacheRes.data?.[0]?.aggregated_at;
        const alignStale = !lastAlignAggregation || (now - new Date(lastAlignAggregation).getTime() > FIFTEEN_MIN_MS);

        let alignStatus: 'ready' | 'aggregating' = 'ready';
        let alignAggregatedAt = lastAlignAggregation || null;

        if (alignStale) {
            alignStatus = 'aggregating';
            try {
                await aggregateAlignmentRanking(cycleStartedAt);
                alignStatus = 'ready';
                alignAggregatedAt = new Date().toISOString();
            } catch (e) {
                console.error('[Ranking] Alignment aggregation failed:', e);
            }
        }

        const alignTopRes = await supabaseService
            .from('ranking_alignment_cache')
            .select('*')
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

        // Inject current user's real-time values into reputation list (topDesc / topAsc)
        const injectRealtimeRep = (list: any[], order: 'desc' | 'asc') => {
            let newList = [...list];
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

// --- Aggregation Functions ---

async function aggregateReputationRanking() {
    // Lock: set aggregated_at immediately to prevent duplicate aggregation
    const lockTime = new Date().toISOString();

    // Fetch all users' total reputation
    const { data: allReps } = await supabaseService
        .from('reputations')
        .select('user_id, score');

    if (!allReps || allReps.length === 0) return;

    // Sum per user
    const userTotals: Record<string, number> = {};
    for (const r of allReps) {
        userTotals[r.user_id] = (userTotals[r.user_id] || 0) + (r.score || 0);
    }

    // Fetch user names
    const userIds = Object.keys(userTotals);
    const { data: profiles } = await supabaseService
        .from('user_profiles')
        .select('id, name')
        .in('id', userIds);

    const nameMap: Record<string, string> = {};
    for (const p of (profiles || [])) {
        nameMap[p.id] = p.name || '名もなき旅人';
    }

    // Sort desc and asc
    const entries = userIds.map(uid => ({ user_id: uid, total: userTotals[uid], name: nameMap[uid] || '名もなき旅人' }));
    const sortedDesc = [...entries].sort((a, b) => b.total - a.total);
    const sortedAsc = [...entries].sort((a, b) => a.total - b.total);

    // Build rank maps
    const rankDescMap: Record<string, number> = {};
    const rankAscMap: Record<string, number> = {};
    sortedDesc.forEach((e, i) => { rankDescMap[e.user_id] = i + 1; });
    sortedAsc.forEach((e, i) => { rankAscMap[e.user_id] = i + 1; });

    // Upsert cache
    const cacheRows = entries.map(e => ({
        user_id: e.user_id,
        user_name: e.name,
        total_reputation: e.total,
        rank_desc: rankDescMap[e.user_id],
        rank_asc: rankAscMap[e.user_id],
        aggregated_at: lockTime,
    }));

    // Clear and insert
    await supabaseService.from('ranking_reputation_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (cacheRows.length > 0) {
        await supabaseService.from('ranking_reputation_cache').insert(cacheRows);
    }
}

async function aggregateAlignmentRanking(cycleStartedAt: string) {
    const lockTime = new Date().toISOString();

    // Fetch all user profiles
    const { data: allProfiles } = await supabaseService
        .from('user_profiles')
        .select('id, name, order_pts, chaos_pts, justice_pts, evil_pts');

    if (!allProfiles || allProfiles.length === 0) return;

    // Fetch all baselines
    const { data: allBaselines } = await supabaseService
        .from('alignment_baseline')
        .select('*');

    const baselineMap: Record<string, any> = {};
    for (const b of (allBaselines || [])) {
        baselineMap[b.user_id] = b;
    }

    // Check if baselines need reset (new cycle)
    const anyBaseline = allBaselines?.[0];
    const needsBaselineReset = !anyBaseline || 
        new Date(anyBaseline.cycle_started_at).getTime() !== new Date(cycleStartedAt).getTime();

    if (needsBaselineReset) {
        // New cycle: snapshot current values as baseline
        const baselineRows = allProfiles.map((p: any) => ({
            user_id: p.id,
            order_pts: p.order_pts || 0,
            chaos_pts: p.chaos_pts || 0,
            justice_pts: p.justice_pts || 0,
            evil_pts: p.evil_pts || 0,
            cycle_started_at: cycleStartedAt,
        }));

        // Upsert baselines
        for (const row of baselineRows) {
            await supabaseService.from('alignment_baseline').upsert(row, { onConflict: 'user_id' });
            baselineMap[row.user_id] = row;
        }
    }

    // Calculate gains
    const entries = allProfiles.map((p: any) => {
        const base = baselineMap[p.id] || { order_pts: 0, chaos_pts: 0, justice_pts: 0, evil_pts: 0 };
        const order = Math.max(0, (p.order_pts || 0) - (base.order_pts || 0));
        const chaos = Math.max(0, (p.chaos_pts || 0) - (base.chaos_pts || 0));
        const justice = Math.max(0, (p.justice_pts || 0) - (base.justice_pts || 0));
        const evil = Math.max(0, (p.evil_pts || 0) - (base.evil_pts || 0));
        return {
            user_id: p.id,
            user_name: p.name || '名もなき旅人',
            order_gained: order,
            chaos_gained: chaos,
            justice_gained: justice,
            evil_gained: evil,
            total_gained: order + chaos + justice + evil,
        };
    });

    // Sort by total desc
    entries.sort((a, b) => b.total_gained - a.total_gained);

    // Build cache
    const cacheRows = entries.map((e, i) => ({
        ...e,
        rank: i + 1,
        aggregated_at: lockTime,
        cycle_started_at: cycleStartedAt,
    }));

    // Clear and insert
    await supabaseService.from('ranking_alignment_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (cacheRows.length > 0) {
        await supabaseService.from('ranking_alignment_cache').insert(cacheRows);
    }
}
