process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { calculateCurrentCP, MAX_NATURAL_CP } from '@/lib/arena';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const userId = user.id;
        const { opponent_id } = await req.json();

        if (!opponent_id) {
            return NextResponse.json({ error: '対戦相手が指定されていません。' }, { status: 400 });
        }

        // 1. 挑戦者プロフィール取得 (CP情報含む)
        const { data: profile, error: uError } = await supabaseServer
            .from('user_profiles')
            .select('id, current_quest_id, colosseum_cp, cp_last_recovered_at')
            .eq('id', userId)
            .single();

        if (uError || !profile) {
            return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
        }

        // すでにクエスト中の場合はエラー
        if (profile.current_quest_id) {
            return NextResponse.json({
                error: 'すでに他のクエストが進行中です。先に諦めるか完了してください。',
                current_quest_id: profile.current_quest_id
            }, { status: 409 });
        }

        // 2. CP自然回復オンデマンド計算
        const dbCP = profile.colosseum_cp ?? 5;
        const dbLastRecoveredAt = profile.cp_last_recovered_at ?? new Date().toISOString();

        const { currentCP, recoveredPoints } = calculateCurrentCP(
            dbCP,
            dbLastRecoveredAt
        );

        let finalCP = dbCP;
        let finalLastRecoveredAt = dbLastRecoveredAt;

        // 自然回復分の時間を進める (端数は持ち越し)
        if (recoveredPoints > 0) {
            finalCP = currentCP;
            const lastTime = new Date(dbLastRecoveredAt).getTime();
            const interval = 60 * 60 * 1000;
            finalLastRecoveredAt = new Date(lastTime + recoveredPoints * interval).toISOString();
        }

        // 3. CP不足チェック (CPを1消費)
        if (finalCP < 1) {
            return NextResponse.json({ error: 'コロシアムポイント(CP)が不足しています。' }, { status: 400 });
        }

        const nextCP = finalCP - 1;
        // もし元が5(上限)以上で、今回1消費して5未満になる場合は、今この瞬間から次の1時間タイマーを開始する
        if (finalCP >= MAX_NATURAL_CP && nextCP < MAX_NATURAL_CP) {
            finalLastRecoveredAt = new Date().toISOString();
        }

        // 4. DBへのCP消費書き戻し
        const { error: updateError } = await supabaseServer
            .from('user_profiles')
            .update({
                colosseum_cp: nextCP,
                cp_last_recovered_at: finalLastRecoveredAt
            })
            .eq('id', userId);

        if (updateError) {
            console.error('[PvP Start] CP update error:', updateError);
            return NextResponse.json({ error: 'コロシアムポイントの消費に失敗しました。' }, { status: 500 });
        }

        const pvpQuestId = `pvp_arena_${opponent_id}`;

        return NextResponse.json({
            success: true,
            quest_id: pvpQuestId,
            message: '対人戦（PVP）を開始しました。',
            remaining_cp: nextCP
        });

    } catch (err: any) {
        console.error('[PvP Start] API Error:', err);
        return NextResponse.json({ error: err.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
