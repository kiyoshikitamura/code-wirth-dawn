import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { checkNgWord } from '@/constants/ng_words';

const NAME_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 1週間

/**
 * PATCH /api/character/name
 * ユーザー名を変更する。
 *
 * 制約:
 *   - 1〜16文字
 *   - NGワードフィルタ
 *   - 週1回まで変更可能
 *
 * Body: { name: string }
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
        const rawName = body?.name;

        if (typeof rawName !== 'string') {
            return NextResponse.json({ error: '名前を指定してください' }, { status: 400 });
        }

        const name = rawName.trim();

        // バリデーション（長さ + NGワード）
        const ngResult = checkNgWord(name);
        if (ngResult) {
            return NextResponse.json({ error: ngResult }, { status: 400 });
        }

        // 週1回制限チェック
        const { data: profile, error: profileError } = await supabaseService
            .from('user_profiles')
            .select('last_name_change')
            .eq('id', userId)
            .maybeSingle();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 });
        }

        if (profile.last_name_change) {
            const lastChange = new Date(profile.last_name_change).getTime();
            const now = Date.now();
            if (now - lastChange < NAME_CHANGE_COOLDOWN_MS) {
                const nextAvailable = new Date(lastChange + NAME_CHANGE_COOLDOWN_MS);
                const formatted = nextAvailable.toLocaleDateString('ja-JP', {
                    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                return NextResponse.json({
                    error: `名前の変更は週1回までです。次回変更可能: ${formatted}`
                }, { status: 429 });
            }
        }

        // 名前を更新
        const { error: updateError } = await supabaseService
            .from('user_profiles')
            .update({
                name: name,
                last_name_change: new Date().toISOString(),
            })
            .eq('id', userId);

        if (updateError) {
            console.error('[character/name] update error:', updateError);
            return NextResponse.json({ error: '名前の更新に失敗しました' }, { status: 500 });
        }

        return NextResponse.json({ success: true, name });

    } catch (e: any) {
        console.error('[character/name] unexpected error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
