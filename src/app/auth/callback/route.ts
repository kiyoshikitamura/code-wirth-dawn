import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Google OAuth コールバックハンドラー
 * Supabase が `redirectTo` で指定したこの URL にリダイレクトしてくる。
 * URL に含まれる `code` を使ってセッションを確立し、タイトル画面へ戻る。
 *
 * フロー:
 *   Google OAuth → Supabase → /auth/callback?code=xxx → /title
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // エラーがある場合はタイトルへ（エラー詳細をクエリで渡す）
    if (error) {
        console.error('[auth/callback] OAuth error:', error, searchParams.get('error_description'));
        return NextResponse.redirect(`${origin}/title?auth_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
        return NextResponse.redirect(`${origin}/title`);
    }

    try {
        // supabase-js v2 の PKCE フロー: exchangeCodeForSession を使ってコードをセッションに変換
        // クライアントサイドでも exchangeCodeForSession を呼べるよう、
        // このルートはリダイレクトのみ行い、実際の交換はクライアント側で実施する方式を採用。
        // セキュリティのため、code をそのまま /title に渡してクライアント側で処理させる。
        return NextResponse.redirect(
            `${origin}/title?code=${encodeURIComponent(code)}`
        );
    } catch (e: any) {
        console.error('[auth/callback] Error:', e.message);
        return NextResponse.redirect(`${origin}/title?auth_error=callback_failed`);
    }
}
