import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createAuthClient } from '@/lib/supabase-auth';

// GET: List Party Members in Pool (owner_id is NULL) + User's Party
export async function GET(req: Request) {
    try {
        const supabaseAuth = createAuthClient(req);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
        if (!user || authError) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: profile } = await supabaseAuth.from('user_profiles').select('id, gold').eq('id', user.id).single();
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 1. Fetch Pool (Recruitable)
        // We can filter by location if we add 'current_location_id' to party_members schema,
        // but currently the schema only has owner_id.
        // Assuming global pool for now, or random subset.
        // If we want location, we need to add it to schema or just ignore location constraint for recruits.
        // Let's assume Global Pool for now.
        const { data: poolMembers, error: poolError } = await supabase
            .from('party_members')
            .select('id, name, slug, job_class, level, durability, max_durability, is_active, origin_type, stats, cover_rate, avatar_url, signature_deck_preview, flavor_text, contract_fee')
            .is('owner_id', null)
            .eq('origin_type', 'system'); // Only system generated ones

        if (poolError) throw poolError;

        let finalPool = poolMembers || [];

        // ※ マスターデータ（npcs.csv → party_membersテーブル）から事前投入済みのため、
        //    プールが空の場合はランダム生成を行わず、そのまま返す。


        // 2. Fetch User's Party
        const { data: userParty, error: partyError } = await supabaseAuth
            .from('party_members')
            .select('id, name, slug, job_class, level, durability, max_durability, is_active, origin_type, stats, cover_rate, avatar_url, signature_deck_preview, flavor_text, contract_fee')
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
        const supabaseAuth = createAuthClient(req);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
        if (!user || authError) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { action, member_id } = await req.json(); // member_id (was npc_id)
        const { data: profile } = await supabaseAuth.from('user_profiles').select('id, gold').eq('id', user.id).single();
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 401 });

        if (action === 'hire') {
            // Check Party Size
            const { count } = await supabaseAuth
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
