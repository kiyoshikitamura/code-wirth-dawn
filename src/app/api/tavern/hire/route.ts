import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, hasServiceKey } from '@/lib/supabase-admin';
import { ShadowService } from '@/services/shadowService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { user_id, shadow } = body; // Hirer ID and Shadow Object

        if (!user_id || !shadow) {
            return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
        }

        // Use Admin client for secure transaction (Gold updates)
        const client = (hasServiceKey && supabaseAdmin) ? supabaseAdmin : supabase;
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
