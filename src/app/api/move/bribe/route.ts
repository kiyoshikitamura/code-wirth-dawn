process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { ECONOMY_RULES } from '@/constants/game_rules';
import { processAging } from '@/services/questService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/move/bribe
 * 許可証なしで首都へ賄賂を使って強行突破する。
 * 名声が0未満の場合のみ利用可能。
 *
 * Body:
 *   - target_location_id: 首都のlocation UUID
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { target_location_id } = body;

        if (!target_location_id) {
            return NextResponse.json({ error: 'target_location_id is required' }, { status: 400 });
        }

        // ユーザー認証 (JWT認証のみ - v27.0)
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader === 'Bearer ') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const authToken = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }
        const userId = user.id;

        // プロフィールと現在地取得
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, gold, current_location_id, age, age_days, accumulated_days, max_vitality, vitality, atk, def')
            .eq('id', userId)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // 現在地の名声チェック（名声 < 0 のみ賄賂可能）
        if (profile.current_location_id) {
            const { data: locData } = await supabase.from('locations').select('name').eq('id', profile.current_location_id).maybeSingle();
            if (locData?.name) {
                const { data: repData } = await supabase
                    .from('reputations')
                    .select('score')
                    .eq('user_id', userId)
                    .eq('location_name', locData.name)
                    .maybeSingle();

                const repScore = repData?.score || 0;
                if (repScore >= 0) {
                    return NextResponse.json({
                        error: '賄賂は悪名高き者だけが使える手段です。',
                        error_code: 'BRIBE_NOT_AVAILABLE'
                    }, { status: 403 });
                }
            }
        }

        // ゴールド確認
        const currentGold = profile.gold || 0;
        if (currentGold < ECONOMY_RULES.BRIBE_COST) {
            return NextResponse.json({
                error: `賄賂に必要なゴールドが足りません。（必要: ${ECONOMY_RULES.BRIBE_COST}G）`,
                error_code: 'INSUFFICIENT_FUNDS',
                required: ECONOMY_RULES.BRIBE_COST,
                current: currentGold
            }, { status: 400 });
        }

        // v27.0: 移動日数消費 + 加齢処理（首都は固定1日）
        const daysToTravel = 1;
        const { newAge, newAgeDays, decay } = processAging(
            profile.age || 20,
            profile.age_days || 0,
            daysToTravel
        );

        // 賄賂実施: ゴールド消費 + 移動 + 日数消費 + 加齢
        const updatePayload: Record<string, any> = {
            gold: currentGold - ECONOMY_RULES.BRIBE_COST,
            current_location_id: target_location_id,
            accumulated_days: (profile.accumulated_days || 0) + daysToTravel,
            age_days: newAgeDays,
            age: newAge,
        };
        if (decay.vit > 0) {
            updatePayload.max_vitality = Math.max(0, (profile.max_vitality || 100) - decay.vit);
            updatePayload.vitality = Math.min(profile.vitality ?? 100, updatePayload.max_vitality);
        }
        if (decay.atk > 0) updatePayload.atk = Math.max(1, (profile.atk || 1) - decay.atk);
        if (decay.def > 0) updatePayload.def = Math.max(1, (profile.def || 1) - decay.def);

        const { error: updateError } = await supabaseService
            .from('user_profiles')
            .update(updatePayload)
            .eq('id', userId);

        if (updateError) throw updateError;

        // Hub state をクリア
        await supabaseService
            .from('user_hub_states')
            .upsert({ user_id: userId, is_in_hub: false });

        console.log(`[Bribe] User ${userId} bribed their way into location ${target_location_id} for ${ECONOMY_RULES.BRIBE_COST}G`);

        return NextResponse.json({
            success: true,
            gold_spent: ECONOMY_RULES.BRIBE_COST,
            new_gold: currentGold - ECONOMY_RULES.BRIBE_COST,
            new_location_id: target_location_id,
            message: `衛兵の目を盗み、${ECONOMY_RULES.BRIBE_COST}Gを握らせて強引に門を通り抜けた。`
        });

    } catch (e: any) {
        console.error('[Bribe] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
