import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateTitle, processAging } from '@/lib/character';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // v3.5 Fix: Target specific Demo User to avoid fetching NPCs
        const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

        let { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*, locations:locations!fk_current_location(*), reputations(*)')
            .eq('id', DEMO_USER_ID)
            .maybeSingle();

        if (!profile) {
            // Create Demo Profile with new defaults
            const demoId = '00000000-0000-0000-0000-000000000000';
            const defaultTitle = '名もなき旅人';
            const defaultAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256&h=256';

            const newProfile = {
                id: demoId,
                title_name: defaultTitle,
                avatar_url: defaultAvatar,
                order_pts: 0,
                chaos_pts: 0,
                justice_pts: 0,
                evil_pts: 0,
                gold: 1000,
                vitality: 100, // New
                level: 1, // New
                hp: 100, max_hp: 100, // New
                mp: 20, max_mp: 20, // New
                attack: 10, defense: 5,
                age: 20,
                gender: 'Unknown',
                max_vitality: 100,
                accumulated_days: 0,
                current_location_id: (await supabase.from('locations').select('id').eq('name', '名もなき旅人の拠所').single()).data?.id,
            };

            const { data: inserted, error: insertError } = await supabase
                .from('user_profiles')
                .upsert([newProfile])
                .select()
                .single();

            if (insertError) {
                console.error("Failed to create demo profile:", insertError);
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
                profile.age = age;
                profile.vitality = vitality;
                needsUpdate = true;
            }

            // 2. Dynamic Title Logic
            const newTitle = calculateTitle(profile);
            if (newTitle !== profile.title_name) {
                updates.title_name = newTitle;
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
