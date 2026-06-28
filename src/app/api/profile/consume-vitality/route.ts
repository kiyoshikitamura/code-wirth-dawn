process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createAuthClient } from '@/lib/supabase-auth';
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
        const authClient = createAuthClient(req);
        const { data: { user } } = await authClient.auth.getUser();
        let query = supabase.from('user_profiles').select('*');

        // Priority: 1. Auth ID, 2. Body ID
        const targetId = user?.id || profileId;

        if (!targetId) {
            console.warn('[POST /api/profile/consume-vitality] No targetId found: 401');
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        query = query.eq('id', targetId);

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

            const client = createAuthClient(req);
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


