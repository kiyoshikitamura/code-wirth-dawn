import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-admin';
import { QuestService } from '@/services/questService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        // Base authentication (Moved up to validate requirements)
        let userId: string | null = null;
        let locationId: string | null = null;
        
        const authHeader = req.headers.get('authorization');
        
        // [Security] JWT認証のみ — x-user-id フォールバックを廃止 (v27.1)
        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }
        
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Case 1: Fetch Specific Scenario by ID (for QuestPage)
        if (id) {
            const { data: quest, error } = await supabaseServer
                .from('scenarios')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !quest) {
                console.log("Scenario API: Quest not found for id", id);
                return NextResponse.json({ scenarios: [] });
            }

            // --- SECURITY VALIDATION ---
            // debug_bypass: 開発環境では true で有効、本番では ADMIN_SECRET_KEY 一致時のみ有効
            const debugParam = searchParams.get('debug_bypass');
            const debugBypass = debugParam === 'true'
                ? process.env.NODE_ENV === 'development'
                : debugParam === process.env.ADMIN_SECRET_KEY && !!process.env.ADMIN_SECRET_KEY;
            if (!debugBypass) {
                const validation = await QuestService.validateRequirements(supabaseServer, userId, quest.requirements);
                if (!validation.valid) {
                    console.warn(`[Security] User ${userId} blocked from scenario ${id}: ${validation.reason}`);
                    return NextResponse.json({ error: 'Quest prerequisites not met: ' + validation.reason }, { status: 403 });
                }
            } else {
                console.log(`[Debug] Bypassing requirement validation for scenario ${id} (admin bypass)`);
            }
            // ---------------------------

            console.log(`Scenario API: Fetching ID ${id}`);
            console.log(`Scenario API: Keys found:`, Object.keys(quest));
            console.log(`Scenario API: script_data type:`, typeof quest.script_data);
            if (quest.script_data) {
                console.log(`Scenario API: script_data keys:`, Object.keys(quest.script_data));
                if (quest.script_data.nodes) {
                    console.log(`Scenario API: node count:`, Object.keys(quest.script_data.nodes).length);
                }
            } else {
                console.log("Scenario API: script_data is falsy");
            }

            // Map columns if needed
            const mapped = {
                ...quest,
                reward_gold: quest.rewards?.gold || 0,
                impacts: quest.impact, // Map impact -> impacts
            };

            return NextResponse.json({ scenarios: [mapped] });
        }

        // Case 2: Fetch Available Quests by Location
        const { data: profile } = await supabaseServer
            .from('user_profiles')
            .select('current_location_id')
            .eq('id', userId)
            .single();
            
        if (profile) locationId = profile.current_location_id;

        if (!locationId) {
            return NextResponse.json({ error: 'User location not set' }, { status: 400 });
        }

        // v27.1: location_id ベースの直接クエリ（fetchAvailableQuests を廃止）
        const { data: quests, error: qErr } = await supabaseServer
            .from('scenarios')
            .select('*')
            .eq('location_id', locationId);

        if (qErr) {
            console.error("Scenario fetch error:", qErr);
            return NextResponse.json({ error: qErr.message }, { status: 500 });
        }

        const mappedQuests = (quests || []).map((q: any) => {
            const r = q.rewards || {};
            return {
                ...q,
                reward_gold: r.gold || 0,
                impacts: {
                    order: r.alignment_shift?.order || 0,
                    chaos: r.alignment_shift?.chaos || 0,
                    justice: r.alignment_shift?.justice || 0,
                    evil: r.alignment_shift?.evil || 0,
                },
                conditions: q.conditions,
                rewards: q.rewards,
                flow_nodes: q.flow_nodes
            };
        });

        return NextResponse.json({ scenarios: mappedQuests });
    } catch (err: any) {
        console.error("Quest API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
