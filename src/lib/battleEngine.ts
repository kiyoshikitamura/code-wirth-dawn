
import { Card, PartyMember, UserProfile } from '@/types/game';

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
        if (!member.is_active || member.durability <= 0) return; // Dead/Inactive members don't inject

        // Logic: 
        // Iterate through inject_cards array
        // Find card in pool
        // Add to deck
        member.inject_cards.forEach(cardId => {
            const card = cardLookup(cardId);
            if (card) {
                // Clone card to avoid reference issues if mutable?
                // For now, reference is fine as cards are usually static definitions.
                finalDeck.push({ ...card, source: `Party:${member.name}` } as any);
            }
        });
    });

    // 2. World Injection (V4 Mechanics)
    // Using simple status string check. Ideally we pass prosperity_level directly, but string map works.

    // Ruined (Lv1) / Declining (Lv2) -> Noise
    // NOVICE BLESSING: Skip noise if Level <= 5
    if ((worldStateStatus === 'Ruined' || worldStateStatus === 'Declining' || worldStateStatus === '崩壊' || worldStateStatus === '衰退') && userLevel > 5) {
        const noiseCard = cardLookup('card_noise') || { id: 'card_noise', name: 'Noise', type: 'Basic', description: 'Unusable Glitch', cost: 99 };
        // Ruined = 3 Noise, Declining = 1 Noise
        const count = (worldStateStatus === 'Ruined' || worldStateStatus === '崩壊') ? 3 : 1;
        for (let i = 0; i < count; i++) finalDeck.push({ ...noiseCard, source: 'World Hazard' } as any);
    }

    // Zenith (Lv5) -> Support
    if (worldStateStatus === 'Zenith' || worldStateStatus === '絶頂') {
        const supportCard = cardLookup('card_citizen_support') || { id: 'card_citizen_support', name: 'Citizen Aid', type: 'Skill', description: 'Restore 10 HP', cost: 0, power: 10 };
        finalDeck.push({ ...supportCard, source: 'World Blessing' } as any);
    }

    // 3. Basic Validation (Ensure usable cards exist)
    const basicAttack = cardLookup('1001') || { id: '1001', name: '斬撃', type: 'Skill', description: '基本攻撃', cost: 0, power: 20 };
    const basicDefend = cardLookup('1004') || { id: '1004', name: '鉄壁', type: 'Skill', description: '防御バフ', cost: 0, power: 0 };

    // Always ensure at least 3 basic attacks and 2 defends if deck is too small
    if (finalDeck.length < 5) {
        finalDeck.push(basicAttack, basicAttack, basicAttack);
        finalDeck.push(basicDefend, basicDefend);
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
