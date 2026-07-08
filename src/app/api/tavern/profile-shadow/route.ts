process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';
import { ShadowService } from '@/services/shadowService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get('user_id'); // Target user's profile ID

        if (!user_id) {
            return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
        }

        // Service Role client を用いて RLS をバイパスし、装備・スキルを安全にロード
        const shadowService = new ShadowService(supabaseServer);
        const shadow = await shadowService.getShadowByUserId(user_id);

        if (!shadow) {
            return NextResponse.json({ error: 'Shadow data not found' }, { status: 404 });
        }

        return NextResponse.json({ shadow });

    } catch (e: any) {
        console.error(`[tavern/profile-shadow] Error:`, e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
