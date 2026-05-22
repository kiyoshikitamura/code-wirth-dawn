/**
 * sessionCache.ts — C3: モーダルデータのセッション内キャッシュ
 *
 * モーダル（図鑑・クエストログ等）で毎回APIを呼ばないためのメモリキャッシュ。
 * ページリロードでクリアされる（localStorage不使用でセキュリティ安全）。
 * デフォルト有効期限: 5分
 */

interface CacheEntry<T> {
    data: T;
    fetchedAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

/** キャッシュ有効期限（ミリ秒）。デフォルト5分 */
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * キャッシュからデータを取得。期限切れの場合はnullを返す。
 */
export function getSessionCache<T>(key: string, ttl = DEFAULT_TTL): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > ttl) {
        cache.delete(key);
        return null;
    }
    return entry.data as T;
}

/**
 * キャッシュにデータを保存
 */
export function setSessionCache<T>(key: string, data: T): void {
    cache.set(key, { data, fetchedAt: Date.now() });
}

/**
 * 特定キーのキャッシュを無効化
 */
export function invalidateSessionCache(key: string): void {
    cache.delete(key);
}

/**
 * 全キャッシュをクリア
 */
export function clearAllSessionCache(): void {
    cache.clear();
}
