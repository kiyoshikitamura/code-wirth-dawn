import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, hasServiceKey } from '@/lib/supabase-admin';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const context = searchParams.get('context');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        let data;

        if (context === 'guest') {
            let npcData, npcErr;
            // Check if ID is UUID
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

            if (isUuid) {
                const { data, error } = await supabase.from('npcs').select('*').eq('id', id).maybeSingle();
                npcData = data;
                npcErr = error;
            } else {
                const { data, error } = await supabase.from('npcs').select('*').eq('slug', id).maybeSingle();
                npcData = data;
                npcErr = error;
            }

            if (npcErr) throw npcErr;

            if (npcData) {
                // Return as PartyMember compatible object
                data = {
                    id: npcData.id,
                    slug: npcData.slug,
                    name: npcData.name,
                    job_class: npcData.job_class || 'Guest',
                    level: 1,
                    hp: 50,
                    maxHp: 50,
                    mp: 10,
                    maxMp: 10,
                    attack: 10,
                    defense: 5,
                    speed: 10,
                    image: npcData.image || '/assets/chara/guest_default.png',
                    inject_cards: npcData.default_cards || [],
                    is_active: true,
                    durability: 3,
                    introduction: npcData.introduction
                };
            }
        } else {
            const { data: member, error: memberError } = await supabase
                .from('party_members')
                .select('*')
                .eq('id', id)
                .single();
            if (memberError) throw memberError;
            data = member;
        }

        if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get('id');

        if (!memberId) {
            return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
        }

        // Use Admin client to ensure deletion happens regardless of complex RLS states
        // In a real app, we should verify that `memberId` belongs to the current user (via auth.uid())
        // For this prototype, we assume the client sends a valid ID that they own.
        const client = (hasServiceKey && supabaseAdmin) ? supabaseAdmin : supabase;

        const { error } = await client
            .from('party_members')
            .delete()
            .eq('id', memberId);

        if (error) {
            console.error("Party member delete failed:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
