import { NextResponse } from 'next/server';
import { GROWTH_RULES } from '@/constants/game_rules';

// v15.0: ランダムヘルパー
const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) =>
    min + Math.random() * (max - min);

/**
 * v15.0: 初期ステータス計算（上方修正・ランダム変数導入）
 * spec_v10_character_creation.md §2.2〜2.3
 */
function getStartingStatsByAge(age: number) {
    // 基底HP: 85 + floor((Age - 15) * randFloat(1.5, 2.0))
    const baseHp = 85 + Math.floor((age - 15) * randFloat(1.5, 2.0));

    // 基底 ATK/DEF: randInt(1, 3)（年齢補正が別途加わる）
    const baseAtk = randInt(1, 3);
    const baseDef = randInt(1, 3);

    // 初期Gold: 800 + randInt(100, 400)
    const gold = 800 + randInt(100, 400);

    // 固定値
    const currentCost = 12; // BASE_DECK_COST(8) + Lv1 * COST_PER_LEVEL(2) + 2

    if (age <= 19) {
        // 15-19歳: VIT=100、HP+randInt(0,10)、ATK+randInt(0,2)、DEF+randInt(0,2)
        return {
            max_hp: baseHp + randInt(0, 10),
            max_deck_cost: currentCost,
            vitality: 100,
            max_vitality: 100,
            atk: baseAtk + randInt(0, 2),
            def: baseDef + randInt(0, 2),
            gold,
        };
    } else if (age <= 29) {
        // 20-29歳: VIT=randInt(85,95)、HP+randInt(0,10)、ATK+randInt(0,2)、DEF+randInt(0,2)
        const vit = randInt(85, 95);
        return {
            max_hp: baseHp + randInt(0, 10),
            max_deck_cost: currentCost,
            vitality: vit,
            max_vitality: vit,
            atk: baseAtk + randInt(0, 2),
            def: baseDef + randInt(0, 2),
            gold,
        };
    } else if (age <= 39) {
        // 30-39歳: VIT=randInt(70,80)、HP+randInt(10,20)、ATK+randInt(1,3)、DEF+randInt(1,3)
        const vit = randInt(70, 80);
        return {
            max_hp: baseHp + randInt(10, 20),
            max_deck_cost: currentCost,
            vitality: vit,
            max_vitality: vit,
            atk: baseAtk + randInt(1, 3),
            def: baseDef + randInt(1, 3),
            gold,
        };
    } else {
        // 40歳: VIT=60、HP+randInt(20,30)、ATK+randInt(2,4)、DEF+randInt(2,4)
        return {
            max_hp: baseHp + randInt(20, 30),
            max_deck_cost: currentCost,
            vitality: 60,
            max_vitality: 60,
            atk: baseAtk + randInt(2, 4),
            def: baseDef + randInt(2, 4),
            gold,
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
                error: '年齢は15歳から40歳の間である必要があります',
                age: parsedAge
            }, { status: 400 });
        }

        const baseStats = getStartingStatsByAge(parsedAge);

        const finalStats = {
            max_hp: baseStats.max_hp,
            hp: baseStats.max_hp,
            max_deck_cost: baseStats.max_deck_cost,
            vitality: baseStats.vitality,
            max_vitality: baseStats.max_vitality,
            atk: baseStats.atk,
            def: baseStats.def,
            gold: baseStats.gold,
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
