import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
    // Root path のみ処理
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // 環境変数未設定時はタイトルへ
        return NextResponse.redirect(new URL('/title', request.url));
    }

    // Cookie から Supabase のアクセストークンを取得
    // Supabase は `sb-<project-ref>-auth-token` 形式の cookie を使う
    const allCookies = request.cookies.getAll();
    const authCookie = allCookies.find(c => c.name.includes('auth-token'));

    if (!authCookie?.value) {
        return NextResponse.redirect(new URL('/title', request.url));
    }

    try {
        // Cookie の値をパースしてアクセストークンを取り出す
        let accessToken: string | null = null;
        try {
            // Supabase stores auth as JSON array: [access_token, refresh_token, ...]
            // or as base64-encoded JSON
            const parsed = JSON.parse(decodeURIComponent(authCookie.value));
            if (Array.isArray(parsed)) {
                accessToken = parsed[0]; // access_token is first element
            } else if (parsed.access_token) {
                accessToken = parsed.access_token;
            }
        } catch {
            // If not JSON, try using the value directly
            accessToken = authCookie.value;
        }

        if (!accessToken) {
            return NextResponse.redirect(new URL('/title', request.url));
        }

        // トークンの有効性を検証
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);

        if (user && !error) {
            return NextResponse.redirect(new URL('/inn', request.url));
        } else {
            return NextResponse.redirect(new URL('/title', request.url));
        }
    } catch (e) {
        console.warn('[Middleware] Auth check failed:', e);
        return NextResponse.redirect(new URL('/title', request.url));
    }
}

export const config = {
    matcher: '/'
};
