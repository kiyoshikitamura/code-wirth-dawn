import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ShadowService } from '@/services/shadowService';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const location_id = searchParams.get('location_id');
        const user_id = searchParams.get('user_id'); // Caller's ID to exclude self

        if (!location_id || !user_id) {
            return NextResponse.json({ error: 'Missing location_id or user_id' }, { status: 400 });
        }

        const shadowService = new ShadowService(supabase);
        const shadows = await shadowService.findShadowsAtLocation(location_id, user_id);

        return NextResponse.json({ shadows });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
