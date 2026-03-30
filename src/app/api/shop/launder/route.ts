import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { ECONOMY_RULES } from '@/constants/game_rules';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shop/launder
 * 名声ロンダリング（身分洗浄）— 崩壊拠点限定のゴールドシンク (spec_v16 §6.1)
 * LAUNDERING_COST (100,000G) を消費して、全拠点の名声を 0 にリセットする。
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // ユーザー認証
        let userId: string | null = null;
        const authHeader = req.headers.get('authorization');
        const xUserId = body.user_id || req.headers.get('x-user-id');

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
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, gold, current_location_id')
            .eq('id', userId)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // 現在地が崩壊拠点かチェック
        if (!profile.current_location_id) {
            return NextResponse.json({
                error: '闇市は崩壊した拠点にのみ存在します。',
                error_code: 'NOT_IN_RUINED_LOCATION'
            }, { status: 403 });
        }

        // world_states で拠点の status を確認
        const { data: locData } = await supabase
            .from('locations')
            .select('name')
            .eq('id', profile.current_location_id)
            .single();

        if (!locData) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 });
        }

        const { data: wsData } = await supabase
            .from('world_states')
            .select('status, prosperity_level')
            .eq('location_name', locData.name)
            .maybeSingle();

        const isRuined = wsData?.status === 'Ruined' || wsData?.prosperity_level === 1;
        if (!isRuined) {
            return NextResponse.json({
                error: `「${locData.name}」は崩壊状態ではありません。闇市はもっと荒廃した場所にあります。`,
                error_code: 'NOT_IN_RUINED_LOCATION'
            }, { status: 403 });
        }

        // ゴールド確認
        const currentGold = profile.gold || 0;
        if (currentGold < ECONOMY_RULES.LAUNDERING_COST) {
            return NextResponse.json({
                error: `帳簿の改竄には${ECONOMY_RULES.LAUNDERING_COST.toLocaleString()}Gが必要です。`,
                error_code: 'INSUFFICIENT_FUNDS',
                required: ECONOMY_RULES.LAUNDERING_COST,
                current: currentGold
            }, { status: 400 });
        }

        // ゴールドを消費
        const { error: goldError } = await supabaseService
            .rpc('increment_gold', { p_user_id: userId, p_amount: -ECONOMY_RULES.LAUNDERING_COST });

        if (goldError) throw goldError;

        // 全拠点の名声を 0 にリセット
        const { error: repError } = await supabaseService
            .from('reputations')
            .update({ score: 0 })
            .eq('user_id', userId);

        if (repError) throw repError;

        console.log(`[Launder] User ${userId} laundered reputation for ${ECONOMY_RULES.LAUNDERING_COST}G`);

        return NextResponse.json({
            success: true,
            gold_spent: ECONOMY_RULES.LAUNDERING_COST,
            new_gold: currentGold - ECONOMY_RULES.LAUNDERING_COST,
            message: '帳簿が書き換えられた。今この瞬間から、あなたはどこにでもいる無名の旅人だ。'
        });

    } catch (e: any) {
        console.error('[Launder] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
