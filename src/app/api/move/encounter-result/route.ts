import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { ECONOMY_RULES } from '@/constants/game_rules';

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
        const { encounter_type, result, target_location_id, origin_location_id } = body;

        if (!encounter_type || !result || !target_location_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // ユーザー認証
        let userId: string | null = null;
        const authHeader = req.headers.get('authorization');
        const xUserId = req.headers.get('x-user-id');

        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error || !user) {
                userId = xUserId;
            } else {
                userId = user.id;
                if (xUserId && xUserId !== userId) userId = xUserId;
            }
        } else {
            userId = xUserId;
        }

        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // プロフィール取得
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, gold, vitality, accumulated_days, age, max_hp')
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

        // DBを更新（移動完了 + ペナルティ）
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

        // 賞金稼ぎ勝利時のシェアテキスト (spec_v15.1 §3.3)
        let share_text: string | null = null;
        if (!isLose && encounter_type === 'bounty_hunter_ambush') {
            share_text = `名声が地に落ち賞金首として狙われたが、刺客を返り討ちにしてやった。 #Wirth_Dawn #悪名辟く`;
        }

        return NextResponse.json({
            success: true,
            result,
            encounter_type,
            new_location_id: isLose ? (origin_location_id || target_location_id) : target_location_id,
            penalty_applied: isLose,
            redirect_to_map: isLose, // spec_v16: 敗北時はワールドマップへ強制送還
            origin_location_id: isLose ? origin_location_id : undefined,
            share_text,
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
