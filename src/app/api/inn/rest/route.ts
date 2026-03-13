import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { ECONOMY_RULES } from '@/constants/game_rules';

export async function POST(req: Request) {
    try {
        const { id } = await req.json(); // User ID
        if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

        // Fetch Max Stats and Gold
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('max_hp, max_mp, current_location_id, gold')
            .eq('id', id)
            .single();

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        let finalCost: number = ECONOMY_RULES.INN_REST_COST_BASE;

        // Check Embargo & Calculate Cost
        if (profile.current_location_id) {
            // Get Reputation
            const { data: repData } = await supabase
                .from('reputations')
                .select('reputation_score')
                .eq('user_id', id)
                .eq('location_id', profile.current_location_id)
                .maybeSingle();

            if (repData) {
                const repScore = repData.reputation_score || 0;
                if (repScore < 0) {
                    return NextResponse.json({ error: '出禁状態: この拠点での名声が低すぎるため、宿屋の利用を断られました。' }, { status: 403 });
                }
            }

            // Get Prosperity
            const { data: locData } = await supabase
                .from('locations')
                .select('prosperity_level')
                .eq('slug', profile.current_location_id)
                .maybeSingle();

            if (locData) {
                const prosp = locData.prosperity_level || 3;
                if (prosp >= 4) finalCost = ECONOMY_RULES.INN_REST_COST_CHEAP;
                else if (prosp <= 2) finalCost = ECONOMY_RULES.INN_REST_COST_EXPENSIVE;
                else finalCost = ECONOMY_RULES.INN_REST_COST_BASE;
            }
        }

        if (profile.gold < finalCost) {
            return NextResponse.json({ error: `ゴールドが足りません。（必要な額: ${finalCost}G）` }, { status: 400 });
        }

        // Update Player HP/MP to Max & Deduct Gold
        // spec_v16 §6.2: 居脸では傭兵（NPC/残影）のHPは回复しない
        const { error } = await supabase
            .from('user_profiles')
            .update({
                hp: profile.max_hp || 100,
                mp: profile.max_mp || 50,
                gold: profile.gold - finalCost
            })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: `Rested successfully. HP/MP restored. (${finalCost}G paid)`, cost: finalCost });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
