import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { target_location_id, user_id } = body;

        if (!target_location_id || !user_id) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Use Admin Client
        const client = supabase;

        // 1. Update Profile Location
        const { error: profileError } = await client
            .from('user_profiles')
            .update({ current_location_id: target_location_id })
            .eq('id', user_id);

        if (profileError) {
            console.error("Profile update failed:", profileError);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        // 2. Clear Hub State
        const { error: hubError } = await client
            .from('user_hub_states')
            .upsert({ user_id: user_id, is_in_hub: false });

        if (hubError) {
            console.error("Hub update failed:", hubError);
            return NextResponse.json({ error: hubError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
