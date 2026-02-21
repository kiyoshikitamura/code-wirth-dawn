import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, hasServiceKey } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const owner_id = searchParams.get('owner_id');

        if (!owner_id) {
            return NextResponse.json({ error: 'Missing owner_id' }, { status: 400 });
        }

        // Use Admin client to bypass RLS on party_members table
        const client = (hasServiceKey && supabaseAdmin) ? supabaseAdmin : supabase;

        const { data, error } = await client
            .from('party_members')
            .select('*')
            .eq('owner_id', owner_id)
            .eq('is_active', true);

        if (error) {
            console.error('Party list error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ party: data || [] });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
