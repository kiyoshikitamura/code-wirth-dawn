import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { calculateCurrentCP, MAX_OVERFLOW_CP } from '@/lib/arena';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const userId = user.id;

        // 1. プロフィールとCP状態を取得
        const { data: profile, error } = await supabaseServer
            .from('user_profiles')
            .select('gold, colosseum_cp, cp_last_recovered_at')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            return NextResponse.json({ error: 'プロフィールが見つかりません。' }, { status: 404 });
        }

        const gold = profile.gold ?? 0;
        const dbCP = profile.colosseum_cp ?? 5;
        const dbLastRecoveredAt = profile.cp_last_recovered_at ?? new Date().toISOString();

        // 2. 現在のCPをオンデマンドで算出
        const { currentCP, recoveredPoints } = calculateCurrentCP(dbCP, dbLastRecoveredAt);
        let finalCP = currentCP;
        let finalLastRecoveredAt = dbLastRecoveredAt;

        if (recoveredPoints > 0) {
            const lastTime = new Date(dbLastRecoveredAt).getTime();
            const interval = 60 * 60 * 1000;
            finalLastRecoveredAt = new Date(lastTime + recoveredPoints * interval).toISOString();
        }

        // 3. 超過上限チェック (回復後のCPが 16 以上になる場合は回復不可)
        const targetCP = finalCP + 10;
        if (targetCP >= MAX_OVERFLOW_CP) {
            return NextResponse.json({ error: 'これ以上コロシアムポイント(CP)を回復できません。(回復後の上限は15です)' }, { status: 400 });
        }

        // 4. 所持ゴールドチェック
        if (gold < 5000) {
            return NextResponse.json({ error: 'ゴールドが不足しています。(5,000 G必要)' }, { status: 400 });
        }

        // 5. DBアトミック更新
        // ゴールド減算 ➔ CP加算 ➔ 自然回復タイムスタンプを現在時刻(NOW)にリセット (超過状態になるため)
        const newCP = targetCP;
        const newGold = gold - 5000;
        const newLastRecoveredAt = new Date().toISOString();

        const { error: updateError } = await supabaseServer
            .from('user_profiles')
            .update({
                gold: newGold,
                colosseum_cp: newCP,
                cp_last_recovered_at: newLastRecoveredAt
            })
            .eq('id', userId);

        if (updateError) {
            console.error('[pvp/recover-cp] DB update error:', updateError);
            return NextResponse.json({ error: '回復の適用に失敗しました。' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'コロシアムポイントを10回復しました。',
            new_cp: newCP,
            new_gold: newGold
        });
    } catch (e: any) {
        console.error('[pvp/recover-cp] API Error:', e.message);
        return NextResponse.json({ error: e.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
