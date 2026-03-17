import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';

/**
 * POST /api/battle/start
 * Initializes a new Server-Authoritative battle session.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { enemies, party, initial_ap, resonance_active, player_stats } = body;
        const client = createAuthClient(req);

        // Fetch User Identity to enforce RLS correctly
        const { data: { user }, error: authError } = await client.auth.getUser();
        
        let userId = user?.id;
        if (!userId) {
            // Fallback for custom dev/demo mode ID if provided explicitly via header
            userId = req.headers.get('x-user-id') || undefined;
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized. User ID is missing.' }, { status: 401 });
        }

        // Prepare Player State
        const playerState = {
            party,
            current_ap: initial_ap || 5,
            player_effects: [],
            stats: player_stats || { hp: 100, max_hp: 100, atk: 10, def: 5 },
            resonance_active: resonance_active || false,
        };

        // Create Battle Session
        const { data: session, error } = await client
            .from('battle_sessions')
            .insert({
                user_id: userId,
                enemy_data: enemies || [],
                player_state: playerState,
                status: 'active'
            })
            .select('id')
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, battle_session_id: session.id });
    } catch (e: any) {
        console.error("Battle Start Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
