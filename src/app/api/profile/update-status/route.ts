import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';
import { supabase as anonSupabase } from '@/lib/supabase';

// Generic endpoint to update transient user status (HP, Gold, VIT, etc.)
// Uses Service Role key to bypass RLS for reliable writes.
export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Expect keys like { hp, gold, exp, vitality }
        // We only update what is provided.

        // 1. User Identification: Authorization header → body.profileId → fallback
        let userId: string | null = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await anonSupabase.auth.getUser(token);
            if (user) userId = user.id;
        }
        if (!userId) userId = body.profileId || null;

        if (!userId) {
            const { data: latest } = await supabaseServer.from('user_profiles').select('id').order('updated_at', { ascending: false }).limit(1).maybeSingle();
            userId = latest?.id || null;
        }

        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updates: any = {};
        if (typeof body.hp === 'number') updates.hp = body.hp;
        if (typeof body.vitality === 'number') updates.vitality = body.vitality;
        if (typeof body.gold === 'number') updates.gold = body.gold;
        if (typeof body.exp === 'number') updates.exp = body.exp;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ success: true, message: 'No updates provided' });
        }

        updates.updated_at = new Date().toISOString();

        const { error } = await supabaseServer
            .from('user_profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true, updates });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
