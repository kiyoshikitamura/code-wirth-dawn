process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!_supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

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
