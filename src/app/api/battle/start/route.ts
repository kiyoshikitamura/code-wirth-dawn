import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

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
        
        // [Security] JWT認証のみ — x-user-id フォールバック廃止 (v27.2)
        const userId = user?.id;

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

        // Collection: Record enemy encounters in bestiary
        try {
            const enemyList = Array.isArray(enemies) ? enemies : [];
            const enemyIds = enemyList
                .map((e: any) => e.enemy_id || e.id)
                .filter((id: any) => id != null && !isNaN(Number(id)))
                .map(Number);
            
            if (enemyIds.length > 0) {
                const bestiaryRows = enemyIds.map((eid: number) => ({
                    user_id: userId,
                    enemy_id: eid,
                }));
                const { error: upsertError } = await supabaseServer
                    .from('user_bestiary')
                    .upsert(bestiaryRows, { onConflict: 'user_id,enemy_id', ignoreDuplicates: true });
                if (upsertError) throw upsertError;
            }
        } catch (bestiaryErr) {
            // Non-critical: log but don't fail the battle start
            console.warn('[Battle Start] Bestiary recording failed:', bestiaryErr);
        }

        return NextResponse.json({ success: true, battle_session_id: session.id });
    } catch (e: any) {
        console.error("Battle Start Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
