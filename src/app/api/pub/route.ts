import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to get user profile
async function getUserProfile() {
    // In a real app we'd get the auth user. Here we fetch the demo/first profile or by ID.
    // For simplicity in this demo environment, we assume single user or handle session manually.
    const { data: profiles } = await supabase.from('user_profiles').select('*').limit(1);
    return profiles?.[0];
}

// GET: List NPCs in current location (that are NOT hired) + User's Party
export async function GET(req: Request) {
    try {
        const profile = await getUserProfile();
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Ensure we know where the user is
        let locationId = profile.current_location_id;

        // If location is null, user is effectively at Hub (or fallback). 
        // Need to find Hub ID if null? Or rely on client logic. 
        // Logic: If null, we fetch Hub ID.
        if (!locationId) {
            const { data: hub } = await supabase.from('locations').select('id').eq('name', '名もなき旅人の拠所').single();
            locationId = hub?.id;
        }

        if (!locationId) throw new Error("Location undetermined");

        // 1. Fetch NPCs in this location (Not hired)
        const { data: pubNpcs, error: pubError } = await supabase
            .from('npcs')
            .select('*')
            .eq('current_location_id', locationId)
            .is('hired_by_user_id', null);

        if (pubError) throw pubError;

        let finalPubNpcs = pubNpcs || [];

        // --- NPC Generation Logic (Minimum 2) ---
        if (finalPubNpcs.length < 2) {
            const needed = 2 - finalPubNpcs.length;
            const newNpcs = [];

            // Simple random generator
            const JOB_CLASSES = ['Warrior', 'Mage', 'Rogue', 'Cleric', 'Paladin'];
            const PERSONALITIES = ['Brave', 'Timorous', 'Greedy', 'Honest', 'Scheming'];

            for (let i = 0; i < needed; i++) {
                const job = JOB_CLASSES[Math.floor(Math.random() * JOB_CLASSES.length)];
                const level = (profile.level || 1) + Math.floor(Math.random() * 3); // User Level ~ +2

                // Base Stats (Rough Approximation)
                const hp = 50 + (level * 10);
                const mp = 20 + (level * 5);
                const atk = 10 + (level * 2);
                const def = 5 + (level * 2);

                newNpcs.push({
                    name: `Traveler ${Math.floor(Math.random() * 1000)}`, // Temporary Name
                    job_class: job,
                    level,
                    hp, max_hp: hp,
                    mp, max_mp: mp,
                    attack: atk,
                    defense: def,
                    personality_type: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
                    current_location_id: locationId,
                    hired_by_user_id: null,
                    avatar_url: '/avatars/npc_default.jpg' // Default
                });
            }

            // Insert new NPCs
            const { data: inserted, error: insertError } = await supabase
                .from('npcs')
                .insert(newNpcs)
                .select('*');

            if (!insertError && inserted) {
                finalPubNpcs = [...finalPubNpcs, ...inserted];
            }
        }
        // ----------------------------------------

        // 2. Fetch User's Party (Anywhere - logically accompanying user)
        const { data: partyNpcs, error: partyError } = await supabase
            .from('npcs')
            .select('*')
            .eq('hired_by_user_id', profile.id);

        if (partyError) throw partyError;

        return NextResponse.json({
            pub: finalPubNpcs,
            party: partyNpcs || []
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST: Hire or Dismiss
export async function POST(req: Request) {
    try {
        const { action, npc_id } = await req.json(); // action: 'hire' | 'dismiss'
        const profile = await getUserProfile();
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 401 });

        if (action === 'hire') {
            // Check Party Size
            const { count } = await supabase
                .from('npcs')
                .select('*', { count: 'exact', head: true })
                .eq('hired_by_user_id', profile.id);

            if ((count || 0) >= 4) { // Max 4 NPCs + 1 User = 5
                return NextResponse.json({ error: 'Party is full (Max 4 NPCs).' }, { status: 400 });
            }

            // Perform Hire
            const { error } = await supabase
                .from('npcs')
                .update({
                    hired_by_user_id: profile.id,
                    current_location_id: null // Removed from map location effectively? Or keep tracking? 
                    // Technically user location tracks them. Let's set NULL or keep it in sync for "where they return to"?
                    // Let's keep it NULL while in party to avoid them appearing in pub queries elsewhere.
                    // Or better: update logic ensures only is('hired_by', null) appears in pub.
                })
                .eq('id', npc_id);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Welcome to the party.' });

        } else if (action === 'dismiss') {
            // Dismiss: They stay at CURRENT location (Pub where we are now)
            // We need current location ID
            let locationId = profile.current_location_id;
            if (!locationId) {
                const { data: hub } = await supabase.from('locations').select('id').eq('name', '名もなき旅人の拠所').single();
                locationId = hub?.id;
            }

            const { error } = await supabase
                .from('npcs')
                .update({
                    hired_by_user_id: null,
                    current_location_id: locationId
                })
                .eq('id', npc_id);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'We part ways here.' });
        } else if (action === 'kill') {
            // Kill: Delete the NPC record permanently
            const { error } = await supabase
                .from('npcs')
                .delete()
                .eq('id', npc_id);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'NPC eliminated.' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
