process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase-admin';
import { supabase as supabaseClient } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { target_location_id } = body;

        if (!target_location_id) {
            return NextResponse.json({ error: 'Missing target_location_id' }, { status: 400 });
        }

        // JWT認証 (v27.0: user_id をボディから受け取らず、トークンから取得)
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader === 'Bearer ') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }
        const userId = user.id;

        // Use Admin Client
        const client = supabase;

        // 1. Update Profile Location
        const { error: profileError } = await client
            .from('user_profiles')
            .update({ current_location_id: target_location_id })
            .eq('id', userId);

        if (profileError) {
            console.error("Profile update failed:", profileError);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        // 2. Clear Hub State
        const { error: hubError } = await client
            .from('user_hub_states')
            .upsert({ user_id: userId, is_in_hub: false });

        if (hubError) {
            console.error("Hub update failed:", hubError);
            return NextResponse.json({ error: hubError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
