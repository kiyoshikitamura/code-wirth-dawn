import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to get user profile
async function getUserProfile() {
    // In a real app we'd get the auth user. Here we fetch the demo/first profile or by ID.
    // For simplicity in this demo environment, we assume single user or handle session manually.
    const { data: profiles } = await supabase.from('user_profiles').select('*').limit(1);
    return profiles?.[0];
}

// GET: List Party Members in Pool (owner_id is NULL) + User's Party
export async function GET(req: Request) {
    try {
        const profile = await getUserProfile();
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 1. Fetch Pool (Recruitable)
        // We can filter by location if we add 'current_location_id' to party_members schema,
        // but currently the schema only has owner_id.
        // Assuming global pool for now, or random subset.
        // If we want location, we need to add it to schema or just ignore location constraint for recruits.
        // Let's assume Global Pool for now.
        const { data: poolMembers, error: poolError } = await supabase
            .from('party_members')
            .select('*')
            .is('owner_id', null)
            .eq('origin', 'system'); // Only system generated ones

        if (poolError) throw poolError;

        let finalPool = poolMembers || [];

        // --- Candidate Generation Logic (Minimum 3) ---
        if (finalPool.length < 3) {
            const needed = 3 - finalPool.length;
            const newMembers = [];

            const JOB_CLASSES = ['Warrior', 'Mage', 'Rogue', 'Cleric', 'Paladin'];
            const GENDERS = ['Male', 'Female'];

            for (let i = 0; i < needed; i++) {
                const job = JOB_CLASSES[Math.floor(Math.random() * JOB_CLASSES.length)];
                // Stats
                const durability = 100;
                const coverRate = Math.floor(Math.random() * 40) + 10; // 10-50%
                const injectCards = [];

                // Inject Cards Logic
                if (job === 'Warrior') injectCards.push('c1'); // Slash
                if (job === 'Mage') injectCards.push('c2'); // Fireball
                if (job === 'Cleric') injectCards.push('c3'); // Heal

                newMembers.push({
                    name: `Mercenary ${Math.floor(Math.random() * 1000)}`,
                    job_class: job,
                    gender: GENDERS[Math.floor(Math.random() * GENDERS.length)],
                    origin: 'system',
                    durability: durability,
                    max_durability: durability,
                    loyalty: 50,
                    cover_rate: coverRate,
                    inject_cards: injectCards,
                    is_active: true // Active when hired
                });
            }

            if (newMembers.length > 0) {
                const { data: inserted, error: insertError } = await supabase
                    .from('party_members')
                    .insert(newMembers)
                    .select('*');

                if (!insertError && inserted) {
                    finalPool = [...finalPool, ...inserted];
                }
            }
        }
        // ----------------------------------------

        // 2. Fetch User's Party
        const { data: userParty, error: partyError } = await supabase
            .from('party_members')
            .select('*')
            .eq('owner_id', profile.id);

        if (partyError) throw partyError;

        return NextResponse.json({
            pub: finalPool,
            party: userParty || []
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST: Hire or Dismiss
export async function POST(req: Request) {
    try {
        const { action, member_id } = await req.json(); // member_id (was npc_id)
        const profile = await getUserProfile();
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 401 });

        if (action === 'hire') {
            // Check Party Size
            const { count } = await supabase
                .from('party_members')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', profile.id);

            if ((count || 0) >= 4) {
                return NextResponse.json({ error: 'Party is full (Max 4).' }, { status: 400 });
            }

            // Perform Hire
            const { error } = await supabase
                .from('party_members')
                .update({
                    owner_id: profile.id,
                    is_active: true
                })
                .eq('id', member_id);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Welcome to the party.' });

        } else if (action === 'dismiss') {
            // Dismiss -> Return to Pool
            const { error } = await supabase
                .from('party_members')
                .update({
                    owner_id: null,
                    is_active: false
                })
                .eq('id', member_id);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Dismissed.' });

        } else if (action === 'kill') {
            // Permadeath logic
            const { error } = await supabase
                .from('party_members')
                .update({
                    durability: 0,
                    is_active: false
                    // We keep owner_id or set null? Maybe keep to show in "Graveyard"?
                })
                .eq('id', member_id);

            if (error) {
                // Ignore error if ID is invalid (e.g. 'slime' passed by mistake)
                console.warn("Kill failed (likely invalid ID):", member_id);
            }
            return NextResponse.json({ success: true, message: 'Eliminated.' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
