import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';
import { supabase as anonSupabase } from '@/lib/supabase';

// Batch update party member durability (HP) after battle
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { members } = body; // [{ id: string, durability: number }]

        if (!members || !Array.isArray(members) || members.length === 0) {
            return NextResponse.json({ success: true, message: 'No members to update' });
        }

        // Auth check
        let userId: string | null = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await anonSupabase.auth.getUser(token);
            if (user) userId = user.id;
        }

        const errors: string[] = [];
        for (const m of members) {
            if (!m.id || m.durability == null) continue;
            const { error } = await supabaseServer
                .from('party_members')
                .update({ durability: Math.max(0, m.durability) })
                .eq('id', m.id);
            if (error) errors.push(`${m.id}: ${error.message}`);
        }

        if (errors.length > 0) {
            console.error('[party/update-hp] Errors:', errors);
        }

        return NextResponse.json({ success: true, updated: members.length, errors });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
