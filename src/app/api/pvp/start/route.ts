process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { setQuestLock } from '@/lib/questLock';

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

        // 挑戦者プロフィール取得
        const { data: profile, error: uError } = await supabaseServer
            .from('user_profiles')
            .select('id, current_quest_id')
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

        // クエストロックを設定。PVPアリーナを示すID 'pvp_arena' を設定する
        const pvpQuestId = `pvp_arena_${opponent_id}`;
        await setQuestLock(userId, pvpQuestId);

        return NextResponse.json({
            success: true,
            quest_id: pvpQuestId,
            message: '対人戦（PVP）を開始しました。'
        });

    } catch (err: any) {
        console.error('[PvP Start] API Error:', err);
        return NextResponse.json({ error: err.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
