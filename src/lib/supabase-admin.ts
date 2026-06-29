
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 遅延初期化用
let _supabaseAdmin: SupabaseClient | null = null;
let _supabaseServer: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    // Vercelプレビュー環境のデータベース不整合を防ぐため、プレビュー時は強制的に開発用検証DB(drbqnpzxgcbicpritcpi)に統一
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
        supabaseUrl = "https://drbqnpzxgcbicpritcpi.supabase.co";
    }

    if (!supabaseUrl || !supabaseServiceKey) return null;

    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    return _supabaseAdmin;
}

function getSupabaseServer(): SupabaseClient {
    if (!_supabaseServer) {
        let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        // Vercelプレビュー環境のデータベース不整合を防ぐため、プレビュー時は強制的に開発用検証DB(drbqnpzxgcbicpritcpi)に統一
        if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
            supabaseUrl = "https://drbqnpzxgcbicpritcpi.supabase.co";
        }

        _supabaseServer = createClient(
            supabaseUrl || 'https://placeholder.supabase.co',
            supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );
    }
    return _supabaseServer;
}

// 既存コードに影響を与えないためのプロキシエクスポート
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get(target, prop, receiver) {
        const client = getSupabaseAdmin();
        if (!client) return undefined;
        return Reflect.get(client, prop, receiver);
    }
});

export const hasServiceKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY);

export const supabaseServer = new Proxy({} as SupabaseClient, {
    get(target, prop, receiver) {
        const client = getSupabaseServer();
        return Reflect.get(client, prop, receiver);
    }
});
