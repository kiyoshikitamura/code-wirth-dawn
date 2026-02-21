import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Generic endpoint to update transient user status
export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Expect keys like { hp, mp, gold, exp }
        // We only update what is provided.

        // 1. Dynamic User Identification
        const { data: { user } } = await supabase.auth.getUser();
        let userId = user?.id || body.profileId;

        if (!userId) {
            const { data: latest } = await supabase.from('user_profiles').select('id').order('updated_at', { ascending: false }).limit(1).maybeSingle();
            userId = latest?.id;
        }

        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updates: any = {};
        if (typeof body.hp === 'number') updates.hp = body.hp;
        if (typeof body.mp === 'number') updates.mp = body.mp;
        if (typeof body.gold === 'number') updates.gold = body.gold;
        if (typeof body.exp === 'number') updates.exp = body.exp;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ success: true, message: 'No updates provided' });
        }

        updates.updated_at = new Date().toISOString();

        const { error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true, updates });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
