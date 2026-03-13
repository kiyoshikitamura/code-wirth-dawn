import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { headers } from 'next/headers';
export async function POST(request: Request) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Database unconfigured' }, { status: 500 });
        }
        const h = await headers();
        const userId = h.get('x-user-id');

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get current gold
        const { data: profile, error: profileErr } = await supabaseAdmin
            .from('user_profiles')
            .select('gold')
            .eq('id', userId)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // 2. Halve gold
        const currentGold = profile.gold || 0;
        const newGold = Math.floor(currentGold / 2);

        // 3. Update profile (decrease by half)
        const amountToDeduct = currentGold - newGold;
        const { error: updateErr } = await supabaseAdmin
            .rpc('increment_gold', { p_user_id: userId, p_amount: -amountToDeduct });

        if (updateErr) {
            throw updateErr;
        }

        // 4. Log the penalty
        await supabaseAdmin.from('historical_logs').insert([{
            location_id: null,
            event_type: 'Bounty Penalty',
            description: `賞金稼ぎに敗北し、所持金を半分没収された。( -${currentGold - newGold} G )`,
            involved_users: [userId],
            tags: ['penalty', 'bounty', 'economy', 'combat_defeat']
        }]);

        return NextResponse.json({ success: true, new_gold: newGold });

    } catch (error: any) {
        console.error("Bounty Defeat Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
