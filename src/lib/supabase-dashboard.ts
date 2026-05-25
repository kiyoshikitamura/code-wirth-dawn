/**
 * ダッシュボード専用の Supabase クライアント
 * 
 * DASHBOARD_SUPABASE_URL / DASHBOARD_SUPABASE_SERVICE_ROLE_KEY が設定されている場合、
 * 常に本番 Supabase に接続する。未設定の場合はデフォルトの接続先にフォールバック。
 * 
 * これにより、開発環境（ローカル・Preview Deploy）からでも本番データを分析できる。
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const dashboardUrl = process.env.DASHBOARD_SUPABASE_URL
    || process.env.NEXT_PUBLIC_SUPABASE_URL
    || '';

const dashboardKey = process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || '';

export const supabaseDashboard: SupabaseClient | null =
    (dashboardUrl && dashboardKey)
        ? createClient(dashboardUrl, dashboardKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })
        : null;

/**
 * ダッシュボードが本番DBに接続しているかどうかを返す
 */
export const isDashboardProduction = !!process.env.DASHBOARD_SUPABASE_URL;
