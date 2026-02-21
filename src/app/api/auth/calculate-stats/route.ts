import { NextResponse } from 'next/server';
import { calculateAge, applyRandomVariance } from '@/utils/characterStats';
import { GROWTH_RULES } from '@/constants/game_rules';

// Spec v9.3 Base Stats Logic (with ATK/DEF)
// Spec v9.3 Base Stats Logic (Updated to match GROWTH_RULES constant)
function getSpecV93BaseStats(age: number) {
    // Calculate HP based on age range (16-25) mapped to (BASE_HP_MIN - BASE_HP_MAX)
    // 16yo -> 85, 25yo -> 120
    // Range: 9 years. HP Range: 35. ~3.8 HP/year.
    const ageFactor = (age - 16) / (25 - 16); // 0 to 1
    const baseHp = Math.floor(GROWTH_RULES.BASE_HP_MIN + (ageFactor * (GROWTH_RULES.BASE_HP_MAX - GROWTH_RULES.BASE_HP_MIN)));

    // 16-18: Late Bloomer (High Vit, Low Starting Stats)
    if (age <= 18) {
        const baseAtk = 1 + Math.floor(Math.random() * 2); // 1-2
        const baseDef = 1 + Math.floor(Math.random() * 2); // 1-2
        return {
            max_hp: baseHp,
            max_deck_cost: 8,
            vitality: 180 + Math.floor(Math.random() * 21), // 180-200
            max_vitality: 0, // will be set below
            atk: baseAtk,
            def: baseDef,
        };
    }
    // 19-22: Standard
    if (age <= 22) {
        const baseAtk = 2 + Math.floor(Math.random() * 2); // 2-3
        const baseDef = 2 + Math.floor(Math.random() * 2); // 2-3
        return {
            max_hp: baseHp,
            max_deck_cost: 10,
            vitality: 140 + Math.floor(Math.random() * 21), // 140-160
            max_vitality: 0,
            atk: baseAtk,
            def: baseDef,
        };
    }
    // 23-25: Veteran (High Starting Stats, Low Vit)
    const baseAtk = 3 + Math.floor(Math.random() * 3); // 3-5
    const baseDef = 3 + Math.floor(Math.random() * 3); // 3-5
    return {
        max_hp: baseHp,
        max_deck_cost: 12,
        vitality: 100 + Math.floor(Math.random() * 21), // 100-120
        max_vitality: 0,
        atk: baseAtk,
        def: baseDef,
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

        // v9.3 Random Variance
        const randomHp = Math.floor(Math.random() * 6) - 2;  // -2 ~ +3
        const randomCost = Math.random() > 0.5 ? 1 : 0;       // 0 ~ +1
        const randomVit = Math.floor(Math.random() * 21) - 10; // -10 ~ +10

        // ATK/DEF: 50% chance of +1 (Max 5)
        const atkBonus = Math.random() > 0.5 ? 1 : 0;
        const defBonus = Math.random() > 0.5 ? 1 : 0;
        const finalAtk = Math.min(5, baseStats.atk + atkBonus);
        const finalDef = Math.min(5, baseStats.def + defBonus);

        const finalHp = baseStats.max_hp + randomHp;
        const finalVit = baseStats.vitality + randomVit;

        const finalStats = {
            max_hp: finalHp,
            hp: finalHp,
            max_deck_cost: baseStats.max_deck_cost + randomCost,
            vitality: finalVit,
            max_vitality: finalVit,
            atk: finalAtk,
            def: finalDef,
            age: age,
            age_days: 0,
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
