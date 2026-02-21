import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, hasServiceKey } from '@/lib/supabase-admin';
import { getVitalityStatus } from '@/lib/character';
import { LifeCycleService } from '@/services/lifeCycleService';

// Logic to consume vitality
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, reason, profileId } = body; // amount: number, reason: string (optional log)

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Dynamic User Identification
        // Dynamic User Identification
        const { data: { user } } = await supabase.auth.getUser();
        let query = supabase.from('user_profiles').select('*');

        // Priority: 1. Auth ID, 2. Body ID
        // Note: consume-vitality requires explicit profile target in demo mode
        const targetId = user?.id || (body as any).profileId; // body was destructured above, need to access full body or add to destructure

        if (targetId) {
            query = query.eq('id', targetId);
        } else {
            // Fallback (Legacy/Demo - Not recommended but kept for backward compat)
            query = query.order('updated_at', { ascending: false }).limit(1);
        }

        const { data: profiles } = await query;
        const profile = profiles?.[0];

        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Calculate new vitality
        const currentVit = profile.vitality ?? 100;
        const newVit = Math.max(0, currentVit - amount);
        const diff = currentVit - newVit;

        if (diff === 0 && currentVit === 0) {
            return NextResponse.json({ success: true, message: 'Vitality already 0', vitality: 0, status: 'Retired' });
        }

        // Update DB
        const { error } = await supabase
            .from('user_profiles')
            .update({ vitality: newVit, updated_at: new Date().toISOString() })
            .eq('id', profile.id);

        if (error) throw error;

        // Death Trigger
        if (newVit === 0) {
            console.log("Vitality depleted. Triggering Death Handler...");

            // Use Admin Client for death updates (Historical Logs RLS might require it if not "own" insert)
            // But usually Profile Update needs to be secure.
            const client = (hasServiceKey && supabaseAdmin) ? supabaseAdmin : supabase;
            const lifeSync = new LifeCycleService(client);

            await lifeSync.handleCharacterDeath(profile.id);

            return NextResponse.json({
                success: true,
                message: '生命力が尽き、旅は終わりを迎えた...',
                vitality: 0,
                status: 'Retired',
                is_death_event: true
            });
        }

        // Determine Status (Alive)
        const status = getVitalityStatus(newVit);
        const message = `生命力を ${diff} 消費しました。(残り: ${newVit})`;

        return NextResponse.json({
            success: true,
            message,
            vitality: newVit,
            status
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


