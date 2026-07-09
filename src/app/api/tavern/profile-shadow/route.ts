process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';
import { ShadowService } from '@/services/shadowService';
import { createAuthClient } from '@/lib/supabase-auth';

export const dynamic = 'force-dynamic';

// DB負荷削減のためのシンプルなインメモリキャッシュ
interface CacheEntry {
    shadow: any;
    expiresAt: number;
}
const shadowCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2分間キャッシュに変更 (ユーザー指示)

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get('user_id'); // Target user's profile ID

        if (!user_id) {
            return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
        }

        // 1. リクエストのJWTトークンを検証して、ログイン中の本人かどうかをチェック
        const authHeader = req.headers.get('authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '') : '';
        let callerUserId: string | null = null;
        
        if (token) {
            try {
                const client = createAuthClient(req);
                const { data: { user } } = await client.auth.getUser(token);
                if (user) {
                    callerUserId = user.id;
                }
            } catch (authErr) {
                console.warn('[tavern/profile-shadow] Token verification skipped or failed:', authErr);
            }
        }

        const isSelf = !!(callerUserId && callerUserId === user_id);

        // 2. 本人ではない場合のみインメモリキャッシュをチェック (本人の場合はバイパスして最新を取得)
        if (!isSelf) {
            const now = Date.now();
            const cached = shadowCache.get(user_id);
            if (cached && cached.expiresAt > now) {
                return NextResponse.json(
                    { shadow: cached.shadow },
                    {
                        headers: {
                            'Cache-Control': 'public, max-age=120, s-maxage=120, stale-while-revalidate=60',
                            'X-Cache': 'HIT'
                        }
                    }
                );
            }
        }

        // 3. DBからクエリ
        const shadowService = new ShadowService(supabaseServer);
        const shadow = await shadowService.getShadowByUserId(user_id);

        if (!shadow) {
            return NextResponse.json({ error: 'Shadow data not found' }, { status: 404 });
        }

        // 4. 他人のためのインメモリキャッシュに保存（最新化）
        shadowCache.set(user_id, {
            shadow,
            expiresAt: Date.now() + CACHE_TTL_MS
        });

        // 5. レスポンスヘッダーの設定
        if (isSelf) {
            // 本人の場合はブラウザやCDNでのキャッシュを完全に禁止
            return NextResponse.json(
                { shadow },
                {
                    headers: {
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                        'X-Cache': 'BYPASS-SELF'
                    }
                }
            );
        } else {
            // 他人の場合はCDNエッジキャッシュを2分間有効化
            return NextResponse.json(
                { shadow },
                {
                    headers: {
                        'Cache-Control': 'public, max-age=120, s-maxage=120, stale-while-revalidate=60',
                        'X-Cache': 'MISS'
                    }
                }
            );
        }

    } catch (e: any) {
        console.error(`[tavern/profile-shadow] Error:`, e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
