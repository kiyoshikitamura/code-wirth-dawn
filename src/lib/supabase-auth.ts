import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Creates a Supabase client that acts on behalf of the user who made the request.
 * It extracts the Bearer token from the Authorization header and attaches it to all Supabase requests.
 * This ensures Row Level Security (RLS) is correctly enforced at the database level.
 */
export function createAuthClient(req: Request) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : '';
    
    // [Security] x-user-id フォールバック廃止 (v27.2) — JWTのみで認証

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
        global: {
            headers: token ? {
                Authorization: `Bearer ${token}`
            } : {}
        }
    });
}
