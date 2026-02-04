import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, hasServiceKey } from '@/lib/supabase-admin';
import { getVitalityStatus } from '@/lib/character';
import { LifeCycleService } from '@/services/lifeCycleService';

// Logic to consume vitality
export async function POST(req: Request) {
    try {
        const { amount, reason } = await req.json(); // amount: number, reason: string (optional log)

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Get current profile
        // In real app, authenticate user. Here assume single user or handle via ID if passed.
        // We reuse the logic from profile/route to find the user.
        const { data: profiles } = await supabase.from('user_profiles').select('*').limit(1);
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
            .update({ vitality: newVit })
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


