import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, hasServiceKey } from '@/lib/supabase-admin';
import { LifeCycleService } from '@/services/lifeCycleService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title_name, gender, age, gold, current_location_id, birth_date, max_hp, max_vitality, max_deck_cost } = body;

        const { user_id } = body; // Expect user_id from client

        // Use Admin client to bypass RLS for this specific initialization step
        // This is crucial for "Demo Mode" or initial setup where Auth might not be strictly 1:1
        const client = hasServiceKey && supabaseAdmin ? supabaseAdmin : supabase;

        console.log("Init Profile Body:", body);
        console.log("Init Profile Age Input:", age, typeof age);

        // Find the profile to update.
        let profileId = null;

        if (user_id) {
            const { data } = await client.from('user_profiles').select('id').eq('id', user_id).maybeSingle();
            if (data) profileId = data.id;
        } else {
            // Fallback for legacy/demo scenarios without explicit user_id
            const { data: profiles } = await client
                .from('user_profiles')
                .select('id')
                .limit(1);
            profileId = profiles?.[0]?.id;
        }

        let updates: any = {
            name: title_name, // User Input -> Name
            title_name: '名もなき旅人', // Default Title/Rank
            gender,
            age: age || 20,
            birth_date: birth_date || null, // V9.2
            accumulated_days: 0,
            // gold: gold || 1000, // Determined by processInheritance below
            vitality: max_vitality || 100, // Ensure defaults or use calculated
            max_vitality: max_vitality || 100,
            hp: max_hp || 100,
            max_hp: max_hp || 100,
            initial_hp: max_hp || 100, // Added for Spec v8.2 scaling
            max_deck_cost: max_deck_cost || 10,
            is_alive: true // Resurrect
        };

        if (current_location_id) updates.current_location_id = current_location_id;

        // Inheritance Logic
        const lifeSync = new LifeCycleService(client);

        let inheritedData = { gold: 1000, legacy_points: 0 }; // Default

        if (profileId) {
            // Apply Inheritance if profile exists (Reincarnation flow)
            const result = await lifeSync.processInheritance(profileId, { ...updates, gold: gold || 1000 });
            // result contains user data modified by inheritance logic
            if (result) {
                updates = { ...updates, ...result };
            }
        } else {
            updates.gold = 1000; // Fresh start without ID
        }

        if (!profileId) {
            // INSERT Mode
            console.log("No profile found. Creating new profile...");
            // We need a UUID. Supabase might gen it or we gen it.
            // But we need auth.uid() usually.
            // Since this is admin bypass/local mode, we can generate a random UUID or use a fixed one if auth is mocked.
            // We'll let Postgres gen it if column is default, but typically user_profiles.id is linked to auth.users.id.
            // If we insert here with random UUID, it won't match any auth user.
            // For "Demo/Local", this is fine.
            // If user_id provided, ensure we create it with that ID (linking to Auth)
            if (user_id) {
                updates.id = user_id;
            }

            const { data: newProfile, error: insertError } = await client
                .from('user_profiles')
                .insert([updates])
                .select('id')
                .single();

            if (insertError) throw insertError;
            return NextResponse.json({ success: true, id: newProfile.id });
        } else {
            // UPDATE Mode
            const { error } = await client
                .from('user_profiles')
                .update(updates)
                .eq('id', profileId);

            if (error) throw error;
            return NextResponse.json({ success: true, id: profileId });
        }

    } catch (err: any) {
        console.error("Profile Init Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
