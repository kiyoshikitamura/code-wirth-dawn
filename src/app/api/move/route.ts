import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { target_location_name } = await req.json();

        if (!target_location_name) {
            return NextResponse.json({ error: 'Target location is required' }, { status: 400 });
        }

        // 1. Get User Profile & Current Location
        // Note: In a real app, we'd use auth.uid(). For demo/single-user, getting the first profile or logic from store
        // We'll rely on the client knowing who they are, or just get the first one since it's single player effectively.
        // Let's get the profile '0000...' or just the first one.
        const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('*, locations:locations!fk_current_location(*)') // Join current location via explicit FK
            .limit(1);

        if (profileError || !profiles || profiles.length === 0) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }
        const profile = profiles[0];
        const currentLocation = profile.locations; // Joined data

        // 2. Get Target Location
        const { data: targetData, error: targetError } = await supabase
            .from('locations')
            .select('*')
            .eq('name', target_location_name)
            .single();

        if (targetError || !targetData) {
            return NextResponse.json({ error: 'Target location not found' }, { status: 404 });
        }

        // 3. Calculate Distance & Time
        let daysToTravel = 0;
        if (currentLocation) {
            const dx = targetData.x - currentLocation.x;
            const dy = targetData.y - currentLocation.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Rule: 100px = 5 days => 1px = 0.05 days. Min 1 day.
            daysToTravel = Math.max(1, Math.ceil(distance * 0.05));
        } else {
            // First move / No current location
            daysToTravel = 0; // Or 1 for setup
        }

        // 4. Update Time & Age
        let newTotalDays = (profile.accumulated_days || 0) + daysToTravel;
        let newAge = profile.age || 20;

        if (newTotalDays >= 365) {
            const yearsPassed = Math.floor(newTotalDays / 365);
            newAge += yearsPassed;
            newTotalDays = newTotalDays % 365;
        }

        // 5. Update DB
        // A. Update User Profile
        const { error: updateProfileError } = await supabase
            .from('user_profiles')
            .update({
                current_location_id: targetData.id,
                accumulated_days: newTotalDays,
                age: newAge
            })
            .eq('id', profile.id);

        if (updateProfileError) throw updateProfileError;

        // B. Update World State (Total Days)
        // Ensure there is a world state for the target location or update existing?
        // Let's assume there's one global timeline. Updating the "Active" world state.
        // Or update ALL world states linked to this implementation?
        // Let's update the world state associated with the TARGET location if it exists,
        // AND maybe a global counter? The user asked to update "world_states.total_days_passed".
        // Let's fetch the relevant world state first.
        const { data: wsData } = await supabase
            .from('world_states')
            .select('*')
            .eq('location_name', target_location_name)
            .maybeSingle();

        // Use existing days from WS if available, or just add travel days to current?
        // The prompt says "world_states の累計日数". It seems global.
        // Use the profile's movement to increment the global clock.
        // We need the *current* global days to increment it.
        // Let's get "start" world state for global time?
        // 94. Get global time
        // We want the most advanced time in the world to ensure continuity.
        const { data: globalState, error: maxTimeError } = await supabase
            .from('world_states')
            .select('total_days_passed')
            .order('total_days_passed', { ascending: false })
            .limit(1);

        const currentGlobalDays = globalState?.[0]?.total_days_passed || 0;
        const newGlobalDays = currentGlobalDays + daysToTravel;

        // Update target location's world state (Upsert if missing)
        const newWorldState = {
            location_name: target_location_name,
            total_days_passed: newGlobalDays
            // Might need defaults if inserting new: status, attribute...
            // handled by DB defaults usually, but upsert needs care.
        };

        // If WS exists, update. If not, insert with defaults.
        const { error: wsError } = await supabase
            .from('world_states')
            .upsert(newWorldState, { onConflict: 'location_name' } as any) // Type assertion if needed
        // Actually upsert might clear other fields if not provided? 
        // Postgres upsert with "DO UPDATE SET ..." retains others? 
        // Supabase `.upsert` replaces row if no ignoreDuplicates?
        // Safer: update if exists, insert if not.

        if (wsData) {
            await supabase.from('world_states')
                .update({ total_days_passed: newGlobalDays })
                .eq('id', wsData.id);
        } else {
            await supabase.from('world_states').insert([{
                location_name: target_location_name,
                total_days_passed: newGlobalDays,
                background_url: '/backgrounds/default.jpg' // Safe default
            }]);
        }

        // Also update the 'Start' location to keep a sort of "Global Time"?
        // For simplicity, let's just make sure the UI fetches the total_days from the CURRENT location's WS.

        return NextResponse.json({
            success: true,
            travel_days: daysToTravel,
            new_age: newAge,
            current_date: {
                total_days: newGlobalDays,
                display: `Year ${100 + Math.floor(newGlobalDays / 365)}` // Simplified
            }
        });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
