import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const { userId, amount = 1000 } = await req.json();

        if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

        // Fetch current gold
        const { data: profile, error } = await supabaseService
            .from('user_profiles')
            .select('gold')
            .eq('id', userId)
            .single();

        if (error || !profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const newGold = profile.gold + amount;

        // Update gold via service role to bypass RLS
        const { error: updateError } = await supabaseService
            .rpc('increment_gold', { p_user_id: userId, p_amount: amount });

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, new_gold: newGold });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
