
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
    worldStateStatus: string = 'Normal'
): Card[] {
    let finalDeck = [...userDeck];

    // 1. Party Injection
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

    // 2. World Injection (Optional)
    // If status is Ruined, add 'Noise' cards
    if (worldStateStatus === 'Ruined' || worldStateStatus === '崩壊') {
        const noiseCard = cardLookup('card_noise'); // Assuming 'card_noise' exists
        if (noiseCard) {
            finalDeck.push(noiseCard, noiseCard); // Add 2 noise cards
        }
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
    if (card.cost && currentMp < card.cost) return false;
    if (card.cost_vitality && currentVitality < card.cost_vitality) return false;
    return true;
}
