import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createAuthClient } from '@/lib/supabase-auth';
import { ShadowService } from '@/services/shadowService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { user_id, shadow } = body; // Hirer ID and Shadow Object

        if (!user_id || !shadow) {
            return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
        }

        // Use auth client so RLS enforces secure transaction
        const client = createAuthClient(req);

        // Fetch user profile to check location and rep
        const { data: profile } = await client.from('user_profiles').select('current_location_id').eq('id', user_id).single();
        if (profile?.current_location_id) {
            const { data: repData } = await client
                .from('reputations')
                .select('reputation_score')
                .eq('user_id', user_id)
                .eq('location_id', profile.current_location_id)
                .maybeSingle();

            if (repData && (repData.reputation_score || 0) < 0) {
                return NextResponse.json({ error: '出禁状態: この拠点での名声が低すぎるため、酒場の利用を断られました。' }, { status: 403 });
            }
        }

        const shadowService = new ShadowService(client);

        const result = await shadowService.hireShadow(user_id, shadow);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
