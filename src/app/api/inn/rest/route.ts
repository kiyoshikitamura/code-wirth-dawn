import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { createAuthClient } from '@/lib/supabase-auth';
import { ECONOMY_RULES } from '@/constants/game_rules';
import { processAging } from '@/services/questService';
import { HUB_LOCATION_NAME } from '@/utils/constants';

export async function POST(req: Request) {
    try {
        const supabaseAuth = createAuthClient(req);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
        if (!user || authError) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { effectiveMaxHp } = await req.json();
        const id = user.id;

        // Fetch Max Stats and Gold
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('max_hp, current_location_id, gold, age, accumulated_days, max_vitality, vitality, atk, def')
            .eq('id', id)
            .single();

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        let finalCost: number = ECONOMY_RULES.INN_REST_COST_BASE;
        let isHub = false;

        // Check Embargo & Calculate Cost
        if (profile.current_location_id) {
            const { data: locData } = await supabase
                .from('locations')
                .select('name, prosperity_level')
                .eq('id', profile.current_location_id)
                .maybeSingle();

            if (locData?.name) {
                // ハブ拠点判定
                isHub = locData.name === HUB_LOCATION_NAME;

                if (!isHub) {
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
            }

            if (isHub) {
                // ハブ拠点: 固定100G
                finalCost = 100;
            } else if (locData) {
                const prosp = locData.prosperity_level || 3;
                if (prosp >= 4) finalCost = ECONOMY_RULES.INN_REST_COST_CHEAP;
                else if (prosp <= 2) finalCost = ECONOMY_RULES.INN_REST_COST_EXPENSIVE;
                else finalCost = ECONOMY_RULES.INN_REST_COST_BASE;
            }
        }

        if (profile.gold < finalCost) {
            return NextResponse.json({ error: `ゴールドが足りません。（必要な額: ${finalCost}G）` }, { status: 400 });
        }

        // 加齢処理: ハブ拠点では3日経過、通常拠点では1日経過
        const REST_DAYS = isHub ? 3 : 1;
        const { newAge, newAgeDays, decay } = processAging(
            profile.age || 20,
            profile.accumulated_days || 0,
            REST_DAYS
        );

        const updatePayload: Record<string, any> = {
            hp: effectiveMaxHp || profile.max_hp || 100,
            gold: profile.gold - finalCost,
            accumulated_days: newAgeDays,
            age: newAge
        };

        // 加齢によるステータス減少を適用
        if (decay.vit > 0 || decay.atk > 0 || decay.def > 0) {
            if (decay.vit > 0) {
                updatePayload.max_vitality = Math.max(0, (profile.max_vitality || 100) - decay.vit);
                updatePayload.vitality = Math.min(profile.vitality ?? 100, updatePayload.max_vitality);
            }
            if (decay.atk > 0) updatePayload.atk = Math.max(1, (profile.atk || 1) - decay.atk);
            if (decay.def > 0) updatePayload.def = Math.max(1, (profile.def || 1) - decay.def);
            console.log(`[Inn] Aging decay: age=${newAge}, VIT-${decay.vit}, ATK-${decay.atk}, DEF-${decay.def}`);
        }

        const { error } = await supabaseService
            .from('user_profiles')
            .update(updatePayload)
            .eq('id', id);

        if (error) throw error;

        // パーティメンバーのHP全回復（HP0のメンバーも回復）
        let partyHealed = 0;
        try {
            const { data: partyMembers } = await supabaseService
                .from('party_members')
                .select('id, is_active')
                .eq('owner_id', id);

            if (partyMembers && partyMembers.length > 0) {
                const inactiveIds = partyMembers.filter(m => !m.is_active).map(m => m.id);
                if (inactiveIds.length > 0) {
                    await supabaseService
                        .from('party_members')
                        .update({ is_active: true })
                        .in('id', inactiveIds);
                    partyHealed = inactiveIds.length;
                }
            }
        } catch (partyErr) {
            console.warn('[Inn Rest] Failed to heal party members:', partyErr);
        }

        return NextResponse.json({
            success: true,
            message: `Rested successfully. HP/MP restored. (${finalCost}G paid, 1 day passed)`,
            cost: finalCost,
            days_passed: REST_DAYS,
            new_age: newAge,
            aging_decay: (decay.vit > 0 || decay.atk > 0 || decay.def > 0) ? decay : undefined,
            party_healed: partyHealed,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
