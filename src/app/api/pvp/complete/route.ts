process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function getRatingChanges(myRank: string, oppRank: string, isVictory: boolean): { attackerChange: number; defenderChange: number } {
    const rankWeights: Record<string, number> = { 'S': 4, 'A': 3, 'B': 2, 'C': 1 };
    const myWeight = rankWeights[myRank] || 1;
    const oppWeight = rankWeights[oppRank] || 1;

    let attackerChange = 0;
    let defenderChange = 0;

    if (myWeight < oppWeight) {
        // 格上相手
        if (isVictory) {
            attackerChange = Math.floor(Math.random() * (50 - 30 + 1)) + 30; // +30〜50
            defenderChange = -(Math.floor(Math.random() * (50 - 30 + 1)) + 30); // 相手は格下に負けたので -30〜50
        } else {
            attackerChange = -(Math.floor(Math.random() * (10 - 1 + 1)) + 1); // -1〜10
            defenderChange = Math.floor(Math.random() * (10 - 1 + 1)) + 1; // 相手は格上に勝ったので +1〜10
        }
    } else if (myWeight === oppWeight) {
        // 同格
        if (isVictory) {
            attackerChange = Math.floor(Math.random() * (25 - 10 + 1)) + 10; // +10〜25
            defenderChange = -(Math.floor(Math.random() * (25 - 10 + 1)) + 10); // -10〜25
        } else {
            attackerChange = -(Math.floor(Math.random() * (25 - 10 + 1)) + 10); // -10〜25
            defenderChange = Math.floor(Math.random() * (25 - 10 + 1)) + 10; // +10〜25
        }
    } else {
        // 格下相手
        if (isVictory) {
            attackerChange = Math.floor(Math.random() * (10 - 1 + 1)) + 1; // +1〜10
            defenderChange = -(Math.floor(Math.random() * (10 - 1 + 1)) + 1); // -1〜10
        } else {
            attackerChange = -(Math.floor(Math.random() * (50 - 30 + 1)) + 30); // -30〜50
            defenderChange = Math.floor(Math.random() * (50 - 30 + 1)) + 30; // 相手は格上に勝ったので +30〜50
        }
    }

    return { attackerChange, defenderChange };
}

export async function POST(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const userId = user.id;
        const { is_victory, opponent_id, opponent_name, text_log, battle_logs, my_rank, opponent_rank } = await req.json();

        let textLogStr = '';
        if (text_log) {
            textLogStr = text_log;
        } else if (Array.isArray(battle_logs)) {
            textLogStr = battle_logs.join('\n');
        }

        if (is_victory === undefined || !opponent_id) {
            return NextResponse.json({ error: 'パラメータが不足しています。' }, { status: 400 });
        }

        // 1. 自分自身のプロフィール情報（現在レート）の取得
        const { data: myProfile, error: myError } = await supabaseServer
            .from('user_profiles')
            .select('arena_rate')
            .eq('id', userId)
            .single();

        if (myError || !myProfile) {
            return NextResponse.json({ error: '自身のプロフィールが見つかりません。' }, { status: 404 });
        }

        // 2. 対戦相手のアリーナレートの取得（ゴーストでなければ）
        let oppRate = 1000;
        const isGhost = opponent_id.startsWith('ghost_');
        if (!isGhost) {
            const { data: oppProfile } = await supabaseServer
                .from('user_profiles')
                .select('arena_rate')
                .eq('id', opponent_id)
                .maybeSingle();
            if (oppProfile) {
                oppRate = oppProfile.arena_rate ?? 1000;
            }
        }

        // 3. 自分と相手のランク比較によるレート増減値の決定
        const { attackerChange, defenderChange } = getRatingChanges(
            my_rank || 'C',
            opponent_rank || 'C',
            is_victory
        );

        const newMyRate = Math.max(1000, (myProfile.arena_rate ?? 1000) + attackerChange);
        const newOppRate = Math.max(1000, oppRate + defenderChange);

        // 4. 自分自身のレートを DB 更新（およびクエスト進行中ロックの解除）
        const { error: myUpdateError } = await supabaseServer
            .from('user_profiles')
            .update({
                arena_rate: newMyRate,
                current_quest_id: null
            })
            .eq('id', userId);

        if (myUpdateError) {
            console.error('[PvP Complete] Attacker rate update failed:', myUpdateError);
            return NextResponse.json({ error: 'アリーナレートの更新に失敗しました。' }, { status: 500 });
        }

        // 5. ゴーストではない対戦相手（防衛側）のレートを DB 更新 (アトミックに加算)
        if (!isGhost) {
            await supabaseServer
                .from('user_profiles')
                .update({
                    arena_rate: newOppRate
                })
                .eq('id', opponent_id);
        }

        // 6. バトルログの書き込み
        try {
            // 攻撃側ログ
            await supabaseServer
                .from('pvp_battle_logs')
                .insert({
                    attacker_user_id: userId,
                    defender_user_id: isGhost ? '00000000-0000-0000-0000-000000000000' : opponent_id,
                    is_attacker_victory: is_victory,
                    attacker_rate_change: attackerChange,
                    defender_rate_change: defenderChange,
                    battle_type: 'challenge',
                    text_log: textLogStr || ''
                });

            console.log('[PvP Complete] Battle log inserted successfully.');
        } catch (err) {
            console.error('[PvP Complete] Log insert error:', err);
        }

        return NextResponse.json({
            success: true,
            is_victory,
            new_rating: newMyRate,
            rating_change: attackerChange,
            opponent_rating_change: defenderChange
        });

    } catch (err: any) {
        console.error('[PvP Complete] API Error:', err);
        return NextResponse.json({ error: err.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
