import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { ECONOMY_RULES } from '@/constants/game_rules';
import { processAging } from '@/services/questService';

export async function POST(req: Request) {
    try {
        const { id, effectiveMaxHp } = await req.json(); // User ID
        if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

        // Fetch Max Stats and Gold
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('max_hp, current_location_id, gold, age, accumulated_days, max_vitality, vitality, atk, def')
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

        // 加齢処理: 宿屋休息は1日経過
        const REST_DAYS = 1;
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
                .select('id, durability, max_durability, is_active, slug, name')
                .eq('owner_id', id);

            if (partyMembers && partyMembers.length > 0) {
                // Fetch npcs to get accurate max_hp
                const memberSlugs = partyMembers.map(m => m.slug).filter(Boolean);
                const memberNames = partyMembers.filter(m => !m.slug).map(m => m.name).filter(Boolean);
                
                const npcMap = new Map<string, any>();
                if (memberSlugs.length > 0) {
                    const { data: npcsBySlug } = await supabaseService.from('npcs').select('slug, max_hp').in('slug', memberSlugs);
                    if (npcsBySlug) npcsBySlug.forEach(n => npcMap.set(`slug:${n.slug}`, n));
                }
                if (memberNames.length > 0) {
                    const { data: npcsByName } = await supabaseService.from('npcs').select('name, max_hp').in('name', memberNames);
                    if (npcsByName) npcsByName.forEach(n => npcMap.set(`name:${n.name}`, n));
                }

                for (const member of partyMembers) {
                    const npc = member.slug ? npcMap.get(`slug:${member.slug}`) : npcMap.get(`name:${member.name}`);
                    const rawMaxDur = member.max_durability;
                    const npcHp = npc?.max_hp ?? null;
                    const resolvedMaxHp = (rawMaxDur && rawMaxDur !== 100) ? rawMaxDur : (npcHp ?? rawMaxDur ?? 100);
                    
                    const updates: any = { durability: resolvedMaxHp, max_durability: resolvedMaxHp, is_active: true };
                    
                    if (member.durability !== resolvedMaxHp || !member.is_active || member.max_durability !== resolvedMaxHp) {
                        await supabaseService
                            .from('party_members')
                            .update(updates)
                            .eq('id', member.id);
                        partyHealed++;
                    }
                }
            }
        } catch (partyErr) {
            console.warn('[Inn Rest] Failed to heal party members:', partyErr);
            // パーティ回復失敗は致命的でないので続行
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
