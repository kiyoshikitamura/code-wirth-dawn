
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Vercelプレビュー環境のデータベース不整合を防ぐため、プレビュー時は強制的に開発用検証DB(drbqnpzxgcbicpritcpi)に統一
if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
    supabaseUrl = "https://drbqnpzxgcbicpritcpi.supabase.co";
}

// Check if key is available
const isAdminEnabled = !!supabaseServiceKey;

export const supabaseAdmin = isAdminEnabled
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

export const hasServiceKey = isAdminEnabled;

// Non-nullable server client (for API routes that require admin access)
// Replaces supabase-server.ts
// Fallback to anon key in preview if service key is not configured in Vercel settings
export const supabaseServer = createClient(
    supabaseUrl,
    supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
