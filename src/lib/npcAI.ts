/**
 * NPC AI Engine (spec v2.4 → v2.8)
 * 
 * Handles NPC decision-making in battle: role determination,
 * AP management, card selection, and targeting.
 * 
 * v2.8 Changes:
 *   - Removed per-turn same-card limit (used_this_turn): NPCs can now use
 *     the same card multiple times per turn if AP permits.
 *   - Basic attack formula changed: ATK + 0~6 (was: 8~12 fixed).
 *   - Added MAX_ACTIONS_PER_TURN (3) to prevent excessive action spam.
 */

import { Card, PartyMember } from '@/types/game';

// ─── Types ───────────────────────────────────────────────
export type AIRole = 'striker' | 'guardian' | 'medic';
export type AIGrade = 'smart' | 'random';

export interface NpcAction {
    type: 'attack' | 'heal' | 'pass' | 'buff' | 'debuff';
    card?: Card;
    damage?: number;
    healAmount?: number;
    targetName?: string;
    targetEnemyName?: string; // v2.7: 攻撃対象エネミー名
    effectId?: string; // v2.5: バフ/デバフID
    effectDuration?: number;
    message: string;
}

export interface BattleContext {
    playerHp: number;
    playerMaxHp: number;
    enemyHp: number;
    enemyDef: number;
    enemyName: string; // v2.7: ダメージ対象エネミー名
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

// v2.8: Max actions per NPC per turn to prevent action spam
const MAX_ACTIONS_PER_TURN = 3;

// ─── Core AI Logic ───────────────────────────────────────

/**
 * Resolve a single NPC's turn. Returns a list of actions taken.
 * Mutates npc.current_ap in place.
 */
export function resolveNpcTurn(
    npc: PartyMember,
    context: BattleContext
): NpcAction[] {
    const actions: NpcAction[] = [];

    // Skip inactive/dead NPCs（null/undefined は満HP相当として扱う）
    if (!npc.is_active || (npc.durability ?? 100) <= 0) return actions;

    // 1. AP Recovery (+5, cap 10)
    npc.current_ap = Math.min(10, (npc.current_ap || 0) + 5);

    // v2.8: Per-turn same-card limit removed. used_this_turn kept but not enforced.
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
        if (actions.length < MAX_ACTIONS_PER_TURN) {
            const emergencyAction = tryEmergencyHeal(npc, deck, context);
            if (emergencyAction) {
                actions.push(emergencyAction);
            }
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
    //  - Guardian: def_upカードを自分に使用後、攻撃も行う
    if (actions.length < MAX_ACTIONS_PER_TURN) {
        const buffAction = tryRoleBasedBuff(npc, deck, context);
        if (buffAction) {
            actions.push(buffAction);
        }
    }

    // 4.5. v2.9.3j: デバフカード使用（stun/bind/blind/atk_down等を敵に付与）
    if (actions.length < MAX_ACTIONS_PER_TURN) {
        const debuffAction = tryDebuffEnemy(npc, deck, context);
        if (debuffAction) {
            actions.push(debuffAction);
        }
    }

    // 5. Aggressive Execution: Use cards by descending AP cost
    // v2.9.3j: 攻撃用カード = Skill/Magic + 敵対象のDefense/Support（シールドバッシュ等）
    // 純粋なバフ/ヒール（味方対象）のみ除外。
    const ENEMY_TARGETS = ['single_enemy', 'all_enemies', 'random_enemy'];
    const attackCards = deck
        .filter(c => {
            // Skill/Magic → 常に攻撃候補
            if (c.type === 'Skill' || c.type === 'Magic') return true;
            // Defense/Support でも target_type が敵対象なら攻撃候補に含める
            if ((c.type === 'Defense' || c.type === 'Support') && c.target_type && ENEMY_TARGETS.includes(c.target_type)) return true;
            // Heal / 味方対象のDefense/Support → 除外
            return false;
        })
        .sort((a, b) => (b.ap_cost ?? 1) - (a.ap_cost ?? 1));

    // Use cards in a loop: try highest cost first, repeat until AP runs out or action cap hit
    let cardUsed = true;
    while (cardUsed && actions.length < MAX_ACTIONS_PER_TURN) {
        cardUsed = false;
        for (const card of attackCards) {
            if ((npc.current_ap || 0) < (card.ap_cost ?? 1)) continue;

            const action = executeCard(npc, card, context);
            actions.push(action);
            npc.current_ap = (npc.current_ap || 0) - (card.ap_cost ?? 1);
            cardUsed = true;
            break; // restart from highest cost
        }
    }

    // 攻撃アクションが1件もない場合は基本攻撃（バフのみのguardianも攻撃する）
    const hasAttackAction = actions.some(a => a.type === 'attack');
    if (!hasAttackAction) {
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
        const isHeal =
            (c as any).type === 'Heal' ||
            c.name.includes('回復') ||
            c.name.includes('ヒール') ||
            c.name.includes('治癒') ||
            c.name.includes('癒') ||
            c.name.toLowerCase().includes('heal') ||
            c.name.toLowerCase().includes('cure') ||
            c.name.toLowerCase().includes('mend');
        
        if (!isHeal) return false;
        
        const healAmount = Math.abs((c as any).effect_val ?? c.power ?? 15);
        // 無駄なヒールの抑制: 欠損HPに対して過剰な回復（例: 欠損HPの2倍以上かつ固定値10以上のオーバーヒール）となるカードは避ける
        if (healAmount > targetLostHp * 2 && healAmount > targetLostHp + 10) {
            return false;
        }

        return (c.ap_cost ?? 1) <= (npc.current_ap || 0);
    });

    if (!healCard) return null;

    const healAmount = Math.abs((healCard as any).effect_val ?? healCard.power ?? 15);
    npc.current_ap = (npc.current_ap || 0) - (healCard.ap_cost ?? 1);

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
        (c.ap_cost ?? 1) <= currentAp
    );

    return !hasPlayable;
}

/**
 * v2.5: ロール別バフ優先使用
 * - Striker: atk_upカードを自分に使用
 * - Medic: regen/def_upを味方に使用
 * - Guardian: def_upを自分に使用
 */
// v2.9.3j: ATK UP系として認識するeffect_idの一覧
const ATK_UP_EFFECTS = ['atk_up', 'atk_up_fatal', 'morale_up', 'berserk'];
// v2.9.3j: DEF UP系として認識するeffect_idの一覧
const DEF_UP_EFFECTS = ['def_up', 'def_up_heavy', 'invulnerable', 'absolute_def', 'counter'];
// v2.9.3j: 自己バフとして扱うeffect_id全体
const SELF_BUFF_EFFECTS = [...ATK_UP_EFFECTS, ...DEF_UP_EFFECTS, 'regen', 'stun_immune', 'evasion_up', 'taunt', 'spd_up'];
// v2.9.3j: 敵へのデバフとして使用するeffect_id
const ENEMY_DEBUFF_EFFECTS = ['stun', 'bind', 'blind', 'blind_minor', 'atk_down', 'freeze', 'poison', 'curse'];

function tryRoleBasedBuff(
    npc: PartyMember,
    deck: Card[],
    context: BattleContext
): NpcAction | null {
    // バフ対象: 味方対象のeffect_idを持つカード（敵対象デバフカードは除外）
    const ENEMY_TARGETS = ['single_enemy', 'all_enemies', 'random_enemy'];
    const buffCards = deck.filter(c =>
        c.effect_id &&
        (c.ap_cost ?? 1) <= (npc.current_ap || 0) &&
        !(c.target_type && ENEMY_TARGETS.includes(c.target_type)) // 敵対象デバフは除外
    );

    if (buffCards.length === 0) return null;

    let targetCard: Card | undefined;

    if (npc.ai_role === 'striker') {
        // atk_up系を優先 (重複回避)
        const hasAtkUp = npc.status_effects?.some(e => ATK_UP_EFFECTS.includes(e.id));
        if (!hasAtkUp) {
            targetCard = buffCards.find(c => ATK_UP_EFFECTS.includes(c.effect_id || ''));
        }
    } else if (npc.ai_role === 'medic') {
        // regen/def_upを優先(味方が傷ついている場合)
        const allyInDanger = context.playerHp < context.playerMaxHp * 0.7 ||
            context.partyMembers.some(m => m.id !== npc.id && m.durability < m.max_durability * 0.7);

        if (allyInDanger) {
            const playerHasRegen = context.playerEffects?.some(e => e.id === 'regen');
            const playerHasDefUp = context.playerEffects?.some(e => DEF_UP_EFFECTS.includes(e.id));
            
            targetCard = buffCards.find(c => {
                if (c.effect_id === 'regen' && !playerHasRegen) return true;
                if (DEF_UP_EFFECTS.includes(c.effect_id || '') && !playerHasDefUp) return true;
                if (c.effect_id === 'evasion_up' || c.effect_id === 'spd_up') return true;
                return false;
            });
        }
    } else if (npc.ai_role === 'guardian') {
        // def_up系を自分に使用 (重複回避)
        const hasDefUp = npc.status_effects?.some(e => DEF_UP_EFFECTS.includes(e.id));
        if (!hasDefUp) {
            targetCard = buffCards.find(c => DEF_UP_EFFECTS.includes(c.effect_id || ''));
        }
        // tauntも試す
        if (!targetCard) {
            const hasTaunt = npc.status_effects?.some(e => e.id === 'taunt');
            if (!hasTaunt) {
                targetCard = buffCards.find(c => c.effect_id === 'taunt');
            }
        }
    }

    // ロール不問: バフカードがあれば一般的に使用試行
    if (!targetCard) {
        // まだ付与されていないバフを探す
        targetCard = buffCards.find(c => {
            if (!SELF_BUFF_EFFECTS.includes(c.effect_id || '')) return false;
            return !npc.status_effects?.some(e => e.id === c.effect_id);
        });
    }

    if (!targetCard) return null;

    npc.current_ap = (npc.current_ap || 0) - (targetCard.ap_cost ?? 1);

    const isSelf = SELF_BUFF_EFFECTS.includes(targetCard.effect_id || '');
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

/**
 * v2.9.3j: 敵デバフカード使用
 * stun/bind/blind/atk_down等の敵対象カードを使用
 * 既に付与済みのデバフは重複を避ける
 */
function tryDebuffEnemy(
    npc: PartyMember,
    deck: Card[],
    context: BattleContext
): NpcAction | null {
    const ENEMY_TARGETS = ['single_enemy', 'all_enemies', 'random_enemy'];
    const debuffCards = deck.filter(c =>
        c.effect_id &&
        ENEMY_DEBUFF_EFFECTS.includes(c.effect_id) &&
        c.target_type && ENEMY_TARGETS.includes(c.target_type) &&
        (c.type === 'Support' || c.type === 'Defense') &&
        (c.ap_cost ?? 1) <= (npc.current_ap || 0)
    );

    if (debuffCards.length === 0) return null;

    // 既に敵に付与済みのデバフは除外
    const unusedDebuff = debuffCards.find(c => {
        const alreadyApplied = context.playerEffects?.some(e => e.id === c.effect_id); // enemy_effectsはcontextに含まれていないため簡易判定
        return !alreadyApplied;
    }) || debuffCards[0]; // 全部付与済みなら最初のを使う

    npc.current_ap = (npc.current_ap || 0) - (unusedDebuff.ap_cost ?? 1);

    const damage = unusedDebuff.power ?? (unusedDebuff as any).effect_val ?? 0;

    return {
        type: damage > 0 ? 'attack' : 'debuff',
        card: unusedDebuff,
        damage: damage > 0 ? Math.max(1, damage + (npc.atk || 0) - context.enemyDef) : undefined,
        effectId: unusedDebuff.effect_id,
        effectDuration: unusedDebuff.effect_duration || 2,
        targetEnemyName: context.enemyName,
        message: damage > 0
            ? `${npc.name}の${unusedDebuff.name}！ ${context.enemyName}に ${Math.max(1, damage + (npc.atk || 0) - context.enemyDef)} のダメージ！`
            : `${npc.name}の${unusedDebuff.name}！ ${context.enemyName}に効果が発動した！`
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
        targetEnemyName: context.enemyName,
        message: `${npc.name}の${card.name}！ ${context.enemyName}に ${damage} のダメージ！`
    };
}

function createBasicAttack(
    npc: PartyMember,
    context: BattleContext
): NpcAction {
    // v2.8: Basic attack = ATK + 0~6 (was: 8~12 fixed + ATK)
    const npcAtk = npc.atk || 0;
    let baseDmg = npcAtk + Math.floor(Math.random() * 7); // ATK + 0~6

    const isMagic = npc.job_class === 'Mage';
    let finalDmg = baseDmg;
    if (!isMagic) {
        finalDmg = Math.max(1, baseDmg - context.enemyDef);
    }

    return {
        type: 'attack',
        damage: finalDmg,
        targetEnemyName: context.enemyName,
        message: `${npc.name}の援護攻撃！ ${context.enemyName}に ${finalDmg} のダメージ！`
    };
}
