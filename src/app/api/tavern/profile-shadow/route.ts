process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';
import { ShadowService } from '@/services/shadowService';

export const dynamic = 'force-dynamic';

// DB負荷削減のためのシンプルなインメモリキャッシュ
interface CacheEntry {
    shadow: any;
    expiresAt: number;
}
const shadowCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3分間キャッシュ

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get('user_id'); // Target user's profile ID

        if (!user_id) {
            return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
        }

        // 1. インメモリキャッシュをチェック
        const now = Date.now();
        const cached = shadowCache.get(user_id);
        if (cached && cached.expiresAt > now) {
            return NextResponse.json(
                { shadow: cached.shadow },
                {
                    headers: {
                        'Cache-Control': 'public, max-age=180, s-maxage=180, stale-while-revalidate=60',
                        'X-Cache': 'HIT'
                    }
                }
            );
        }

        // 2. キャッシュが無い場合のみDBからクエリ
        const shadowService = new ShadowService(supabaseServer);
        const shadow = await shadowService.getShadowByUserId(user_id);

        if (!shadow) {
            return NextResponse.json({ error: 'Shadow data not found' }, { status: 404 });
        }

        // 3. インメモリキャッシュに保存
        shadowCache.set(user_id, {
            shadow,
            expiresAt: now + CACHE_TTL_MS
        });

        // 4. VercelのCDNエッジキャッシュ(Cache-Control)ヘッダー付きでレスポンス返却
        return NextResponse.json(
            { shadow },
            {
                headers: {
                    'Cache-Control': 'public, max-age=180, s-maxage=180, stale-while-revalidate=60',
                    'X-Cache': 'MISS'
                }
            }
        );

    } catch (e: any) {
        console.error(`[tavern/profile-shadow] Error:`, e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
