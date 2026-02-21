import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { QuestService } from '@/services/questService';

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

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        // Case 1: Fetch Specific Scenario by ID (for QuestPage)
        if (id) {
            const { data: quest, error } = await supabase
                .from('scenarios')
                .select('*') // Select all including script_data
                .eq('id', id)
                .single();

            if (error || !quest) {
                console.log("Scenario API: Quest not found for id", id);
                return NextResponse.json({ scenarios: [] });
            }

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

        // Case 2: Fetch Available Quests (Legacy/Location based)
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

        return NextResponse.json({ scenarios: mappedQuests });
    } catch (err: any) {
        console.error("Quest API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
