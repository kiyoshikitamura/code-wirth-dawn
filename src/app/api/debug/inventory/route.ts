import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';

export async function GET() {
    try {
        const [itemsRes, skillsRes] = await Promise.all([
            supabaseService.from('items').select('id, name, slug, type, sub_type').order('id', { ascending: true }),
            supabaseService.from('skills').select('id, name, slug').order('id', { ascending: true })
        ]);

        return NextResponse.json({
            items: itemsRes.data || [],
            skills: skillsRes.data || []
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId, type, id } = await req.json();
        if (!userId || !type || !id) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        if (type === 'item') {
            const { error } = await supabaseService.from('inventory').insert({
                user_id: userId,
                item_id: id,
                quantity: 1,
                is_equipped: false,
                is_skill: false,
                acquired_at: new Date().toISOString()
            });
            if (error) throw error;
        } else if (type === 'skill') {
            const { error } = await supabaseService.from('user_skills').insert({
                user_id: userId,
                skill_id: id,
                is_equipped: false,
                acquired_at: new Date().toISOString()
            });
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
