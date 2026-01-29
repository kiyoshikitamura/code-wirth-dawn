import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

        const { data, error } = await supabase
            .from('world_history')
            .select('*')
            .order('occured_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return NextResponse.json({ history: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
