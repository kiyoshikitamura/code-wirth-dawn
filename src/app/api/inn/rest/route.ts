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
            .select('max_hp, current_location_id, gold')
            .eq('id', id)
            .single();

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        let finalCost: number = ECONOMY_RULES.INN_REST_COST_BASE;

        // Check Embargo & Calculate Cost
        if (profile.current_location_id) {
            const { data: locData } = await supabase
                .from('locations')
                .select('name, prosperity_level')
                .eq('id', profile.current_location_id)
                .maybeSingle();

            if (locData?.name) {
                const { data: repData } = await supabase
                    .from('reputations')
                    .select('score')
                    .eq('user_id', id)
                    .eq('location_name', locData.name)
                    .maybeSingle();

                if (repData) {
                    const repScore = repData.score || 0;
                    if (repScore < 0) {
                        return NextResponse.json({ error: '出禁状態: この拠点での名声が低すぎるため、宿屋の利用を断られました。' }, { status: 403 });
                    }
                }
            }

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

        const { error } = await supabase
            .from('user_profiles')
            .update({
                hp: profile.max_hp || 100,
                gold: profile.gold - finalCost
            })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: `Rested successfully. HP/MP restored. (${finalCost}G paid)`, cost: finalCost });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
