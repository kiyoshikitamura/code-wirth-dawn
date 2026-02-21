import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, hasServiceKey } from '@/lib/supabase-admin';
import { WORLD_ID } from '@/utils/constants';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // Use Admin client if available
        let client = hasServiceKey && supabaseAdmin ? supabaseAdmin : supabase;

        // If no Admin Key, try to use User Token specifically for Profile Reset
        const authHeader = req.headers.get('authorization');
        if (!hasServiceKey && authHeader) {
            const token = authHeader.replace('Bearer ', '');
            // Re-create client with user token to bypass RLS for *that user*
            // We import createClient specifically to avoid singleton issues if needed, 
            // but here we can just assume 'supabase' + auth header works if we use the helper logic
            // faster: just use the token in a new client instance
            const { createClient } = require('@supabase/supabase-js'); // dynamic import or use existing import
            client = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: authHeader } } }
            );
            console.log("Using User-Scoped Client for Reset (Admin Key missing)");
        }

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
                accumulated_days: 0,
                gender: 'Unknown',

                // Add Level Reset (User Request)
                level: 1,
                exp: 0,
                gold: 1000,
                vitality: 100,
                max_vitality: 100,
                is_alive: true,

                // Fix: Reset Battle Stats (Regression Fix)
                hp: 100,
                max_hp: 100,
                mp: 10,
                max_mp: 10,
                atk: 5, // Default base atk
                def: 0,

                // Fix: Reset Character Creation (Regression Fix)
                age: null as any, // Should trigger character creation
                name: null as any, // Clear user name

                // Fix: Reset Quest State
                current_quest_id: null,
                current_quest_state: null
            })
            // .neq removed to ensure Demo Profile is reset
            .not('id', 'is', null) // Safety clause
            .select('*');

        if (profileError) console.error("Profile reset error:", profileError);
        const profileUpdatedCount = profileData?.length || 0;
        console.log("Profile reset count:", profileUpdatedCount);

        // Explicit check for single user update if using User Client
        if (profileUpdatedCount === 0 && !hasServiceKey && authHeader) {
            // Maybe RLS prevented "update all", try updating checking ID explicitly?
            console.warn("User-Scoped Reset returned 0 rows. Check RLS or Token.");
        }

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
        // 4. Reset Hub States (Set all to True as everyone moves to Hub)
        const { error: hubError } = await client
            .from('user_hub_states')
            .update({ is_in_hub: true })
            .not('user_id', 'is', null);

        // If update misses (no rows), we rely on lazy init or manual insert if needed via profile loop.
        // But simpler to just delete all and let lazy init handle? 
        // No, lazy init defaults to FALSE. We want TRUE.
        // So we should upsert for existing profiles.
        // For now, simple update is good. If no row, Profile Reset puts them at Location ID, which World Map should detect.

        if (hubError) console.error("Hub State reset error:", hubError);

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
