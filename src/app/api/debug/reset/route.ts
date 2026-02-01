import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, hasServiceKey } from '@/lib/supabase-admin';
import { WORLD_ID } from '@/utils/constants';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        // Use Admin client if available, otherwise fallback (likely to fail/limited)
        const client = hasServiceKey && supabaseAdmin ? supabaseAdmin : supabase;

        if (!hasServiceKey) {
            console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY missing. Reset may be incomplete due to RLS.");
        }

        // 1. Reset World State
        const defaultState = {
            order_score: 10,
            chaos_score: 10,
            justice_score: 10,
            evil_score: 10,
            status: '繁栄',
            attribute_name: '至高の平穏',
            flavor_text: '秩序と正義が保たれ、人々は安らかに暮らしている。',
            background_url: '/backgrounds/peace.jpg'
        };

        const { data: worldData, error: worldError } = await client
            .from('world_states')
            .update(defaultState)
            .eq('location_name', '名もなき旅人の拠所')
            .select('*');

        if (worldError) console.error("World reset error:", worldError);
        const worldUpdatedCount = worldData?.length || 0;
        console.log("World reset count:", worldUpdatedCount);

        // If no world state found to update, insert one
        if (worldUpdatedCount === 0) {
            console.log("No World State found. Inserting default...");
            const { error: insertError } = await client
                .from('world_states')
                .insert([{ location_name: '名もなき旅人の拠所', ...defaultState }]);
            if (insertError) console.error("World insert failed:", insertError);
        }

        // 2. Reset Inventory (Delete All)
        const { error: invError } = await client
            .from('inventory')
            .delete()
            .not('id', 'is', null); // Safety clause for DELETE ALL
        // .neq removed to ensure ALL are deleted

        if (invError) console.error("Inventory reset error:", invError);

        // 2c. Reset Reputations (New Fix)
        const { error: repError } = await client
            .from('reputations')
            .delete()
            .not('id', 'is', null);
        if (repError) console.error("Reputation reset error:", repError);

        // 2b. Reset NPCs (Disband Party)
        // 2b. Reset Party Members (Return to Pool)
        const { error: pmError } = await client
            .from('party_members')
            .update({ owner_id: null, is_active: false })
            .not('owner_id', 'is', null);

        if (pmError) console.error("Party Reset error:", pmError);

        // 2a. Get Start Location ID
        let { data: startLoc } = await client
            .from('locations')
            .select('id')
            .eq('name', '名もなき旅人の拠所')
            .maybeSingle();

        if (!startLoc) {
            console.log("Hub location not found. Creating...");
            const { data: newLoc } = await client
                .from('locations')
                .insert([{
                    name: '名もなき旅人の拠所',
                    type: 'Hub',
                    description: '全ての始まりと終わりの場所。',
                    x: 500,
                    y: 500,
                    nation_id: 'Neutral',
                    connections: [] // Initial empty connections
                }])
                .select('id')
                .single();
            startLoc = newLoc;
        }

        const startLocId = startLoc?.id || '00000000-0000-0000-0000-000000000000'; // Fallback UUID if creation failed (should fail constraint if strictly FK)

        // 3. Reset User Profile
        // Reset ALL profiles including Demo
        const { data: profileData, error: profileError } = await client
            .from('user_profiles')
            .update({
                order_pts: 0,
                chaos_pts: 0,
                justice_pts: 0,
                evil_pts: 0,
                title_name: '名もなき旅人',
                avatar_url: '/avatars/adventurer.jpg',
                current_location_id: startLocId, // Reset location
                previous_location_id: null, // Reset previous location
                age: 20,
                accumulated_days: 0
            })
            // .neq removed to ensure Demo Profile is reset
            .not('id', 'is', null) // Safety clause
            .select('*');

        if (profileError) console.error("Profile reset error:", profileError);
        const profileUpdatedCount = profileData?.length || 0;
        console.log("Profile reset count:", profileUpdatedCount);

        // Fallback: If no profiles updated, ensure Demo Profile exists
        if (profileUpdatedCount === 0) {
            console.log("No Profiles updated. Inserting demo profile...");
            const { error: insertProfileError } = await client
                .from('user_profiles')
                .upsert([{
                    id: '00000000-0000-0000-0000-000000000000',
                    title_name: '名もなき旅人',
                    avatar_url: '/avatars/adventurer.jpg',
                    order_pts: 0, chaos_pts: 0, justice_pts: 0, evil_pts: 0, gold: 1000
                }]);
            if (insertProfileError) console.error("Profile insert failed:", insertProfileError);
        }
        if (profileUpdatedCount === 0 && !hasServiceKey) {
            throw new Error("Reset failed: No profiles updated. Missing Admin Key (SUPABASE_SERVICE_ROLE_KEY)?");
        }

        return NextResponse.json({
            success: true,
            message: "World, Inventory, and Profiles Reset",
            debug: {
                worldUpdated: worldUpdatedCount,
                profileUpdated: profileUpdatedCount
            }
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
