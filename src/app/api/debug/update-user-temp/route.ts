process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (process.env.VERCEL_ENV === 'production') {
        return NextResponse.json(
            { error: 'Debug routes are not available in production' },
            { status: 403 }
        );
    }

    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const userId = 'af2848d0-40f2-4f75-bd2b-ac633184107c';

    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!serviceKey) {
        return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    // Update level to 20, attack to 500, defense to 500, atk to 500, def to 500
    const { data, error } = await supabase
        .from('user_profiles')
        .update({
            level: 20,
            attack: 500,
            defense: 500,
            atk: 500,
            def: 500
        })
        .eq('id', userId)
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
        return NextResponse.json({ error: `User ${userId} not found` }, { status: 404 });
    }

    return NextResponse.json({
        success: true,
        updated_profile: data[0]
    });
}
