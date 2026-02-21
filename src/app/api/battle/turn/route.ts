
import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase-admin';

/**
 * POST /api/battle/turn
 * Process Enemy Turn (AI, Injection, Damage)
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { battleState, userProfile } = body;

        // Validation
        if (!battleState || !battleState.enemy || !userProfile) {
            return NextResponse.json({ error: 'Missing state' }, { status: 400 });
        }

        const enemySlug = battleState.enemy.slug || 'slime'; // Fallback
        const party = battleState.party || [];
        const logs: string[] = [];
        const changes: any = { hp: 0, vitality: 0, party_updates: [], injected_cards: [] };

        // 1. Fetch Enemy AI & Skills
        // Optimization: In real app, cache this or pass it from client if trusted (but client is untrusted)
        // We fetch by slug
        const { data: enemyData, error } = await supabase
            .from('enemies')
            .select(`
                *,
                action_pattern
            `)
            .eq('slug', enemySlug)
            .single();

        // If not found, fallback to basic attack
        const aiPattern = enemyData?.action_pattern || [];

        // If we need skill details, we should join or fetch them. 
        // For simplicity, let's assume we fetch all skills used by this enemy, OR we fetch the specific skill once chosen.
        // Let's first choose the skill.

        // 2. AI Decision (Skill Selection)
        // Target Selection (Virtual)
        // Default target is Player unless specific condition
        let targetType: 'Player' | 'NPC' = 'Player';
        // Note: AI logic might target specific gender, etc.
        // We just need to select the SKILL first based on conditions.

        let selectedSkillSlug = 'attack'; // Default

        for (const action of aiPattern) {
            // Check condition
            let conditionMet = true;
            if (action.condition) {
                const [condType, condVal] = action.condition.split(':');
                if (condType === 'target_gender') {
                    // Check logic: prioritizing target? Or just "If player is male, use this"?
                    if (userProfile.gender !== condVal) conditionMet = false;
                }
                // Add more conditions here (e.g. hp_below:50)
            }

            if (conditionMet) {
                // Prob check
                const roll = Math.random() * 100;
                if (roll <= (action.prob || 100)) {
                    selectedSkillSlug = action.skill;
                    break; // Pick first valid
                }
            }
        }

        // 3. Fetch Selected Skill Data
        const { data: skillData } = await supabase
            .from('enemy_skills')
            .select('*')
            .eq('slug', selectedSkillSlug)
            .maybeSingle();

        const skillName = skillData?.name || '攻撃';
        const skillVal = skillData?.value || 10;
        const effectType = skillData?.effect_type || 'damage';
        const injectCardId = skillData?.inject_card_id;

        logs.push(`${enemyData?.name || '敵'}の${skillName}！`);

        // 4. Resolve Effect
        if (effectType === 'inject') {
            // Deck Injection
            if (injectCardId) {
                // Fetch card details to return to client for animation?
                // Client just needs ID to add to deck
                changes.injected_cards.push(injectCardId);
                logs.push(`山札に「${injectCardId}」が混ざった！`); // Should ideally show Card Name
            }
        } else {
            // Damage / Drain Logic
            let finalDamage = skillVal; // Base damage
            // (Optional calculation with defense?)

            // Meat Shield Check
            // Filter living NPCs
            const livingNPCs = party.filter((p: any) => p.is_active && p.durability > 0);
            let hitTarget: { type: 'Player' | 'NPC', id?: string, name?: string } = { type: 'Player', name: userProfile.name };

            // Roll for Cover
            for (const npc of livingNPCs) {
                const coverRate = npc.cover_rate || 0;
                if (Math.random() * 100 < coverRate) {
                    hitTarget = { type: 'NPC', id: npc.id, name: npc.name };
                    logs.push(`${npc.name}が庇った！`);
                    break;
                }
            }

            // Apply Damage
            if (hitTarget.type === 'NPC' && hitTarget.id) {
                // NPC Takes Damage
                // Update DB? Or return change for Client to sync?
                // Better to update DB here for security/persistence, but latency?
                // Step 1: Update DB
                const { data: npcData } = await supabase
                    .from('party_members')
                    .select('durability')
                    .eq('id', hitTarget.id)
                    .single();

                if (npcData) {
                    const newDur = Math.max(0, npcData.durability - finalDamage);
                    await supabase.from('party_members').update({ durability: newDur }).eq('id', hitTarget.id);

                    changes.party_updates.push({ id: hitTarget.id, durability: newDur });
                    logs.push(`${hitTarget.name}に ${finalDamage} のダメージ！`);

                    if (newDur <= 0) {
                        logs.push(`${hitTarget.name}は力尽きた...`);
                        await supabase.from('party_members').update({ is_active: false }).eq('id', hitTarget.id);
                    }
                }
            } else {
                // Player Takes Damage
                if (effectType === 'drain_vit') {
                    // Vitality Damage
                    logs.push(`寿命が削られる...！`);
                    const newVit = Math.max(0, (userProfile.vitality || 100) - finalDamage);
                    changes.vitality = -finalDamage; // Delta

                    await supabase.from('user_profiles').update({ vitality: newVit }).eq('id', userProfile.id);
                    logs.push(`Vitality -${finalDamage}`);
                } else {
                    // HP Damage
                    const newHp = Math.max(0, (userProfile.hp || 100) - finalDamage);
                    changes.hp = -finalDamage; // Delta

                    await supabase.from('user_profiles').update({ hp: newHp }).eq('id', userProfile.id);
                    logs.push(`HP -${finalDamage}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            logs,
            changes
        });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
