/**
 * authToken.ts — セッショントークンのメモリキャッシュ
 *
 * supabase.auth.getSession() を毎回呼ぶ代わりに、
 * トークンをメモリにキャッシュして再利用する。
 * 有効期限の60秒前にリフレッシュを行う。
 *
 * セキュリティ:
 * - JWTの有効期限はSupabaseが管理（デフォルト1時間）
 * - 期限の60秒前にリフレッシュするため、期限切れトークンは使われない
 * - サインアウト時に clearAuthTokenCache() を呼ぶこと
 */

import { supabase } from '@/lib/supabase';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let refreshPromise: Promise<string | null> | null = null;

/**
 * キャッシュ済みのアクセストークンを取得する。
 * キャッシュが有効であればネットワーク不要で即座に返す。
 * 同時呼び出し時はリフレッシュを共有（dedup）する。
 */
export async function getAuthToken(): Promise<string | null> {
    const now = Date.now();

    // キャッシュが有効（期限の60秒前まで）ならそのまま返す
    if (cachedToken && now < tokenExpiresAt - 60_000) {
        return cachedToken;
    }

    // 同時リフレッシュの重複を防ぐ
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const res = await supabase.auth.getSession();
            const session = res?.data?.session;
            if (session) {
                cachedToken = session.access_token;
                // expires_at は UNIX秒。ミリ秒に変換
                tokenExpiresAt = (session.expires_at || 0) * 1000;
                return cachedToken;
            }
            // セッションなし
            cachedToken = null;
            tokenExpiresAt = 0;
            return null;
        } catch (e) {
            console.error('[getAuthToken] getSession failed:', e);
            cachedToken = null;
            tokenExpiresAt = 0;
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

/**
 * トークンキャッシュをクリアする。
 * サインアウト時、セッション切れ検知時に呼ぶ。
 */
export function clearAuthTokenCache(): void {
    cachedToken = null;
    tokenExpiresAt = 0;
    refreshPromise = null;
}

/**
 * Authorization ヘッダーオブジェクトを返すヘルパー。
 * トークンが取得できない場合は空オブジェクト。
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
    const token = await getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}
