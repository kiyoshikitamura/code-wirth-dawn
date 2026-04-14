
import { Card, PartyMember, UserProfile } from '@/types/game';
import { StatusEffect, getAttackMod, getDefBonus } from '@/lib/statusEffects';
import { getNoiseInjectionCount } from '@/lib/passiveEffects';

/**
 * v3.0 決定論的ダメージ計算 (Deterministic)
 * Formula: FinalDamage = (UserATK + CardPower) * AtkMod - TargetDEF - DefBonus
 * DefBonus は StatusEffect(def_up/def_up_heavy).value から取得（提案A）。
 */
export function calculateDamage(
    cardPower: number,
    targetDef: number,
    attackerEffects: StatusEffect[] = [],
    defenderEffects: StatusEffect[] = [],
    isMagic: boolean = false,
    userAtk: number = 0  // v2.11: プレイヤーATK加算
): number {
    // 1. Base = Card.Power + User.ATK
    let dmg = cardPower + userAtk;

    // 2. Attacker atk_up buff (x1.5)
    dmg = Math.floor(dmg * getAttackMod(attackerEffects));

    // 3. DEF mitigation: 物理は targetDEF + defBonus を引く
    if (!isMagic) {
        const defBonus = getDefBonus(defenderEffects); // value付きdef_upの固定値
        dmg = Math.max(1, dmg - targetDef - defBonus);
    }
    // 魔法はDEF・defBonusともに無視（貫通）

    return Math.max(1, dmg);
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

    // ... (Party Injection omitted for brevity in diff if unchanged, but included in tool) ...
    // Since we are replacing block, we need to respect the original content or targeted replace.
    // I will target the function signature and the specific noise block.

    // Actually, let's use the replacement tool carefully.
    // I'll replace the signature first, then the noise block.
    partyMembers.forEach(member => {
        if (!member.is_active || member.durability <= 0) return;

        (member.inject_cards || []).forEach(cardId => {
            const card = cardLookup(String(cardId));
            if (card) {
                finalDeck.push({
                    ...card,
                    id: `${card.id}_${member.id}_${Math.random().toString(36).substr(2, 5)}`, // Unique ID for battle instance check
                    source: `Party:${member.name}`,
                    isInjected: true
                } as any);
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

    // 4. Basic Validation (Ensure usable cards exist)
    // card_slash (id=2), card_guard (id=4) を参照 — DBのslugキーでルックアップ
    const basicAttack = cardLookup('2') || cardLookup('card_slash') || { id: 'card_slash', name: '斬撃', type: 'Skill', description: '基本攻撃', cost: 0, power: 20 };
    const basicDefend = cardLookup('4') || cardLookup('card_guard') || { id: 'card_guard', name: '防御', type: 'Defense', description: '防御バフ', cost: 0, power: 0 };

    if (finalDeck.length < 5) {
        for (let i = 0; i < 3; i++) finalDeck.push({ ...basicAttack, id: `basic_atk_${i}` });
        for (let i = 0; i < 2; i++) finalDeck.push({ ...basicDefend, id: `basic_def_${i}` });
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
