
import { Card, PartyMember, UserProfile } from '@/types/game';
import { StatusEffect, getAttackMod, getDefenseMod } from '@/lib/statusEffects';

/**
 * v2.11 決定論的ダメージ計算 (Deterministic)
 * Formula: FinalDamage = (UserATK + CardPower) * BuffMultiplier - Enemy.DEF
 * 乱数なし。計算結果が常に正解となる。
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

    // 2. Attacker atk_up buff
    dmg = Math.floor(dmg * getAttackMod(attackerEffects));

    // 3. DEF mitigation (物理のみ)
    if (!isMagic) {
        dmg = Math.max(1, dmg - targetDef);
    }

    // 4. Defender def_up
    dmg = Math.max(1, Math.floor(dmg * getDefenseMod(defenderEffects)));

    return dmg;
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
): Card[] {
    let finalDeck = [...userDeck];

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
    // ... (rest is fine)
    if ((worldStateStatus === 'Ruined' || worldStateStatus === 'Declining' || worldStateStatus === '崩壊' || worldStateStatus === '衰退') && userLevel > 5) {
        const noiseCard = cardLookup('card_noise') || { id: 'card_noise', name: 'Noise', type: 'noise' as any, description: 'Unusable Glitch', cost: 0, discard_cost: 1 };
        const count = (worldStateStatus === 'Ruined' || worldStateStatus === '崩壊') ? 3 : 1;
        for (let i = 0; i < count; i++) finalDeck.push({ ...noiseCard, id: `noise_${i}`, isInjected: true, source: 'World Hazard' } as any);
    }

    // Zenith (Lv5) -> Support
    if (worldStateStatus === 'Zenith' || worldStateStatus === '絶頂') {
        const supportCard = cardLookup('card_citizen_support') || { id: 'card_citizen_support', name: 'Citizen Aid', type: 'Skill', description: 'Restore 10 HP', cost: 0, power: 10 };
        finalDeck.push({ ...supportCard, id: 'zenith_buff', cost: 0, isInjected: true, source: 'World Blessing' } as any);
    }

    // 3. Basic Validation (Ensure usable cards exist)
    const basicAttack = cardLookup('1001') || { id: '1001', name: '斬撃', type: 'Skill', description: '基本攻撃', cost: 0, power: 20 };
    const basicDefend = cardLookup('1004') || { id: '1004', name: '鉄壁', type: 'Skill', description: '防御バフ', cost: 0, power: 0 };

    if (finalDeck.length < 5) {
        for (let i = 0; i < 3; i++) finalDeck.push({ ...basicAttack, id: `basic_atk_${i}` });
        for (let i = 0; i < 2; i++) finalDeck.push({ ...basicDefend, id: `basic_def_${i}` });
    }

    return finalDeck;
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
    // 1. Iterate through active party members to check for cover
    // Sort by cover_rate descending? Or just first come first serve?
    // Let's shuffle or order by loyalty/cover_rate logic.
    // Spec: "Iterate... Roll against cover_rate"

    // We filter alive active members
    const blockers = partyMembers.filter(m => m.is_active && m.durability > 0);

    for (const member of blockers) {
        // Simple D100 roll
        const roll = Math.floor(Math.random() * 100);
        if (roll < member.cover_rate) {
            // COVER SUCCESS
            return {
                target: 'PartyMember',
                targetId: member.id,
                damage: rawDamage, // Future: Apply defense reduction
                isCovered: true,
                message: `${member.name} takes the hit! (-${rawDamage} Durability)`
            };
        }
    }

    // No one covered -> Player takes hit
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
