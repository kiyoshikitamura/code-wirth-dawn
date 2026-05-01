import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';

export async function GET() {
    try {
        const { data, error } = await supabaseService.from('npcs').select('id, slug, name, job_class').order('id', { ascending: true });
        if (error) throw error;
        return NextResponse.json({ npcs: data || [] });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId, npcId } = await req.json();
        if (!userId || !npcId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        const { data: npc } = await supabaseService.from('npcs').select('*').eq('id', npcId).single();
        if (!npc) return NextResponse.json({ error: 'NPC not found' }, { status: 404 });

        const maxDurability = npc.max_hp || 100;
        
        const { error } = await supabaseService.from('party_members').insert({
            id: crypto.randomUUID(),
            owner_id: userId,
            npc_id: npc.id,
            durability: maxDurability,
            max_durability: maxDurability,
            status: 'active',
            joined_at: new Date().toISOString()
        });
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
