/**
 * ダッシュボード専用の Supabase クライアント
 * 
 * DASHBOARD_SUPABASE_URL / DASHBOARD_SUPABASE_SERVICE_ROLE_KEY が設定されている場合、
 * 常に本番 Supabase に接続する。未設定の場合はデフォルトの接続先にフォールバック。
 * 
 * これにより、開発環境（ローカル・Preview Deploy）からでも本番データを分析できる。
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/**
 * ダッシュボード用 Supabase クライアントを取得（遅延初期化）
 * リクエスト時に環境変数を読み取るため、モジュールキャッシュの問題を回避
 */
export function getDashboardSupabase(): SupabaseClient | null {
    if (_client) return _client;

    const url = process.env.DASHBOARD_SUPABASE_URL
        || process.env.NEXT_PUBLIC_SUPABASE_URL
        || '';

    const key = process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY
        || process.env.SUPABASE_SERVICE_ROLE_KEY
        || '';

    console.log('[Dashboard] Initializing Supabase client:', {
        url: url ? url.substring(0, 30) + '...' : '(empty)',
        keyPrefix: key ? key.substring(0, 20) + '...' : '(empty)',
        isDedicatedKey: !!process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY,
    });

    if (!url || !key) return null;

    _client = createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    return _client;
}

/**
 * ダッシュボードが本番DBに接続しているかどうかを返す
 */
export const isDashboardProduction = !!process.env.DASHBOARD_SUPABASE_URL;
