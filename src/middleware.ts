import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cache structure for maintenance settings
interface MaintenanceSettings {
    force_maintenance: boolean;
    start_at: string | null;
    end_at: string | null;
    admin_bypass_key?: string;
}

let cachedSettings: MaintenanceSettings | null = null;
let lastFetchedTime = 0;
const CACHE_TTL_MS = 15000; // Cache maintenance settings for 15 seconds
const DB_TIMEOUT_MS = 1200; // Timeout database query after 1.2 seconds to prevent middleware timeout

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

    const now = Date.now();
    let settings = cachedSettings;

    if (!cachedSettings || now - lastFetchedTime > CACHE_TTL_MS) {
        try {
            const supabase = createClient(supabaseUrl, supabaseAnonKey, {
                auth: { persistSession: false, autoRefreshToken: false }
            });
            
            // system_settings から設定を取得 (Promise.race でタイムアウト処理)
            const fetchPromise = supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'maintenance')
                .maybeSingle();

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Database query timed out')), DB_TIMEOUT_MS)
            );

            const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
            const fetched = result?.data?.value as MaintenanceSettings | null;

            if (fetched) {
                cachedSettings = fetched;
                settings = fetched;
                lastFetchedTime = now;
            }
        } catch (e) {
            console.warn('[Middleware] Maintenance setting check failed, using cached settings or default:', e);
            // 一時的な接続エラーの場合、頻繁なDB接続試行を避けるためにキャッシュ寿命を短くリセット（3秒後に再試行）
            lastFetchedTime = now - CACHE_TTL_MS + 3000;
        }
    }

    if (settings) {
        const nowDate = new Date();
        const startAt = settings.start_at ? new Date(settings.start_at) : null;
        endAt = settings.end_at;
        const endDate = settings.end_at ? new Date(settings.end_at) : null;
        bypassKey = settings.admin_bypass_key || null;

        const inScheduledRange = startAt && endDate && nowDate >= startAt && nowDate <= endDate;
        isMaintenanceActive = settings.force_maintenance === true || !!inScheduledRange;
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

    // きたむ様 (c1cf67dd-527a-497e-bf88-ce10c2cb516f) をメンテナンス通過許可（ホワイトリスト）に追加
    if (!hasBypass) {
        const allCookies = request.cookies.getAll();
        const authCookies = allCookies
            .filter(c => c.name.includes('auth-token'))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (authCookies.length > 0) {
            try {
                const rawCookieValue = authCookies.map(c => c.value).join('');
                let accessToken: string | null = null;
                let rawVal = decodeURIComponent(rawCookieValue);

                // Supabase SSR が書き込むクッキー値は Base64 エンコードされた JSON の可能性がある
                if (!rawVal.startsWith('[') && !rawVal.startsWith('{')) {
                    try {
                        let base64 = rawVal.replace(/-/g, '+').replace(/_/g, '/');
                        while (base64.length % 4) {
                            base64 += '=';
                        }
                        const decoded = atob(base64);
                        if (decoded.startsWith('[') || decoded.startsWith('{')) {
                            rawVal = decoded;
                        }
                    } catch {
                        // デコードに失敗した場合は生の値をそのまま使用する
                    }
                }

                if (rawVal.startsWith('[') || rawVal.startsWith('{')) {
                    const parsed = JSON.parse(rawVal);
                    if (Array.isArray(parsed)) {
                        accessToken = parsed[0];
                    } else if (parsed.access_token) {
                        accessToken = parsed.access_token;
                    }
                } else {
                    accessToken = rawVal;
                }

                if (accessToken) {
                    const parts = accessToken.split('.');
                    if (parts.length === 3) {
                        const base64Url = parts[1];
                        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                        while (base64.length % 4) {
                            base64 += '=';
                        }
                        const jsonPayload = atob(base64);
                        const payload = JSON.parse(jsonPayload);
                        const userId = payload.sub;
                        
                        if (userId === 'c1cf67dd-527a-497e-bf88-ce10c2cb516f') {
                            hasBypass = true;
                            console.log(`[Middleware] Maintenance bypass granted for user: ${userId}`);
                        }
                    }
                }
            } catch (e) {
                // デコードエラーは静かにスルー
            }
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
        const authCookies = allCookies
            .filter(c => c.name.includes('auth-token'))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (authCookies.length === 0) {
            return NextResponse.redirect(new URL('/title', request.url));
        }

        try {
            const rawCookieValue = authCookies.map(c => c.value).join('');
            let accessToken: string | null = null;
            let rawVal = decodeURIComponent(rawCookieValue);

            // Supabase SSR が書き込むクッキー値は Base64 エンコードされた JSON の可能性がある
            if (!rawVal.startsWith('[') && !rawVal.startsWith('{')) {
                try {
                    let base64 = rawVal.replace(/-/g, '+').replace(/_/g, '/');
                    while (base64.length % 4) {
                        base64 += '=';
                    }
                    const decoded = atob(base64);
                    if (decoded.startsWith('[') || decoded.startsWith('{')) {
                        rawVal = decoded;
                    }
                } catch {
                    // デコードに失敗した場合は生の値をそのまま使用する
                }
            }

            if (rawVal.startsWith('[') || rawVal.startsWith('{')) {
                const parsed = JSON.parse(rawVal);
                if (Array.isArray(parsed)) {
                    accessToken = parsed[0];
                } else if (parsed.access_token) {
                    accessToken = parsed.access_token;
                }
            } else {
                accessToken = rawVal;
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
