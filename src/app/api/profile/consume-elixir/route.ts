import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseService } from '@/lib/supabase-service';

export async function POST(req: Request) {
    try {
        let userId: string | null = null;
        const authHeader = req.headers.get('authorization');
        const xUserId = req.headers.get('x-user-id');

        // Auth extraction
        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }
        if (!userId && xUserId) userId = xUserId;
        if (!userId) return NextResponse.json({ error: "Authentication failed" }, { status: 401 });

        // Get user profile to check current vitality
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
        if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        // Check if user owns the elixir
        const { data: invItems, error: invError } = await supabaseService
            .from('inventory')
            .select('*, items(*)')
            .eq('user_id', userId)
            // Slug should be fetched, but we can also just fetch items then filter
            .limit(500);

        if (invError) throw invError;

        const elixir = invItems?.find((i: any) => i.items?.slug === 'item_elixir_forbidden');
        if (!elixir || elixir.quantity <= 0) {
            return NextResponse.json({ error: "持っていません" }, { status: 400 });
        }

        if (profile.vitality >= 100) {
            return NextResponse.json({ error: "寿命は既に最大です" }, { status: 400 });
        }

        // Consume item
        if (elixir.quantity > 1) {
            await supabaseService.from('inventory').update({ quantity: elixir.quantity - 1 }).eq('id', elixir.id);
        } else {
            await supabaseService.from('inventory').delete().eq('id', elixir.id);
        }

        // Increase vitality safely
        const newVitality = Math.min(100, (profile.vitality || 0) + 1);
        await supabaseService.from('user_profiles').update({ vitality: newVitality }).eq('id', userId);

        return NextResponse.json({ success: true, new_vitality: newVitality });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
