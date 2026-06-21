import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { ECONOMY_RULES } from '@/constants/game_rules';
import { buildShareData } from '@/lib/shareUtils';
import { processAging } from '@/services/questService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/move/encounter-result
 * 移動中エンカウントバトル終了後に呼び出す。
 * 勝敗問わず目的地への移動を完了させ、敗北時はペナルティを適用する。
 *
 * Body:
 *   - encounter_type: 'bounty_hunter_ambush' | 'random_encounter'
 *   - result: 'win' | 'lose'
 *   - target_location_id: 移動先のlocation UUID
 *   - origin_location_id: 出発地のlocation UUID
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { encounter_type, result, target_location_id, origin_location_id, travel_days } = body;

        if (!encounter_type || !result || !target_location_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // ユーザー認証 (JWT認証のみ - v27.0)
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader === 'Bearer ') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }
        const userId = user.id;

        // プロフィール取得
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, gold, vitality, age_days, accumulated_days, age, max_hp, max_vitality, atk, def')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const updatePayload: Record<string, any> = {
            current_location_id: target_location_id // 勝敗問わず目的地に移動
        };

        let penaltyMessage = '';

        if (result === 'lose') {
            if (encounter_type === 'bounty_hunter_ambush') {
                // §1.2 賞金稼ぎ敗北: ゴールド50%没収 + VIT -1
                const currentGold = profile.gold || 0;
                const goldLost = Math.floor(currentGold * ECONOMY_RULES.BOUNTY_PENALTY_RATE);
                updatePayload.gold = currentGold - goldLost;
                const currentVitality = profile.vitality || 0;
                updatePayload.vitality = Math.max(0, currentVitality - 1);
                penaltyMessage = `賞金稼ぎに敗れた…${goldLost}Gを奪われた。（VIT -1）`;
                console.log(`[EncounterResult] Bounty hunter defeat: ${goldLost}G forfeited, VIT -1 for user ${userId}`);
            } else if (encounter_type === 'random_encounter') {
                // §1.1 通常エンカウント敗北: VIT -1
                const currentVitality = profile.vitality || 0;
                updatePayload.vitality = Math.max(0, currentVitality - ECONOMY_RULES.ENCOUNTER_VITALITY_LOSS);
                penaltyMessage = `傷を負いながら出発地へ引き返された。（VIT -${ECONOMY_RULES.ENCOUNTER_VITALITY_LOSS}）`;
                console.log(`[EncounterResult] Random encounter defeat: VIT -${ECONOMY_RULES.ENCOUNTER_VITALITY_LOSS} for user ${userId}`);
            }
            // spec_v16 §1.1/1.2: 敗北時は出発地へ強制送還 + HP全回復（VIT減少がペナルティ代わり）
            updatePayload.current_location_id = origin_location_id;
            updatePayload.hp = profile.max_hp || 100;
        }

        // Blessing消費: 戦闘後にblessing_dataをクリア（spec_v16 §4: 次バトルで消費）
        updatePayload.blessing_data = null;

        // v27.0: 移動日数消費 + 加齢処理（敗北して出発地に引き返す際も、経過日数として適用される）
        const daysToTravel = travel_days || 1;
        const { newAge, newAgeDays, decay } = processAging(
            profile.age || 20,
            profile.age_days || 0,
            daysToTravel
        );
        updatePayload.accumulated_days = (profile.accumulated_days || 0) + daysToTravel;
        updatePayload.age_days = newAgeDays;
        updatePayload.age = newAge;
        if (decay.vit > 0) {
            const maxVit = updatePayload.max_vitality ?? (profile.max_vitality || 100);
            updatePayload.max_vitality = Math.max(0, maxVit - decay.vit);
            const curVit = updatePayload.vitality ?? (profile.vitality ?? 100);
            updatePayload.vitality = Math.min(curVit, updatePayload.max_vitality);
        }
        if (decay.atk > 0) updatePayload.atk = Math.max(1, (profile.atk || 1) - decay.atk);
        if (decay.def > 0) updatePayload.def = Math.max(1, (profile.def || 1) - decay.def);

        // DBを更新（移動完了 + ペナルティ + Blessing消費）
        const { error: updateError } = await supabaseService
            .from('user_profiles')
            .update(updatePayload)
            .eq('id', userId);

        if (updateError) throw updateError;

        // Hub state をクリア
        await supabaseService
            .from('user_hub_states')
            .upsert({ user_id: userId, is_in_hub: false });

        const isLose = result === 'lose';
        const successMessage = !isLose
            ? '戦いに勝利し、目的地へと到達した。'
            : penaltyMessage;

        // #6 賞金稼ぎ勝利時のシェア (繰返、CSV駆動)
        let share_text: string | null = null;
        let share_data: any = null;
        if (!isLose && encounter_type === 'bounty_hunter_ambush') {
            share_data = buildShareData('bounty_hunter_win', {});
            share_text = share_data?.text || null;
        }

        return NextResponse.json({
            success: true,
            result,
            encounter_type,
            new_location_id: isLose ? (origin_location_id || target_location_id) : target_location_id,
            penalty_applied: isLose,
            redirect_to_map: isLose,
            origin_location_id: isLose ? origin_location_id : undefined,
            share_text,
            share_data_list: share_data ? [share_data] : [],
            message: successMessage,
            updates: {
                gold: updatePayload.gold,
                vitality: updatePayload.vitality
            }
        });

    } catch (e: any) {
        console.error('[EncounterResult] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
