import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { QuestService } from '@/services/questService';

export async function GET(req: Request) {
    try {
        // 1. Fetch User Profile to get Current Location
        // Note: Real implementation should use Auth Session, but assuming single-user/mock env for now or first user
        // We need userId. For now, fetch the first user or 'default' logic if auth not strictly enforced yet.
        // The original code fetched limit 1 user.

        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, current_location_id')
            .limit(1);

        if (!profiles || profiles.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userId = profiles[0].id;
        const locationId = profiles[0].current_location_id;

        if (!locationId) {
            return NextResponse.json({ error: 'User location not set' }, { status: 400 });
        }

        // 2. Use QuestService
        const quests = await QuestService.fetchAvailableQuests(userId, locationId);

        // 3. Map to Frontend Friendly Response (if needed, or send raw DB type)
        // InnPage expects: id, title, description, client_name, reward_gold, impacts object
        // v3 scenarios have 'rewards': { gold: ... }. We need to map this back to flat structure for compatibility 
        // OR update frontend. Updating frontend is better, but let's provide a backward-compatible shape for now + new fields.

        const mappedQuests = quests.map(q => {
            const r = q.rewards || {};

            // Map impact objects if V3 uses them
            // V3: rewards.world_impact = { target_loc, attribute, value }
            // Legacy: impacts: { order: number... }
            // We should infer impacts from world_impact or alignment_shift

            let order_impact = 0;
            let chaos_impact = 0;
            let justice_impact = 0;
            let evil_impact = 0;

            if (r.alignment_shift) {
                order_impact += r.alignment_shift.order || 0;
                chaos_impact += r.alignment_shift.chaos || 0;
                justice_impact += r.alignment_shift.justice || 0;
                evil_impact += r.alignment_shift.evil || 0;
            }

            // Also check 'rewards.world_impact' if we want to show it

            return {
                ...q,
                reward_gold: r.gold || 0, // Map from JSONB
                impacts: {
                    order: order_impact,
                    chaos: chaos_impact,
                    justice: justice_impact,
                    evil: evil_impact
                },
                // Pass raw conditions/rewards for advanced UI
                conditions: q.conditions,
                rewards: q.rewards,
                flow_nodes: q.flow_nodes
            };
        });

        return NextResponse.json(mappedQuests);
    } catch (err: any) {
        console.error("Quest API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
