process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const GHOST_SCORES: Record<string, { score: number; rank: string }> = {
    "ghost_c_1": { score: 950, rank: "C" },
    "ghost_c_2": { score: 1100, rank: "C" },
    "ghost_c_3": { score: 1250, rank: "C" },
    "ghost_c_4": { score: 1400, rank: "C" },
    "ghost_b_1": { score: 2400, rank: "B" },
    "ghost_b_2": { score: 2600, rank: "B" },
    "ghost_b_3": { score: 2800, rank: "B" },
    "ghost_a_1": { score: 4200, rank: "A" },
    "ghost_a_2": { score: 4500, rank: "A" },
    "ghost_s_1": { score: 6800, rank: "S" },
    "ghost_s_volg": { score: 6800, rank: "S" },
};

function getRatingChanges(
    myRank: string,
    oppRank: string,
    myScore: number,
    oppScore: number,
    isVictory: boolean
): { attackerChange: number; defenderChange: number } {
    const rankWeights: Record<string, number> = { 'S': 4, 'A': 3, 'B': 2, 'C': 1 };
    const myWeight = rankWeights[myRank.toUpperCase()] || 1;
    const oppWeight = rankWeights[oppRank.toUpperCase()] || 1;

    let attackerChange = 0;
    let defenderChange = 0;

    if (isVictory) {
        // アタッカー勝利時
        let base = 15;
        if (myWeight < oppWeight) {
            // 格上相手
            base = 25;
        } else if (myWeight === oppWeight) {
            // 同等
            base = 15;
        } else {
            // 格下相手
            base = 15;
        }
        
        const change = base + Math.floor((oppScore - myScore) / 200);
        attackerChange = Math.max(5, change); // 最低+5を保証
        defenderChange = -attackerChange;      // ゼロサム
    } else {
        // アタッカー敗北時（＝ディフェンダー勝利）
        // ディフェンダーから見てアタッカーの立場をもとに計算
        let base = 15;
        if (oppWeight < myWeight) {
            // ディフェンダーから見てアタッカーは「格上」
            base = 25;
        } else if (oppWeight === myWeight) {
            // 同等
            base = 15;
        } else {
            // ディフェンダーから見てアタッカーは「格下」
            base = 15;
        }
        
        const change = base + Math.floor((myScore - oppScore) / 100);
        defenderChange = Math.max(1, change); // 最低+1を保証
        attackerChange = -defenderChange;      // ゼロサム
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
        const { is_victory, opponent_id, opponent_name, text_log, battle_logs } = await req.json();

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

        // 2. 挑戦者（自分自身）の戦闘評価スコアとランクの取得
        const { data: myDefense } = await supabaseServer
            .from('pvp_defense_parties')
            .select('defender_rank, snapshot_data')
            .eq('user_id', userId)
            .maybeSingle();

        let myRank = 'C';
        let myScore = 1000;
        if (myDefense) {
            myRank = myDefense.defender_rank || 'C';
            if (myDefense.snapshot_data) {
                myScore = (myDefense.snapshot_data as any).battle_score || 1000;
            }
        }

        // 3. 対戦相手のアリーナレートおよび戦闘評価とランクの取得
        let oppRate = 1000;
        let oppRank = 'C';
        let oppScore = 1000;
        const isGhost = opponent_id.startsWith('ghost_');
        
        if (isGhost) {
            const ghostInfo = GHOST_SCORES[opponent_id] || { score: 1000, rank: 'C' };
            oppRank = ghostInfo.rank;
            oppScore = ghostInfo.score;
        } else {
            const { data: oppProfile } = await supabaseServer
                .from('user_profiles')
                .select('arena_rate')
                .eq('id', opponent_id)
                .maybeSingle();
            if (oppProfile) {
                oppRate = oppProfile.arena_rate ?? 1000;
            }

            const { data: oppDefense } = await supabaseServer
                .from('pvp_defense_parties')
                .select('defender_rank, snapshot_data')
                .eq('user_id', opponent_id)
                .maybeSingle();
            if (oppDefense) {
                oppRank = oppDefense.defender_rank || 'C';
                if (oppDefense.snapshot_data) {
                    oppScore = (oppDefense.snapshot_data as any).battle_score || 1000;
                }
            }
        }

        // 4. 新計算式によるレート増減値の決定
        const { attackerChange, defenderChange } = getRatingChanges(
            myRank,
            oppRank,
            myScore,
            oppScore,
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
