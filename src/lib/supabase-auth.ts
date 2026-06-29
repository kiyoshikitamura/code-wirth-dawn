import { createClient } from '@supabase/supabase-js';

export function createAuthClient(req: Request) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : '';
    
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl) {
        supabaseUrl = 'https://placeholder.supabase.co';
    }

    return createClient(supabaseUrl, supabaseAnonKey || 'placeholder-key', {
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
