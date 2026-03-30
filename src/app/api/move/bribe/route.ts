import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { ECONOMY_RULES } from '@/constants/game_rules';

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

        // プロフィールと現在地取得
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, gold, current_location_id')
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

        // 賄賂実施: ゴールド消費 + 移動
        const { error: updateError } = await supabaseService
            .from('user_profiles')
            .update({
                gold: currentGold - ECONOMY_RULES.BRIBE_COST,
                current_location_id: target_location_id
            })
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
