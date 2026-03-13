import { NextResponse } from 'next/server';
import { calculateAge, applyRandomVariance } from '@/utils/characterStats';
import { GROWTH_RULES } from '@/constants/game_rules';

// Spec v9.3 Base Stats Logic (with ATK/DEF)
// Spec v9.3 Base Stats Logic (Updated to match GROWTH_RULES constant)
function getStartingStatsByAge(age: number) {
    // Base HP starts around 85
    const baseHp = 85 + Math.floor((age - 15) * 1.5); // slightly increases with age

    // Base Deck Cost
    const currentCost = 12;

    if (age <= 19) {
        return {
            max_hp: baseHp,
            max_deck_cost: currentCost,
            vitality: 100,
            max_vitality: 100,
            atk: 1,
            def: 1,
        };
    } else if (age <= 29) {
        return {
            max_hp: baseHp,
            max_deck_cost: currentCost,
            vitality: 85 + Math.floor(Math.random() * 11), // 85-95
            max_vitality: 0, // set below
            atk: 1 + (Math.floor(Math.random() * 2) + 1), // 1 + (1-2) = 2-3
            def: 1,
        };
    } else if (age <= 39) {
        return {
            max_hp: baseHp,
            max_deck_cost: currentCost,
            vitality: 70 + Math.floor(Math.random() * 11), // 70-80
            max_vitality: 0,
            atk: 1 + 1, // +1
            def: 1 + 1, // +1
        };
    } else {
        // 40
        return {
            max_hp: baseHp + 10, // Bonus for veteran
            max_deck_cost: currentCost,
            vitality: 60,
            max_vitality: 0,
            atk: 1 + 2, // +2
            def: 1 + 1, // +1
        };
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { age } = body;

        if (age === undefined || age === null) {
            return NextResponse.json({ error: 'Age is required' }, { status: 400 });
        }

        const parsedAge = Number(age);

        // Validate Age (15 <= Age <= 40)
        if (parsedAge < 15 || parsedAge > 40) {
            return NextResponse.json({
                error: '年齢は15歳から40歳の間である必要があります。',
                age: parsedAge
            }, { status: 400 });
        }

        const baseStats = getStartingStatsByAge(parsedAge);
        baseStats.max_vitality = baseStats.vitality; // Set max to intial

        const finalHp = baseStats.max_hp;
        const finalVit = baseStats.vitality;

        const finalStats = {
            max_hp: finalHp,
            hp: finalHp,
            max_deck_cost: baseStats.max_deck_cost,
            vitality: finalVit,
            max_vitality: finalVit,
            atk: baseStats.atk,
            def: baseStats.def,
            age: parsedAge,
            age_days: 0,
        };

        return NextResponse.json({
            success: true,
            age: parsedAge,
            stats: finalStats
        });

    } catch (err: any) {
        console.error("Calculate Stats Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
