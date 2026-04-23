import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';
import { ShadowService } from '@/services/shadowService';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const location_id = searchParams.get('location_id');
        const user_id = searchParams.get('user_id'); // Caller's ID to exclude self

        if (!location_id || !user_id) {
            return NextResponse.json({ error: 'Missing location_id or user_id' }, { status: 400 });
        }

        // v2.9.3e: service role client に変更（RLS問題の回避）
        const shadowService = new ShadowService(supabaseServer);
        const shadows = await shadowService.findShadowsAtLocation(location_id, user_id);

        return NextResponse.json({ shadows });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
