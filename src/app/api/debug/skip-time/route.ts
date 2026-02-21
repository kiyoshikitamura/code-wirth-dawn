
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        // 1. Get current user (mock session for now, or just get from request body if passed)
        // But debug tools usually rely on client context. Here we assume single player or simple auth.
        // Let's get the most recent profile updated? Or rely on client side to refresh.
        // The client calls this `await fetch('/api/debug/skip-time', { method: 'POST' });`
        // It doesn't pass userId. So we need to act globally or infer.

        // World State Update
        // Increment days passed for all active world states? Or just the main one?
        // Let's update all locations' world states.

        // Fetch all world states
        const { data: states, error } = await supabase.from('world_states').select('*');
        if (error) throw error;

        if (states) {
            for (const state of states) {
                await supabase
                    .from('world_states')
                    .update({
                        total_days_passed: (state.total_days_passed || 0) + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', state.id);
            }
        }

        // Also update User Profiles age/days?
        // Since we don't know which user, maybe skip for now?
        // Or update ALL users? (It's a debug tool for single dev environment usually)
        // Let's update all users for consistency in this environment.

        const { data: users } = await supabase.from('user_profiles').select('id, age, age_days, accumulated_days, vitality, max_vitality');
        if (users) {
            for (const u of users) {
                const newAgeDays = (u.age_days || 0) + 1;
                const newAccumulated = (u.accumulated_days || 0) + 1;
                let newAge = u.age;
                let finalAgeDays = newAgeDays;

                if (newAgeDays >= 365) {
                    newAge += 1;
                    finalAgeDays = 0;
                }

                await supabase
                    .from('user_profiles')
                    .update({
                        age: newAge,
                        age_days: finalAgeDays,
                        accumulated_days: newAccumulated,
                        vitality: Math.min(u.max_vitality, u.vitality + 10) // Recover some vitality
                    })
                    .eq('id', u.id);
            }
        }

        return NextResponse.json({ success: true, message: 'Time skipped by 1 day.' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
