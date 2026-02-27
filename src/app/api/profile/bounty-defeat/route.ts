import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { headers } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const h = headers();
        const fallbackUserId = h.get('x-user-id');
        let userId = fallbackUserId;

        // Try getting user from auth session if fallback is not provided or to verify
        if (!userId) {
            const supabase = createRouteHandlerClient({ cookies });
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                userId = session.user.id;
            }
        }

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

        // 3. Update profile
        const { error: updateErr } = await supabaseAdmin
            .from('user_profiles')
            .update({ gold: newGold })
            .eq('id', userId);

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
