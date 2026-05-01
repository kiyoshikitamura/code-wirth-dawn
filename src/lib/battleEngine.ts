
import { Card, PartyMember, UserProfile } from '@/types/game';
import { StatusEffect, getAttackMod, getDefBonus } from '@/lib/statusEffects';
import { getNoiseInjectionCount } from '@/lib/passiveEffects';
import { BATTLE_RULES } from '@/constants/battle_rules';

/**
 * v4.0 ダメージ計算（揺らぎ + クリティカル対応）
 * 
 * 計算フロー:
 *   1. base = (UserATK + CardPower) * AtkMod
 *   2. 揺らぎ: base2 = base * (0.85 ~ 1.15)
 *   3. クリティカル: base3 = base2 * 1.5 (発動時)
 *   4. DEF減算: result = base3 - TargetDEF - DefBonus (物理のみ)
 *   5. 最終ダメージ = max(1, floor(result))
 */
export interface DamageCalcResult {
    damage: number;
    isCritical: boolean;
}

export function calculateDamageV4(
    cardPower: number,
    targetDef: number,
    attackerEffects: StatusEffect[] = [],
    defenderEffects: StatusEffect[] = [],
    isMagic: boolean = false,
    userAtk: number = 0,
    critRate: number = BATTLE_RULES.PLAYER_CRIT_RATE
): DamageCalcResult {
    // 1. Base = (Card.Power + User.ATK) * atkMod
    let dmg = (cardPower + userAtk) * getAttackMod(attackerEffects);

    // 2. ダメージ揺らぎ (±15%)
    const variance = BATTLE_RULES.DAMAGE_VARIANCE_MIN
        + Math.random() * (BATTLE_RULES.DAMAGE_VARIANCE_MAX - BATTLE_RULES.DAMAGE_VARIANCE_MIN);
    dmg = dmg * variance;

    // 3. クリティカル判定
    const isCritical = Math.random() < critRate;
    if (isCritical) {
        dmg = dmg * BATTLE_RULES.CRIT_MULTIPLIER;
    }

    // 4. DEF減算: 物理のみ。魔法はDEF・defBonusともに貫通。
    if (!isMagic) {
        const defBonus = getDefBonus(defenderEffects);
        dmg = dmg - targetDef - defBonus;
    }

    // 5. 最終ダメージ
    const finalDamage = Math.max(1, Math.floor(dmg));
    return { damage: finalDamage, isCritical };
}

/**
 * v3.0互換: 旧シグネチャ（既存の呼び出し元が多いため維持）
 * 内部でv4.0を呼び出し、damage値のみ返す。
 */
export function calculateDamage(
    cardPower: number,
    targetDef: number,
    attackerEffects: StatusEffect[] = [],
    defenderEffects: StatusEffect[] = [],
    isMagic: boolean = false,
    userAtk: number = 0
): number {
    return calculateDamageV4(cardPower, targetDef, attackerEffects, defenderEffects, isMagic, userAtk).damage;
}

/**
 * ミス判定 (加算方式)
 * @param baseMissRate 基礎ミス率 (BATTLE_RULES から)
 * @param blindMissRate blind等による追加ミス率
 * @returns true = ミス
 */
export function rollMiss(baseMissRate: number, blindMissRate: number = 0): boolean {
    const totalMissRate = Math.min(0.95, baseMissRate + blindMissRate); // 95%キャップ
    return Math.random() < totalMissRate;
}

// Helper to look up card by ID (should be provided or fetched)
// In a real app, this might come from a robust Card Database.
// Here we assume the caller provides the pool or lookup function.

/**
 * A. Deck Construction Logic
 * Merges User Deck + Party Injection + World Injection
 */
export function buildBattleDeck(
    userDeck: Card[],
    partyMembers: PartyMember[],
    cardLookup: (id: string) => Card | undefined,
    worldStateStatus: string = 'Normal',
    userLevel: number = 1
): { deck: Card[]; didProtectFromNoise: boolean } {
    let finalDeck = [...userDeck];
    let didProtectFromNoise = false;

    // v4.1 案C: パーティ注入上限6枚
    const MAX_PARTY_INJECT = 6;
    let partyInjected = 0;
    partyMembers.forEach(member => {
        if (!member.is_active || member.durability <= 0) return;
        if (partyInjected >= MAX_PARTY_INJECT) return;

        (member.inject_cards || []).forEach(cardId => {
            if (partyInjected >= MAX_PARTY_INJECT) return;
            const card = cardLookup(String(cardId));
            if (card) {
                finalDeck.push({
                    ...card,
                    id: `${card.id}_${member.id}_${Math.random().toString(36).substr(2, 5)}`,
                    source: `Party:${member.name}`,
                    isInjected: true
                } as any);
                partyInjected++;
            }
        });
    });

    // 2. World Injection (V4.1 Mechanics)
    // spec_v7 §4.2: 初心者保護 —— Lv5以下は崩壊拠点でもノイズカード混入を免除する
    if (userLevel <= 5) {
        if (worldStateStatus === 'Ruined' || worldStateStatus === 'Declining' || worldStateStatus === '崩壊' || worldStateStatus === '衰退') {
            didProtectFromNoise = true;
        }
        console.log('[buildBattleDeck] 初心者保護: Lv', userLevel, 'のためのノイズカード混入をスキップ。');
    } else if (worldStateStatus === 'Ruined' || worldStateStatus === 'Declining' || worldStateStatus === '崩壊' || worldStateStatus === '衰退') {
        const noiseCard = cardLookup('card_noise') || { id: 'card_noise', name: 'Noise', type: 'noise' as any, description: 'Unusable Glitch', cost: 0, discard_cost: 1 };
        const count = (worldStateStatus === 'Ruined' || worldStateStatus === '崩壊') ? 3 : 1;
        for (let i = 0; i < count; i++) finalDeck.push({ ...noiseCard, id: `noise_${i}`, isInjected: true, source: 'World Hazard' } as any);
    }

    // Zenith (Lv5) → 市民支援カード自動注入 (v11.1: HP300回復 / コスツ0)
    if (worldStateStatus === 'Zenith' || worldStateStatus === '絶頂') {
        const supportCard = cardLookup('card_citizen_support') || {
            id: 'card_citizen_support',
            name: '市民の支援',
            type: 'Heal' as any,
            description: '[絶頂効果] 画教の一道。HPを300回復する。',
            cost: 0,
            ap_cost: 0,
            power: 300,
            effect_val: 300,
            target_type: 'self'
        };
        finalDeck.push({ ...supportCard, id: 'zenith_buff', cost: 0, ap_cost: 0, isInjected: true, source: '絶頂の祝福' } as any);
    }

    // 3. v19: サポートバフカードのノイズ注入チェック（呪いの偶像は廃止済み: 常に0を返す）
    const supportCards = finalDeck.filter(c => c.type === 'Support');
    const curseNoiseCount = getNoiseInjectionCount(supportCards);
    if (curseNoiseCount > 0) {
        const noiseCard = cardLookup('card_noise') || { id: 'card_noise', name: 'Noise', type: 'noise' as any, description: 'Unusable Glitch', cost: 0, discard_cost: 1 };
        for (let i = 0; i < curseNoiseCount; i++) {
            finalDeck.push({ ...noiseCard, id: `curse_noise_${i}`, isInjected: true, source: '呪い' } as any);
        }
    }

    // 4. v4.1 案A: 最小デッキ枚数の保証（min(手札上限×2, 12)）
    // 手札上限を取得
    const handSize = userLevel >= 30 ? 7 : userLevel >= 20 ? 6 : userLevel >= 5 ? 5 : 4;
    const MIN_DECK_SIZE = Math.max(handSize * 2, 12);

    if (finalDeck.length < MIN_DECK_SIZE) {
        // 基本カード10種(ID 1-10)からランダムに補充
        const BASIC_CARD_IDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        const basicCards = BASIC_CARD_IDS
            .map(id => cardLookup(id))
            .filter((c): c is Card => !!c);

        if (basicCards.length > 0) {
            let fillIndex = 0;
            while (finalDeck.length < MIN_DECK_SIZE) {
                const card = basicCards[fillIndex % basicCards.length];
                finalDeck.push({ ...card, id: `basic_fill_${finalDeck.length}_${fillIndex}`, source: 'BasicFill' });
                fillIndex++;
            }
        }
    }

    return { deck: finalDeck, didProtectFromNoise };
}

/**
 * B. Damage Router Logic
 * Decides who takes the damage: Player or a Party Member (Cover).
 */
export interface DamageResult {
    target: 'Player' | 'PartyMember';
    targetId?: string; // If PartyMember
    damage: number;
    isCovered: boolean;
    message: string;
}

export function routeDamage(
    partyMembers: PartyMember[],
    rawDamage: number
): DamageResult {
    const blockers = partyMembers.filter(m => m.is_active && m.durability > 0);

    // v3.3: パーティがいる場合、まずランダムターゲット選択（30%）
    // これにより敵がプレイヤーのみを狙い続ける偏りを緩和する
    if (blockers.length > 0) {
        const randomTargetChance = 30; // 30% でランダムなパーティメンバーを直接狙う
        const randomRoll = Math.floor(Math.random() * 100);
        if (randomRoll < randomTargetChance) {
            const picked = blockers[Math.floor(Math.random() * blockers.length)];
            return {
                target: 'PartyMember',
                targetId: picked.id,
                damage: rawDamage,
                isCovered: false,
                message: `${picked.name} takes a direct hit! (-${rawDamage} Durability)`
            };
        }
    }

    // Cover check: cover_rate によるかばう判定
    for (const member of blockers) {
        const roll = Math.floor(Math.random() * 100);
        if (roll < member.cover_rate) {
            return {
                target: 'PartyMember',
                targetId: member.id,
                damage: rawDamage,
                isCovered: true,
                message: `${member.name} takes the hit! (-${rawDamage} Durability)`
            };
        }
    }

    // どちらも失敗 → プレイヤーへ
    return {
        target: 'Player',
        damage: rawDamage,
        isCovered: false,
        message: `Direct hit to Player! (-${rawDamage} HP)`
    };
}

/**
 * C. Resource Cost Logic
 * Checks if user can afford the card (MP vs Vitality).
 */
export function canAffordCard(
    card: Card & { cost_vitality?: number },
    currentMp: number,
    currentVitality: number
): boolean {
    // MP cost is removed from V9 specs
    if (card.cost_vitality && currentVitality < card.cost_vitality) return false;
    return true;
}
