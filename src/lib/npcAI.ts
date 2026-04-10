/**
 * NPC AI Engine (spec v2.4)
 * 
 * Handles NPC decision-making in battle: role determination,
 * AP management, card selection, and targeting.
 */

import { Card, PartyMember } from '@/types/game';

// ─── Types ───────────────────────────────────────────────
export type AIRole = 'striker' | 'guardian' | 'medic';
export type AIGrade = 'smart' | 'random';

export interface NpcAction {
    type: 'attack' | 'heal' | 'pass' | 'buff';
    card?: Card;
    damage?: number;
    healAmount?: number;
    targetName?: string;
    effectId?: string; // v2.5: バフ/デバフID
    effectDuration?: number;
    message: string;
}

export interface BattleContext {
    playerHp: number;
    playerMaxHp: number;
    enemyHp: number;
    enemyDef: number;
    partyMembers: PartyMember[];
    playerEffects?: { id: string; duration: number }[]; // v2.6: プレイヤーのバフ・デバフ用
}

// ─── Role Determination ──────────────────────────────────

/**
 * Determine NPC role from stats and deck composition.
 * - Guardian: DEF >= 3 or cover_rate >= 30
 * - Medic: deck contains heal-type cards
 * - Striker: default
 */
export function determineRole(member: PartyMember): AIRole {
    // Guardian check
    if ((member.def && member.def >= 3) || member.cover_rate >= 30) {
        return 'guardian';
    }

    // Medic check: look for heal cards in signature_deck
    const hasHealCard = member.signature_deck?.some(c =>
        c.name.includes('回復') ||
        c.name.includes('ヒール') ||
        c.name.toLowerCase().includes('heal') ||
        c.name.toLowerCase().includes('cure') ||
        (c.power && c.power < 0) || // Negative power = heal convention
        (c as any).type === 'Heal'  // Q6: explicit Heal type card
    );
    if (hasHealCard) return 'medic';

    // Also check job_class as fallback
    const healerClasses = ['Cleric', 'Healer', 'Priest', 'White Mage'];
    if (healerClasses.includes(member.job_class)) return 'medic';

    return 'striker';
}

/**
 * Determine AI grade from origin_type.
 * - shadow_heroic → smart (strategic AP conservation)
 * - everything else → random
 */
export function determineGrade(member: PartyMember): AIGrade {
    return member.origin_type === 'shadow_heroic' ? 'smart' : 'random';
}

// ─── Core AI Logic ───────────────────────────────────────

/**
 * Resolve a single NPC's turn. Returns a list of actions taken.
 * Mutates npc.current_ap and npc.used_this_turn in place.
 */
export function resolveNpcTurn(
    npc: PartyMember,
    context: BattleContext
): NpcAction[] {
    const actions: NpcAction[] = [];

    // Skip inactive/dead NPCs
    if (!npc.is_active || npc.durability <= 0) return actions;

    // 1. AP Recovery (+5, cap 10)
    npc.current_ap = Math.min(10, (npc.current_ap || 0) + 5);

    // Reset per-turn usage tracking
    npc.used_this_turn = [];

    const deck = npc.signature_deck || [];
    if (deck.length === 0) {
        // No cards: basic attack fallback
        actions.push(createBasicAttack(npc, context));
        return actions;
    }

    // 2. Emergency Heal Check
    //    smartグレード（英霊）または medic ロールの場合、
    //    HPが50%以下なら「局面判断でヒール优先」。
    //    仕様: spec_v2_addendum_npc_ai.md §4
    if (npc.ai_grade === 'smart' || npc.ai_role === 'medic') {
        const emergencyAction = tryEmergencyHeal(npc, deck, context);
        if (emergencyAction) {
            actions.push(emergencyAction);
        }
    }

    // 3. Wait Logic (Smart AI only)
    if (npc.ai_grade === 'smart') {
        const shouldWait = evaluateWaitLogic(npc, deck);
        if (shouldWait) {
            actions.push({
                type: 'pass',
                message: `${npc.name}はAPを温存している... (AP: ${npc.current_ap})`
            });
            return actions;
        }
    }

    // 4. v2.5: Role-based Buff Priority
    //  - Striker: atk_upカードを自分に使用後、攻撃
    //  - Medic: regen/def_upカードを傷ついた味方に優先
    //  - Guardian: def_upカードを自分に使用
    const buffAction = tryRoleBasedBuff(npc, deck, context);
    if (buffAction) {
        actions.push(buffAction);
    }

    // 5. Aggressive Execution: Use cards by descending AP cost
    const playableCards = deck
        .filter(c => {
            const cost = c.ap_cost ?? 1;
            const isBuff = c.type === 'Defense' || c.type === 'Support' || c.type === 'Heal' || (c.effect_id && ['def_up', 'atk_up', 'regen', 'stun_immune', 'evasion_up', 'taunt'].includes(c.effect_id));
            return cost <= (npc.current_ap || 0) &&
                !npc.used_this_turn?.includes(c.id) &&
                !isBuff; // バフ・回復専用カードはスキップ（攻撃カードのみ実行）
        })
        .sort((a, b) => (b.ap_cost ?? 1) - (a.ap_cost ?? 1));

    for (const card of playableCards) {
        if ((npc.current_ap || 0) < (card.ap_cost ?? 1)) break;

        const action = executeCard(npc, card, context);
        actions.push(action);
        npc.current_ap = (npc.current_ap || 0) - (card.ap_cost ?? 1);
        npc.used_this_turn?.push(card.id);
    }

    // If no cards were played (all on cooldown or no AP), do basic attack
    if (actions.length === 0) {
        actions.push(createBasicAttack(npc, context));
    }

    return actions;
}

// ─── Sub-routines ────────────────────────────────────────

function tryEmergencyHeal(
    npc: PartyMember,
    deck: Card[],
    context: BattleContext
): NpcAction | null {
    // Check if player HP is below 50%
    const playerInDanger = context.playerHp < context.playerMaxHp * 0.5;

    // Check if any party member is below 50% durability
    const injuredMember = context.partyMembers.find(m =>
        m.id !== npc.id && m.is_active && m.durability > 0 &&
        m.durability < m.max_durability * 0.5
    );

    if (!playerInDanger && !injuredMember) return null;

    let targetName = playerInDanger ? 'あなた' : injuredMember?.name || '味方';
    let targetLostHp = playerInDanger ? (context.playerMaxHp - context.playerHp) : injuredMember ? (injuredMember.max_durability - injuredMember.durability) : 0;

    // Find a heal card we can afford
    const healCard = deck.find(c => {
        const isHeal = c.name.includes('回復') || c.name.includes('ヒール') ||
            c.name.toLowerCase().includes('heal') || c.name.toLowerCase().includes('cure');
        
        if (!isHeal) return false;
        
        const healAmount = Math.abs(c.power || 15);
        // 無駄なヒールの抑制: 欠損HPに対して過剰な回復（例: 欠損HPの2倍以上かつ固定値10以上のオーバーヒール）となるカードは避ける
        if (healAmount > targetLostHp * 2 && healAmount > targetLostHp + 10) {
            return false;
        }

        return (c.ap_cost ?? 1) <= (npc.current_ap || 0) &&
            !npc.used_this_turn?.includes(c.id);
    });

    if (!healCard) return null;

    const healAmount = Math.abs(healCard.power || 15);
    npc.current_ap = (npc.current_ap || 0) - (healCard.ap_cost ?? 1);
    npc.used_this_turn?.push(healCard.id);

    return {
        type: 'heal',
        card: healCard,
        healAmount,
        targetName,
        message: `${npc.name}の${healCard.name}！ ${targetName}のHPが ${healAmount} 回復した。`
    };
}

function evaluateWaitLogic(npc: PartyMember, deck: Card[]): boolean {
    // Smart AI: Check if there's a powerful card (cost >= 5)
    // that we can't afford now but could afford at AP 10
    const hasUltimate = deck.some(c => (c.ap_cost ?? 1) >= 5);
    const currentAp = npc.current_ap || 0;

    if (hasUltimate && currentAp < 5) {
        return true; // Save AP for the big move
    }

    // Also wait if we have no playable cards at all
    const hasPlayable = deck.some(c =>
        (c.ap_cost ?? 1) <= currentAp &&
        !npc.used_this_turn?.includes(c.id)
    );

    return !hasPlayable;
}

/**
 * v2.5: ロール別バフ優先使用
 * - Striker: atk_upカードを自分に使用
 * - Medic: regen/def_upを味方に使用
 * - Guardian: def_upを自分に使用
 */
function tryRoleBasedBuff(
    npc: PartyMember,
    deck: Card[],
    context: BattleContext
): NpcAction | null {
    const buffCards = deck.filter(c =>
        c.effect_id &&
        (c.ap_cost ?? 1) <= (npc.current_ap || 0) &&
        !npc.used_this_turn?.includes(c.id)
    );

    if (buffCards.length === 0) return null;

    let targetCard: Card | undefined;

    if (npc.ai_role === 'striker') {
        // atk_upを優先 (重複回避)
        const hasAtkUp = npc.status_effects?.some(e => e.id === 'atk_up');
        if (!hasAtkUp) {
            targetCard = buffCards.find(c => c.effect_id === 'atk_up');
        }
    } else if (npc.ai_role === 'medic') {
        // regen/def_upを優先(味方が傷ついている場合)
        const allyInDanger = context.playerHp < context.playerMaxHp * 0.7 ||
            context.partyMembers.some(m => m.id !== npc.id && m.durability < m.max_durability * 0.7);

        if (allyInDanger) {
            const playerHasRegen = context.playerEffects?.some(e => e.id === 'regen');
            const playerHasDefUp = context.playerEffects?.some(e => e.id === 'def_up');
            
            targetCard = buffCards.find(c => {
                if (c.effect_id === 'regen' && !playerHasRegen) return true;
                if (c.effect_id === 'def_up' && !playerHasDefUp) return true;
                return false;
            });
        }
    } else if (npc.ai_role === 'guardian') {
        // def_upを自分に使用 (重複回避)
        const hasDefUp = npc.status_effects?.some(e => e.id === 'def_up');
        if (!hasDefUp) {
            targetCard = buffCards.find(c => c.effect_id === 'def_up');
        }
    }

    if (!targetCard) return null;

    npc.current_ap = (npc.current_ap || 0) - (targetCard.ap_cost ?? 1);
    npc.used_this_turn?.push(targetCard.id);

    const isSelf = ['atk_up', 'def_up', 'regen'].includes(targetCard.effect_id || '');
    const targetName = isSelf ? npc.name : 'あなた';

    return {
        type: 'buff',
        card: targetCard,
        effectId: targetCard.effect_id,
        effectDuration: targetCard.effect_duration || 3,
        targetName,
        message: `${npc.name}の${targetCard.name}！ ${targetName}に効果が発動した。`
    };
}

function executeCard(
    npc: PartyMember,
    card: Card,
    context: BattleContext
): NpcAction {
    const power = card.power ?? 0;
    const isBuff = card.type === 'Defense' || card.type === 'Support' || (card.effect_id && ['def_up', 'atk_up', 'regen', 'stun_immune', 'evasion_up', 'taunt'].includes(card.effect_id));

    // v2.5: バフ/防御カード
    if (isBuff) {
        const isSelf = card.effect_id && ['atk_up', 'def_up', 'regen', 'stun_immune', 'evasion_up', 'taunt'].includes(card.effect_id);
        const targetName = isSelf ? npc.name : '味方';
        return {
            type: 'buff',
            card,
            effectId: card.effect_id,
            effectDuration: card.effect_duration || 3,
            targetName,
            message: `${npc.name}の${card.name}！ ${targetName}に効果が発動した。`
        };
    }

    if (power <= 0 && (card.name.includes('回復') || card.name.includes('ヒール'))) {
        // Heal card
        const healAmount = Math.abs(power) || 15;
        return {
            type: 'heal',
            card,
            healAmount,
            targetName: 'あなた',
            message: `${npc.name}の${card.name}！ HPが ${healAmount} 回復した。`
        };
    }

    // Attack card
    let damage = power || (8 + Math.floor(Math.random() * 5));

    // v8.1: NPC基礎ATK加算 (プレイヤーと同様)
    const npcAtk = npc.atk || 0;
    damage = damage + npcAtk;

    // Apply DEF mitigation (non-magic)
    const isMagic = card.name.includes('魔法') ||
        card.name.toLowerCase().includes('magic') ||
        card.name.toLowerCase().includes('fire') ||
        card.name.toLowerCase().includes('ice');

    if (!isMagic) {
        damage = Math.max(1, damage - context.enemyDef);
    }

    return {
        type: 'attack',
        card,
        damage,
        effectId: card.effect_id,
        effectDuration: card.effect_duration || 3,
        message: `${npc.name}の${card.name}！ ${damage} のダメージ！`
    };
}

function createBasicAttack(
    npc: PartyMember,
    context: BattleContext
): NpcAction {
    let baseDmg = 8 + Math.floor(Math.random() * 5); // 8-12

    // v8.1: NPC基礎ATK加算
    const npcAtk = npc.atk || 0;
    baseDmg += npcAtk;

    // Class bonuses
    if (npc.job_class === 'Warrior') baseDmg += 5;
    if (npc.job_class === 'Mage') baseDmg += 8;

    const isMagic = npc.job_class === 'Mage';
    let finalDmg = baseDmg;
    if (!isMagic) {
        finalDmg = Math.max(1, baseDmg - context.enemyDef);
    }

    return {
        type: 'attack',
        damage: finalDmg,
        message: `${npc.name}の援護攻撃！ ${finalDmg} のダメージ！`
    };
}
