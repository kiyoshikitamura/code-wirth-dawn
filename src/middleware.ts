import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
    const { nextUrl } = request;
    const path = nextUrl.pathname;

    // 1. 静的アセット、メディア、およびメンテナンス画面自体は常に通過させる
    if (
        path.startsWith('/_next') ||
        path.startsWith('/images') ||
        path.startsWith('/audio') ||
        path === '/favicon.ico' ||
        path === '/maintenance'
    ) {
        return NextResponse.next();
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // 環境変数未設定時はタイトルへ
        if (path !== '/title') {
            return NextResponse.redirect(new URL('/title', request.url));
        }
        return NextResponse.next();
    }

    // 2. メンテナンス設定の取得と判定
    let isMaintenanceActive = false;
    let endAt: string | null = null;
    let bypassKey: string | null = null;

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        
        // system_settings から設定を取得
        const { data } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'maintenance')
            .maybeSingle();

        const settings = data?.value as {
            force_maintenance: boolean;
            start_at: string | null;
            end_at: string | null;
            admin_bypass_key?: string;
        } | null;

        if (settings) {
            const now = new Date();
            const startAt = settings.start_at ? new Date(settings.start_at) : null;
            endAt = settings.end_at;
            const endDate = settings.end_at ? new Date(settings.end_at) : null;
            bypassKey = settings.admin_bypass_key || null;

            const inScheduledRange = startAt && endDate && now >= startAt && now <= endDate;
            isMaintenanceActive = settings.force_maintenance === true || !!inScheduledRange;
        }
    } catch (e) {
        console.warn('[Middleware] Maintenance setting check failed:', e);
        // エラー時はフォールバックしてメンテナンスを適用しない（サービス停止を防ぐ）
    }

    // 3. 管理者バイパスの判定
    let hasBypass = false;
    const queryBypass = nextUrl.searchParams.get('bypass');
    const cookieBypass = request.cookies.get('maintenance_bypass')?.value;

    if (bypassKey) {
        if (queryBypass === bypassKey || cookieBypass === bypassKey) {
            hasBypass = true;
        }
    }

    // 4. メンテナンス時の制限適用
    if (isMaintenanceActive && !hasBypass) {
        // APIリクエストの場合は JSON で 503 を返す
        if (path.startsWith('/api')) {
            return new NextResponse(
                JSON.stringify({
                    error: 'Under Maintenance',
                    message: 'ただいまシステムメンテナンス中です。',
                    end_at: endAt
                }),
                {
                    status: 503,
                    headers: { 'content-type': 'application/json; charset=utf-8' }
                }
            );
        }

        // ページリクエストの場合はメンテナンス画面へリダイレクト
        return NextResponse.redirect(new URL('/maintenance', request.url));
    }

    // 5. バイパスキーがURLクエリに含まれる場合のCookieセット処理
    if (queryBypass && queryBypass === bypassKey) {
        // クエリパラメータから bypass を取り除いたクリーンなURLを生成
        const cleanUrl = new URL(request.url);
        cleanUrl.searchParams.delete('bypass');
        
        const response = NextResponse.redirect(cleanUrl);
        response.cookies.set('maintenance_bypass', queryBypass, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1週間有効
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        return response;
    }

    // 6. 通常時の認証チェック（既存の middleware.ts のロジック）
    // Root path (/) の場合のみリダイレクト処理を行う
    if (path === '/') {
        const allCookies = request.cookies.getAll();
        const authCookie = allCookies.find(c => c.name.includes('auth-token'));

        if (!authCookie?.value) {
            return NextResponse.redirect(new URL('/title', request.url));
        }

        try {
            let accessToken: string | null = null;
            try {
                const parsed = JSON.parse(decodeURIComponent(authCookie.value));
                if (Array.isArray(parsed)) {
                    accessToken = parsed[0];
                } else if (parsed.access_token) {
                    accessToken = parsed.access_token;
                }
            } catch {
                accessToken = authCookie.value;
            }

            if (!accessToken) {
                return NextResponse.redirect(new URL('/title', request.url));
            }

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

    return NextResponse.next();
}

// すべてのパスでミドルウェアを動作させる
export const config = {
    matcher: [
        /*
         * 除外対象:
         * - _next/static (静的ファイル)
         * - _next/image (画像最適化)
         * - favicon.ico (ファビコン)
         * - images/
         * - audio/
         */
        '/((?!_next/static|_next/image|favicon.ico|images/|audio/).*)',
    ],
};
