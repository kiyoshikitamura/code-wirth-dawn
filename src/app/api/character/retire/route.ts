import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, hasServiceKey } from '@/lib/supabase-admin';
import { LifeCycleService } from '@/services/lifeCycleService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { cause, heirloom_item_id, heirloom_item_ids, paid_gold_for_slots } = body; // v10.1: 'dead' | 'voluntary', heirloom selection

        // Authentication & Profile Fetch (Active Profile)
        const { data: profiles, error: fetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);

        if (fetchError || !profiles || profiles.length === 0) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }
        const profile = profiles[0];

        if (!profile.is_alive) {
            return NextResponse.json({ error: 'Character is already dead/retired' }, { status: 400 });
        }

        const client = (hasServiceKey && supabaseAdmin) ? supabaseAdmin : supabase;

        // Paid Heritage Slots Rule (v7.1 / v10.1)
        if (paid_gold_for_slots && typeof paid_gold_for_slots === 'number' && paid_gold_for_slots > 0) {
            if (profile.gold < paid_gold_for_slots) {
                return NextResponse.json({ error: 'Not enough gold to purchase premium inheritance slots' }, { status: 400 });
            }
            // Deduct gold immediately before snapshot
            await client.from('user_profiles').update({ gold: profile.gold - paid_gold_for_slots }).eq('id', profile.id);
        }

        // Handle arrays backwards compatible
        let finalHeirlooms = heirloom_item_ids || [];
        if (heirloom_item_id && finalHeirlooms.length === 0) finalHeirlooms.push(heirloom_item_id);

        // Delegate to LifeCycleService
        const lifeSync = new LifeCycleService(client);

        // Use 'voluntary' if passed, otherwise default logic in service
        const deathCause = cause === 'voluntary' ? 'Voluntary Retirement' : (cause || 'Unknown');

        const result = await lifeSync.handleCharacterDeath(profile.id, deathCause);

        if (!result.success) {
            throw new Error(result.error || 'Retirement failed');
        }

        return NextResponse.json({
            success: true,
            message: 'Character retired successfully.',
            heirloom_item_id: finalHeirlooms[0] || null, // fallback for older clients
            heirloom_item_ids: finalHeirlooms,
        });

    } catch (e: any) {
        console.error("Retire Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
