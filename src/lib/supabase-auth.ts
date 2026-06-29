import { createClient } from '@supabase/supabase-js';

export function createAuthClient(req: Request) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : '';
    
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Vercelプレビュー環境のデータベース不整合を防ぐため、プレビュー時は強制的に開発用検証DB(drbqnpzxgcbicpritcpi)に統一
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
        supabaseUrl = "https://drbqnpzxgcbicpritcpi.supabase.co";
        supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYnFucHp4Z2NiaWNwcml0Y3BpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjgyOTIsImV4cCI6MjA5NTI0NDI5Mn0.VYWf3YZz9g-Niqv1GP1dXpfZI5qYS1veyVFG94qGkuE";
    }

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
