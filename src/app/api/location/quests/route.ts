import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export const dynamic = 'force-dynamic';

// Initialize Service Role Client for this API to bypass RLS for script_data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey || '', {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});


/**
 * GET /api/location/quests
 * Returns quests separated by type (special / normal) with requirement evaluation.
 * Spec v3.1 & v3.3
 */
export async function GET(req: Request) {
    const debug: string[] = [];

    if (!supabaseServiceKey) {
        console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
        return NextResponse.json({ error: 'Server misconfiguration', debug: ['Missing Service Key'] }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const locationId = searchParams.get('locationId');

        debug.push(`userId = ${userId}, locationId = ${locationId} `);

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId', debug }, { status: 400 });
        }

        // 1. Fetch User Profile
        const { data: user, error: uError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        debug.push(`user_fetch: ${uError ? 'ERROR: ' + uError.message : 'OK, level=' + user?.level} `);

        if (uError || !user) {
            return NextResponse.json({ error: 'User not found', debug, uError: uError?.message }, { status: 404 });
        }

        // 2. Fetch World State
        const { data: worldState } = await supabase
            .from('world_states')
            .select('*')
            .maybeSingle();

        const currentProsperity = worldState?.prosperity_level || 50;
        debug.push(`prosperity = ${currentProsperity} `);

        // 3. Fetch User Inventory (for has_item checks)
        const { data: inventory } = await supabase
            .from('inventory')
            .select('item_id, quantity')
            .eq('user_id', userId);

        const ownedItemIds = new Set((inventory || []).map((i: any) => String(i.item_id)));

        // 4. Fetch User Reputations (for min_reputation checks)
        const { data: reputations } = await supabase
            .from('reputations')
            .select('location_id, reputation_score')
            .eq('user_id', userId);

        const repMap: Record<string, number> = {};
        for (const rep of (reputations || [])) {
            repMap[rep.location_id] = rep.reputation_score || 0;
        }

        // 5. Fetch Quests
        const { data: quests, error: qError } = await supabase
            .from('scenarios')
            .select('id, title, description, quest_type, requirements, conditions, rewards, rec_level, is_urgent, client_name, impact, location_id')
            .in('quest_type', ['normal', 'special'])
            .limit(100);

        debug.push(`quest_fetch: ${qError ? 'ERROR: ' + qError.message : 'OK, count=' + (quests?.length || 0)} `);

        if (qError) {
            return NextResponse.json({ error: qError.message, debug }, { status: 500 });
        }

        if (!quests || quests.length === 0) {
            debug.push('NO QUESTS FOUND - returning empty');
            return NextResponse.json({ special_quests: [], normal_quests: [], debug });
        }

        // 6. Filter Special Quests (v3.1 Requirements Evaluation)
        const specialQuests = quests.filter((q: any) => {
            if (q.quest_type !== 'special') return false;

            const reqs = q.requirements || {};

            // min_level
            if (reqs.min_level && (user.level || 1) < reqs.min_level) return false;

            // min_vitality
            if (reqs.min_vitality && (user.vitality || 0) < reqs.min_vitality) return false;

            // has_item: check if user has the item
            if (reqs.has_item && !ownedItemIds.has(String(reqs.has_item))) return false;

            // min_reputation: { "loc_id": threshold }
            if (reqs.min_reputation) {
                if (typeof reqs.min_reputation === 'object') {
                    for (const [locId, threshold] of Object.entries(reqs.min_reputation)) {
                        if ((repMap[locId] || 0) < (threshold as number)) return false;
                    }
                } else if (typeof reqs.min_reputation === 'number') {
                    // Global reputation check (sum of all)
                    const totalRep = Object.values(repMap).reduce((a, b) => a + b, 0);
                    if (totalRep < reqs.min_reputation) return false;
                }
            }

            // completed_quest: check quest completion history
            if (reqs.completed_quest) {
                // TODO: Implement quest completion history lookup
                // For now, skip this check (allow quest to appear)
            }

            // nation_id: check if quest's nation matches current location's nation
            // Allow through for now (location-based filtering not strict yet)

            // align_evil / min_align_chaos / min_align_order
            if (reqs.align_evil && !(user.evil_pts > user.justice_pts)) return false;
            if (reqs.min_align_chaos && (user.chaos_pts || 0) < reqs.min_align_chaos) return false;
            if (reqs.min_align_order && (user.order_pts || 0) < reqs.min_align_order) return false;

            // max_prosperity
            if (reqs.max_prosperity && currentProsperity > reqs.max_prosperity) return false;
            if (reqs.min_prosperity && currentProsperity < reqs.min_prosperity) return false;

            return true;
        });

        // 7. Filter Normal Quests (location + prosperity)
        const normalQuests = quests.filter((q: any) => {
            if (q.quest_type !== 'normal') return false;

            const conds = q.conditions || {};

            // Prosperity Check
            if (conds.min_prosperity && currentProsperity < conds.min_prosperity) return false;
            if (conds.max_prosperity && currentProsperity > conds.max_prosperity) return false;

            // Location tag check (if location-specific quests exist)
            if (conds.location_tags && locationId) {
                const tags = Array.isArray(conds.location_tags)
                    ? conds.location_tags
                    : String(conds.location_tags).split(',').map((t: string) => t.trim());
                if (!tags.includes('all') && !tags.includes(locationId)) return false;
            }

            return true;
        });

        debug.push(`filtered: special = ${specialQuests.length}, normal = ${normalQuests.length} `);

        // Map DB columns to expected frontend format
        const mapQuest = (q: any) => ({
            ...q,
            // Map rewards json to flat fields if needed, or frontend can handle it.
            // But QuestBoardModal expects reward_gold.
            reward_gold: q.rewards?.gold || 0,
            reward_exp: q.rewards?.exp || 0,
            impacts: q.impact, // Rename back to impacts for frontend
        });

        // 8. Randomize Normal Quests (Pick 6)
        const shuffled = normalQuests.sort(() => 0.5 - Math.random());
        const finalNormalQuests = shuffled.slice(0, 6).map(mapQuest);

        // 9. Sort Special Quests (Urgent first)
        const sortedSpecial = specialQuests.sort((a: any, b: any) =>
            (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0)
        ).map(mapQuest);

        return NextResponse.json({
            special_quests: sortedSpecial,
            normal_quests: finalNormalQuests,
            debug
        });

    } catch (e: any) {
        console.error("Quest API Error:", e);
        return NextResponse.json({ error: e.message, debug }, { status: 500 });
    }
}
