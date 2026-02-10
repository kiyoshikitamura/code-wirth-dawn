import { NextResponse } from 'next/server';
import { calculateAge, applyRandomVariance } from '@/utils/characterStats';
import { GROWTH_RULES } from '@/constants/game_rules';

// Spec v9.3 Base Stats Logic
function getSpecV93BaseStats(age: number) {
    // 16-18: Late Bloomer (High Vit, Low Starting HP)
    if (age <= 18) return {
        max_hp: 85, // Range 85-95
        max_deck_cost: 8,
        vitality: 190, // Range 180-200
        max_vitality: 190
    };
    // 19-22: Standard
    if (age <= 22) return {
        max_hp: 100,
        max_deck_cost: 10,
        vitality: 150, // Range 140-160
        max_vitality: 150
    };
    // 23-25: Veteran (High Starting HP, Low Vit)
    return {
        max_hp: 115, // Range 110-120
        max_deck_cost: 12,
        vitality: 110, // Range 100-120
        max_vitality: 110
    };
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { birth_date } = body;

        if (!birth_date) {
            return NextResponse.json({ error: 'Birth date is required' }, { status: 400 });
        }

        const birthDate = new Date(birth_date);
        const age = calculateAge(birthDate);

        // Validate Age (16 <= Age <= 25)
        if (age < 16 || age > 25) {
            return NextResponse.json({
                error: '年齢は16歳から25歳の間である必要があります。',
                age
            }, { status: 400 });
        }

        const baseStats = getSpecV93BaseStats(age);

        // Apply Random Variance (Spec v9.3)
        // HP: -5 ~ +10
        // Vit: -10 ~ +10
        const randomHp = Math.floor(Math.random() * 16) - 5; // -5 to +10
        const randomVit = Math.floor(Math.random() * 21) - 10; // -10 to +10

        const finalStats = {
            max_hp: baseStats.max_hp + randomHp,
            hp: baseStats.max_hp + randomHp,
            max_deck_cost: baseStats.max_deck_cost, // No variance on cost
            vitality: baseStats.vitality + randomVit,
            max_vitality: baseStats.max_vitality + randomVit,
            // Ensure bounds
            age: age
        };

        return NextResponse.json({
            success: true,
            age,
            stats: finalStats
        });

    } catch (err: any) {
        console.error("Calculate Stats Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
