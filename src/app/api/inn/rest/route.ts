import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { id } = await req.json(); // User ID
        if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

        // Fetch Max Stats
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('max_hp, max_mp')
            .eq('id', id)
            .single();

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        // Update to Max
        const { error } = await supabase
            .from('user_profiles')
            .update({
                hp: profile.max_hp || 100,
                mp: profile.max_mp || 50
            })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Rested successfully. HP/MP restored.' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
