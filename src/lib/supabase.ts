process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { createClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!_supabase) {
        let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
        let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

        // Vercelプレビュー環境のデータベース不整合を防ぐため、プレビュー時は強制的に開発用検証DB(drbqnpzxgcbicpritcpi)に統一
        if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
            supabaseUrl = "https://drbqnpzxgcbicpritcpi.supabase.co";
            supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYnFucHp4Z2NiaWNwcml0Y3BpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjgyOTIsImV4cCI6MjA5NTI0NDI5Mn0.VYWf3YZz9g-Niqv1GP1dXpfZI5qYS1veyVFG94qGkuE";
        }

        _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
    get(target, prop, receiver) {
        const client = getSupabaseClient();
        return Reflect.get(client, prop, receiver);
    }
});
