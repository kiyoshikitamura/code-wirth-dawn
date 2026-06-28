process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { checkNgWord } from '@/constants/ng_words';

/**
 * PATCH /api/character/introduction
 * ユーザーの自己紹介文を変更する。
 *
 * 制約:
 *   - 0〜30文字
 *   - NGワードフィルタ
 *
 * Body: { introduction: string }
 * Auth: Bearer token
 */
export async function PATCH(req: Request) {
    try {
        // 認証
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const { data: { user }, error: userError } = await supabaseService.auth.getUser(token);
        if (userError || !user) {
            return NextResponse.json({ error: '認証セッションが無効です' }, { status: 401 });
        }

        const userId = user.id;

        // リクエストボディ解析
        const body = await req.json();
        const rawIntro = body?.introduction;

        if (typeof rawIntro !== 'string') {
            return NextResponse.json({ error: '自己紹介を指定してください' }, { status: 400 });
        }

        const intro = rawIntro.trim();

        // 文字数制限バリデーション (最大30文字)
        if (intro.length > 30) {
            return NextResponse.json({ error: '自己紹介は30文字以内で入力してください' }, { status: 400 });
        }

        // NGワードフィルタ（空文字以外の場合のみチェック）
        if (intro.length > 0) {
            const ngResult = checkNgWord(intro);
            if (ngResult) {
                return NextResponse.json({ error: `自己紹介に不適切な表現が含まれています: ${ngResult}` }, { status: 400 });
            }
        }

        // 自己紹介を更新
        const { error: updateError } = await supabaseService
            .from('user_profiles')
            .update({
                introduction: intro,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (updateError) {
            console.error('[character/introduction] update error:', updateError);
            return NextResponse.json({ error: '自己紹介の更新に失敗しました' }, { status: 500 });
        }

        return NextResponse.json({ success: true, introduction: intro });

    } catch (e: any) {
        console.error('[character/introduction] unexpected error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
