/**
 * NPC AI Engine (spec v2.4 → v4.0)
 * 
 * v4.0 Changes:
 *   - Heal check expanded to all roles (medic/guardian/striker) with role-based thresholds.
 *   - lastUsedCardId cooldown to prevent same-card spam.
 *   - Miss / Critical integrated via BATTLE_RULES.
 *   - Basic attack uses v4.0 damage formula.
 */

import { Card, PartyMember } from '@/types/game';
import { BATTLE_RULES } from '@/constants/battle_rules';
import { getMissChance, StatusEffect, hasEffect } from './statusEffects';

// ─── Types ───────────────────────────────────────────────
export type AIRole = 'striker' | 'guardian' | 'medic';
export type AIGrade = 'smart' | 'random';

export interface NpcAction {
    type: 'attack' | 'heal' | 'pass' | 'buff' | 'debuff';
    card?: Card;
    damage?: number;
    healAmount?: number;
    targetName?: string;
    targetEnemyName?: string;
    effectId?: string;
    effectDuration?: number;
    isMiss?: boolean;
    isCritical?: boolean;
    usedCardId?: string; // v4.0: 連打防止用
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
    enemyEffects?: { id: string; duration: number }[]; // 敵の状態異常判定用 (Bug AC)
    trackedEnemies?: { id: string; name: string; hp: number; def: number }[]; // v4.1: Smart AI ターゲット最適化用
    currentTurnNumber?: number; // v4.1: レガシースキル判定用
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

// ─── Legacy Skill (v4.1: 英霊レベル別APパッシブ) ─────────

interface LegacySkillDef {
    name: string;
    apBonus: number;
    interval: number; // N ターンに1回
}

function getLegacySkill(level: number): LegacySkillDef | null {
    if (level >= 30) return { name: '不滅の加護', apBonus: 2, interval: 1 };
    if (level >= 20) return { name: '英雄の覇気', apBonus: 1, interval: 1 };
    if (level >= 10) return { name: '古の知恵', apBonus: 1, interval: 2 };
    return { name: '残響の導き', apBonus: 1, interval: 3 };
}

function applyLegacySkill(
    npc: PartyMember,
    turnNumber: number
): NpcAction | null {
    if (npc.origin_type !== 'shadow_heroic') return null;
    const level = (npc as any).level || 1;
    const skill = getLegacySkill(level);
    if (!skill) return null;
    if (turnNumber % skill.interval !== 0) return null;

    npc.current_ap = Math.min(10, (npc.current_ap || 0) + skill.apBonus);
    return {
        type: 'buff',
        message: `${npc.name}の${skill.name}が発動！ AP+${skill.apBonus} (AP: ${npc.current_ap})`
    };
}

/**
 * 味方NPC用カードAP消費量計算 (Bug Z & 退行防止)
 */
function getNpcCardApCost(card: Card, npc: PartyMember, enemyEffects?: { id: string; duration: number }[]): number {
    let cost = card.ap_cost ?? 1;
    const effects = (npc.status_effects || []) as StatusEffect[];
    if (card.type === 'Skill' && effects.some(e => e.id === 'sacrificial_ap' && e.duration > 0)) {
        cost = Math.max(0, cost - 1);
    }
    const baseId = card.id.match(/^(\d+)/)?.[1] || card.id;
    if (baseId === '122' && enemyEffects) {
        const hasBleed = enemyEffects.some(e => e.id === 'bleed' || e.id === 'bleed_minor');
        if (hasBleed) {
            cost = 0;
        }
    }
    return cost;
}

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

    // 1.5 v4.1: レガシースキル（英霊限定APパッシブ）
    const turnNum = context.currentTurnNumber || 1;
    const legacyAction = applyLegacySkill(npc, turnNum);
    if (legacyAction) {
        actions.push(legacyAction);
    }

    // v2.8: Per-turn same-card limit removed. used_this_turn kept but not enforced.
    npc.used_this_turn = [];

    const deck = npc.signature_deck || [];
    if (deck.length === 0) {
        // No cards: basic attack fallback
        actions.push(createBasicAttack(npc, context));
        return actions;
    }

    // 2. Heal Check (v4.0: 全ロール対応、ロール別閾値)
    const healThreshold = npc.ai_role === 'medic' ? BATTLE_RULES.HEAL_THRESHOLD_MEDIC
        : npc.ai_grade === 'smart' ? BATTLE_RULES.HEAL_THRESHOLD_SMART
        : BATTLE_RULES.HEAL_THRESHOLD_DEFAULT;

    const needsHeal = context.playerHp < context.playerMaxHp * healThreshold
        || context.partyMembers.some(m =>
            m.is_active && (m.durability ?? 0) > 0
            && (m.durability ?? 0) < (m.max_durability || m.durability || 100) * healThreshold // 自分自身も含めて判定 (Bug AB)
        );

    if (needsHeal && actions.length < MAX_ACTIONS_PER_TURN) {
        const emergencyAction = tryEmergencyHeal(npc, deck, context);
        if (emergencyAction) {
            actions.push(emergencyAction);
        }
    }

    // 3. Wait Logic (Smart AI only)
    if (npc.ai_grade === 'smart') {
        const shouldWait = evaluateWaitLogic(npc, deck, context.enemyEffects);
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

    // 5. Attack: v4.1 — Smart AI は2枚/ターン、Random AI は1枚/ターン
    // v4.0: lastUsedCardId による連打防止 — 直前ターンと同じカードは使わない
    const ENEMY_TARGETS = ['single_enemy', 'all_enemies', 'random_enemy'];
    const attackCards = deck
        .filter(c => {
            if (c.type === 'Skill' || c.type === 'Magic') return true;
            if ((c.type === 'Defense' || c.type === 'Support') && c.target_type && ENEMY_TARGETS.includes(c.target_type)) return true;
            return false;
        })
        .sort((a, b) => getNpcCardApCost(b, npc, context.enemyEffects) - getNpcCardApCost(a, npc, context.enemyEffects));

    const lastUsed = (npc as any).lastUsedCardId as string | undefined;
    const maxAttackCards = npc.ai_grade === 'smart' ? 2 : 1; // v4.1: Smart は2枚
    let attacksUsed = 0;

    // v4.1: Smart AI — 瀕死ターゲット優先攻撃
    let effectiveContext = context;
    if (npc.ai_grade === 'smart' && context.trackedEnemies && context.trackedEnemies.length > 1) {
        const aliveEnemies = context.trackedEnemies.filter(e => e.hp > 0);
        if (aliveEnemies.length > 0) {
            const weakest = aliveEnemies.reduce((a, b) => a.hp < b.hp ? a : b);
            effectiveContext = {
                ...context,
                enemyName: weakest.name,
                enemyHp: weakest.hp,
                enemyDef: weakest.def,
            };
        }
    }

    const usedThisTurn: string[] = [];
    while (attacksUsed < maxAttackCards && actions.length < MAX_ACTIONS_PER_TURN) {
        // 直前ターンに使ったカード + 今ターン既使用カードを除外
        const candidates = attackCards.filter(c =>
            c.id !== lastUsed &&
            !usedThisTurn.includes(c.id) &&
            (npc.current_ap || 0) >= getNpcCardApCost(c, npc, context.enemyEffects)
        );

        if (candidates.length > 0) {
            const card = candidates[0];
            const action = executeCard(npc, card, effectiveContext);
            actions.push(action);
            npc.current_ap = (npc.current_ap || 0) - getNpcCardApCost(card, npc, context.enemyEffects);
            usedThisTurn.push(card.id);
            (npc as any).lastUsedCardId = card.id;
            attacksUsed++;
        } else {
            break; // これ以上使えるカードなし
        }
    }

    // カード攻撃が0回だった場合は基本攻撃フォールバック
    if (attacksUsed === 0 && !actions.some(a => a.type === 'attack') && actions.length < MAX_ACTIONS_PER_TURN) {
        actions.push(createBasicAttack(npc, effectiveContext));
        (npc as any).lastUsedCardId = undefined;
    }

    // 攻撃アクションが1件もない場合は基本攻撃フォールバック
    const hasAttackAction = actions.some(a => a.type === 'attack');
    if (!hasAttackAction && actions.length < MAX_ACTIONS_PER_TURN) {
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
        m.is_active && (m.durability ?? 0) > 0 &&
        (m.durability ?? 0) < (m.max_durability || m.durability || 100) * 0.5 // 自分自身も含めて判定 (Bug AB)
    );

    if (!playerInDanger && !injuredMember) return null;

    let targetName = playerInDanger ? 'あなた' : injuredMember?.name || '味方';
    let targetLostHp = playerInDanger ? (context.playerMaxHp - context.playerHp) : injuredMember ? ((injuredMember.max_durability || injuredMember.durability || 100) - injuredMember.durability) : 0;

    // Find a heal card we can afford
    const healCards = deck.filter(c => {
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

        return true;
    });

    const affordableHeal = healCards.filter(c =>
        getNpcCardApCost(c, npc, context.enemyEffects) <= (npc.current_ap || 0)
    );

    if (affordableHeal.length === 0) return null;

    const healCard = affordableHeal[0];
    const healAmount = Math.abs((healCard as any).effect_val ?? healCard.power ?? 15);
    npc.current_ap = (npc.current_ap || 0) - getNpcCardApCost(healCard, npc, context.enemyEffects);

    return {
        type: 'heal',
        card: healCard,
        healAmount,
        targetName,
        message: `${npc.name}の${healCard.name}！ ${targetName}のHPが ${healAmount} 回復した。`
    };
}

function evaluateWaitLogic(npc: PartyMember, deck: Card[], enemyEffects?: { id: string; duration: number }[]): boolean {
    const hasUltimate = deck.some(c => getNpcCardApCost(c, npc, enemyEffects) >= 5);
    const currentAp = npc.current_ap || 0;

    if (hasUltimate && currentAp < 5) {
        return true; // Save AP for the big move
    }

    const hasPlayable = deck.some(c =>
        getNpcCardApCost(c, npc, enemyEffects) <= currentAp
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
        getNpcCardApCost(c, npc, context.enemyEffects) <= (npc.current_ap || 0) &&
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
            context.partyMembers.some(m => m.is_active && (m.durability ?? 0) > 0 && (m.durability ?? 0) < (m.max_durability || m.durability || 100) * 0.7); // 自分自身も含めて判定 (Bug AB)

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

    // ロール不問: 一般的なバフカード使用試行
    if (!targetCard) {
        // まだ付与されていないバフを探す
        targetCard = buffCards.find(c => {
            if (!SELF_BUFF_EFFECTS.includes(c.effect_id || '')) return false;
            return !npc.status_effects?.some(e => e.id === c.effect_id);
        });
    }

    if (!targetCard) return null;

    npc.current_ap = (npc.current_ap || 0) - getNpcCardApCost(targetCard, npc, context.enemyEffects);

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
        getNpcCardApCost(c, npc, context.enemyEffects) <= (npc.current_ap || 0)
    );

    if (debuffCards.length === 0) return null;

    // 既に敵に付与済みのデバフは除外
    const unusedDebuff = debuffCards.find(c => {
        const alreadyApplied = context.enemyEffects?.some(e => e.id === c.effect_id); // 敵の効果配列を参照 (Bug AC)
        return !alreadyApplied;
    }) || debuffCards[0]; // 全部付与済みなら最初のを使う

    npc.current_ap = (npc.current_ap || 0) - getNpcCardApCost(unusedDebuff, npc, context.enemyEffects);

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

    if (isBuff) {
        const isSelf = card.effect_id && ['atk_up', 'def_up', 'regen', 'stun_immune', 'evasion_up', 'taunt'].includes(card.effect_id);
        const targetName = isSelf ? npc.name : '味方';
        return {
            type: 'buff',
            card,
            effectId: card.effect_id,
            effectDuration: card.effect_duration || 3,
            targetName,
            usedCardId: card.id,
            message: `${npc.name}の${card.name}！ ${targetName}に効果が発動した。`
        };
    }

    if (power <= 0 && (card.name.includes('回復') || card.name.includes('ヒール'))) {
        const healAmount = Math.abs(power) || 15;
        return {
            type: 'heal',
            card,
            healAmount,
            targetName: 'あなた',
            usedCardId: card.id,
            message: `${npc.name}の${card.name}！ HPが ${healAmount} 回復した。`
        };
    }

    // v4.0: ミス判定
    const critRate = npc.ai_grade === 'smart' ? BATTLE_RULES.NPC_HIGH_GRADE_CRIT_RATE : BATTLE_RULES.NPC_CRIT_RATE;
    // 暗闇・目潰しによるミス率加算 (Bug Q)
    const blindMissChance = getMissChance((npc.status_effects || []) as StatusEffect[]);
    const totalMissChance = BATTLE_RULES.NPC_MISS_RATE + blindMissChance;
    if (Math.random() < totalMissChance) {
        return {
            type: 'attack',
            card,
            damage: 0,
            isMiss: true,
            targetEnemyName: context.enemyName,
            usedCardId: card.id,
            message: `${npc.name}の${card.name}！ ミス！ 攻撃は外れた！${totalMissChance > BATTLE_RULES.NPC_MISS_RATE ? ' (目潰し)' : ''}`
        };
    }

    // v4.0: ダメージ計算フロー (base → 揺らぎ → クリティカル → DEF)
    const npcAtk = npc.atk || 0;
    let dmg = (power + npcAtk) || (8 + Math.floor(Math.random() * 5) + npcAtk);

    // 揺らぎ
    const variance = BATTLE_RULES.DAMAGE_VARIANCE_MIN
        + Math.random() * (BATTLE_RULES.DAMAGE_VARIANCE_MAX - BATTLE_RULES.DAMAGE_VARIANCE_MIN);
    dmg = dmg * variance;

    // クリティカル判定
    const isCritical = Math.random() < critRate;
    if (isCritical) {
        dmg = dmg * BATTLE_RULES.CRIT_MULTIPLIER;
    }

    // DEF減算 (魔法は貫通)
    const isMagic = card.name.includes('魔法') ||
        card.name.toLowerCase().includes('magic') ||
        card.name.toLowerCase().includes('fire') ||
        card.name.toLowerCase().includes('ice');
    if (!isMagic) {
        dmg = dmg - context.enemyDef;
    }

    const finalDmg = Math.max(1, Math.floor(dmg));
    const critLabel = isCritical ? ' クリティカルヒット！' : '';

    const isAoe = card.target_type === 'all_enemies';
    const targetMsg = isAoe ? '敵全体' : context.enemyName;

    return {
        type: 'attack',
        card,
        damage: finalDmg,
        isCritical,
        effectId: card.effect_id,
        effectDuration: card.effect_duration || 3,
        targetEnemyName: targetMsg,
        usedCardId: card.id,
        message: `${npc.name}の${card.name}！${critLabel} ${targetMsg}に ${finalDmg} のダメージ！`
    };
}

function createBasicAttack(
    npc: PartyMember,
    context: BattleContext
): NpcAction {
    // v4.0: ミス判定
    // 暗闇・目潰しによるミス率加算 (Bug Q)
    const blindMissChance = getMissChance((npc.status_effects || []) as StatusEffect[]);
    const totalMissChance = BATTLE_RULES.NPC_MISS_RATE + blindMissChance;
    if (Math.random() < totalMissChance) {
        return {
            type: 'attack',
            damage: 0,
            isMiss: true,
            targetEnemyName: context.enemyName,
            message: `${npc.name}の援護攻撃！ ミス！ 攻撃は外れた！${totalMissChance > BATTLE_RULES.NPC_MISS_RATE ? ' (目潰し)' : ''}`
        };
    }

    // v4.0: ダメージ計算フロー
    const npcAtk = npc.atk || 0;
    let baseDmg = npcAtk + Math.floor(Math.random() * 7);

    // 揺らぎ
    const variance = BATTLE_RULES.DAMAGE_VARIANCE_MIN
        + Math.random() * (BATTLE_RULES.DAMAGE_VARIANCE_MAX - BATTLE_RULES.DAMAGE_VARIANCE_MIN);
    baseDmg = baseDmg * variance;

    // クリティカル
    const critRate = npc.ai_grade === 'smart' ? BATTLE_RULES.NPC_HIGH_GRADE_CRIT_RATE : BATTLE_RULES.NPC_CRIT_RATE;
    const isCritical = Math.random() < critRate;
    if (isCritical) {
        baseDmg = baseDmg * BATTLE_RULES.CRIT_MULTIPLIER;
    }

    // DEF減算
    const isMagic = npc.job_class === 'Mage';
    if (!isMagic) {
        baseDmg = baseDmg - context.enemyDef;
    }

    const finalDmg = Math.max(1, Math.floor(baseDmg));
    const critLabel = isCritical ? ' クリティカルヒット！' : '';

    return {
        type: 'attack',
        damage: finalDmg,
        isCritical,
        targetEnemyName: context.enemyName,
        message: `${npc.name}の援護攻撃！${critLabel} ${context.enemyName}に ${finalDmg} のダメージ！`
    };
}
