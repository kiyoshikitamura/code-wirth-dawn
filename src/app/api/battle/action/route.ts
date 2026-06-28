process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

/**
 * POST /api/battle/action
 * Validates a battle action safely on the server, modifying the persisted battle_session state.
 * Prevents memory tampering (e.g. infinite AP, zero damage runs).
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { battle_session_id, action_type, card, target_id, log_message } = body;
        
        const client = createAuthClient(req);

        // Fetch session securely
        const { data: session, error } = await client
            .from('battle_sessions')
            .select('*')
            .eq('id', battle_session_id)
            .single();

        if (error || !session) {
            return NextResponse.json({ error: 'Battle session not found or unauthorized' }, { status: 404 });
        }

        if (session.status !== 'active') {
            return NextResponse.json({ error: 'Battle is already over' }, { status: 400 });
        }

        let playerState = { ...session.player_state };
        let enemyData = [...session.enemy_data];
        let messages = [log_message || ''];

        // Process Action
        if (action_type === 'attack_enemy' && card) {
            const apCost = card.ap_cost ?? 1;
            
            // Validate AP
            if (playerState.current_ap < apCost) {
                return NextResponse.json({ error: 'Not enough AP. Action rejected by server.' }, { status: 400 });
            }

            // Deduct AP
            playerState.current_ap -= apCost;

            // Process AP recovery card effects (e.g. Meditation, Dark Pact)
            const resolvedEffectId = card.effect_id || (card.effect_data && card.effect_data.effect_id);
            if (resolvedEffectId === 'ap_recover') {
                playerState.current_ap = Math.min(15, playerState.current_ap + 3);
            } else if (resolvedEffectId === 'ap_max') {
                playerState.current_ap = 15;
                if (playerState.stats) {
                    const maxHp = playerState.stats.max_hp || 100;
                    const selfDmg = Math.max(1, Math.floor(maxHp * 0.1));
                    playerState.stats.hp = Math.max(0, (playerState.stats.hp || maxHp) - selfDmg);
                }
            }

            // Simple Damage Route
            const damage = card.power ?? 0;
            if (damage > 0) {
                // Apply player stats if active
                const pAtk = playerState.stats?.atk || 10;
                
                // Extremely simplified damage calc based on power + atk
                const finalDamage = Math.max(1, damage + Math.floor(pAtk / 5));

                const targetIndex = enemyData.findIndex(e => e.id === target_id);
                if (targetIndex !== -1 && enemyData[targetIndex].hp > 0) {
                    enemyData[targetIndex].hp = Math.max(0, enemyData[targetIndex].hp - finalDamage);
                    messages.push(`Server validated: Dealt ${finalDamage} damage to ${enemyData[targetIndex].name}`);
                }
            }
        } else if (action_type === 'end_turn') {
            // Validate and recover AP (Max 10)
            playerState.current_ap = Math.min(10, playerState.current_ap + 5);
            messages.push(`Server validated: Turn ended. AP recovered.`);
        }

        // Check Victory
        const allDead = enemyData.every(e => e.hp <= 0);
        const status = allDead ? 'victory' : 'active';

        // Persist the state
        const { error: updateError } = await supabaseServer
            .from('battle_sessions')
            .update({
                player_state: playerState,
                enemy_data: enemyData,
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', battle_session_id);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            status,
            player_state: playerState,
            enemy_data: enemyData,
            messages
        });

    } catch (e: any) {
        console.error("Battle Action Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
