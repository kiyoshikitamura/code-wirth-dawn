import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateTitle, processAging } from '@/lib/character';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Dynamic User Identification
        const url = new URL(req.url);
        const queryId = url.searchParams.get('profileId');

        const { data: { user } } = await supabase.auth.getUser();

        // Priority: 1. Auth ID, 2. Query ID (Explicit), 3. Fallback (Latest)
        let targetId = user?.id || queryId;

        if (!targetId) {
            // Fallback: Use the most recent profile (legacy/demo support)
            const { data: latest } = await supabase
                .from('user_profiles')
                .select('id')
                .not('name', 'is', null) // v3.6: Don't pick nameless ghosts
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            targetId = latest?.id || '00000000-0000-0000-0000-000000000000';
        }

        let { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*, locations:locations!fk_current_location(*), reputations(*)')
            .eq('id', targetId)
            .maybeSingle();

        if (!profile) {
            // Create New Profile with sane defaults if totally missing
            const defaultAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256&h=256';

            const newProfile = {
                id: targetId,
                title_name: '名もなき旅人',
                avatar_url: defaultAvatar,
                order_pts: 0,
                chaos_pts: 0,
                justice_pts: 0,
                evil_pts: 0,
                gold: 1000,
                age: null, // Don't force 20 if we don't know it
                gender: 'Unknown',
                max_vitality: 100,
                accumulated_days: 0,
                current_location_id: (await supabase.from('locations').select('id').eq('name', '名もなき旅人の拠所').maybeSingle()).data?.id,
            };

            const { data: inserted, error: insertError } = await supabase
                .from('user_profiles')
                .upsert([newProfile])
                .select()
                .single();

            if (insertError) {
                console.error("Failed to create profile:", insertError);
                profile = newProfile;
            } else {
                profile = inserted;
            }
        }

        // --- Logic: Aging & Title Update ---
        if (profile) {
            let needsUpdate = false;
            const updates: any = {};

            // 1. Aging Logic
            const { age, vitality, aged } = processAging(profile.age || 20, profile.vitality ?? 100, profile.accumulated_days || 0, profile.birth_date);
            if (aged) {
                updates.age = age;
                updates.vitality = vitality;
                updates.updated_at = new Date().toISOString(); // Manual bump
                profile.age = age;
                profile.vitality = vitality;
                needsUpdate = true;
            }

            // 2. Dynamic Title Logic
            const newTitle = calculateTitle(profile);
            if (newTitle !== profile.title_name) {
                updates.title_name = newTitle;
                updates.updated_at = new Date().toISOString(); // Manual bump
                profile.title_name = newTitle;
                needsUpdate = true;
            }

            // Apply Updates if needed
            if (needsUpdate) {
                await supabase.from('user_profiles').update(updates).eq('id', profile.id);
            }
        }
        // -----------------------------------

        return NextResponse.json(profile);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
