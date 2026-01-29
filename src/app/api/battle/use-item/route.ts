import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { inventory_id } = await req.json();

        // 1. Fetch current info
        const { data: item, error: fetchError } = await supabase
            .from('inventory')
            .select('id, quantity, is_skill')
            .eq('id', inventory_id)
            .single();

        if (fetchError) throw fetchError;

        if (item.is_skill) {
            // Skills are not consumed. Just return success (frontend handles cooldown)
            return NextResponse.json({ success: true, remaining: item.quantity, note: 'Skill used' });
        }

        // 2. Decrement or Delete
        let remaining = (item.quantity || 1) - 1;

        if (remaining <= 0) {
            const { error: delError } = await supabase
                .from('inventory')
                .delete()
                .eq('id', inventory_id);

            if (delError) throw delError;
            return NextResponse.json({ success: true, remaining: 0, deleted: true });
        } else {
            const { error: updateError } = await supabase
                .from('inventory')
                .update({ quantity: remaining })
                .eq('id', inventory_id);

            if (updateError) throw updateError;
            return NextResponse.json({ success: true, remaining });
        }

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
