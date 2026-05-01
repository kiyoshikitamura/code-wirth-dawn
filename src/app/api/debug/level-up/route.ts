
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GROWTH_RULES } from '@/constants/game_rules';

// Spec v8.1 Growth Logic
// Max Deck Cost: +2 per level
// Threshold (Atk/Def): Lv 3, 6, 9... (+1)

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, levels = 1 } = body;

        if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        let currentLevel = profile.level || 1;
        let maxDeckCost = profile.max_deck_cost || 10;
        let baseAtk = profile.attack || 0; // 'attack' column
        let baseDef = profile.def || 0;
        let maxHp = profile.max_hp || 100;

        const targetLevel = currentLevel + levels;
        if (targetLevel < 1) return NextResponse.json({ error: 'Level cannot be less than 1' }, { status: 400 });

        // レベルダウン・アップに関わらず、Lv1からtargetLevelまで再計算して整合性を保つ
        maxHp = GROWTH_RULES.BASE_HP_FALLBACK; // 100
        maxDeckCost = GROWTH_RULES.BASE_DECK_COST;
        baseAtk = 1; // 初期値
        baseDef = 1; // 初期値

        for (let l = 1; l < targetLevel; l++) {
            // HP: (可変成長の中央値を使用)
            const { min, max } = GROWTH_RULES.getHpLevelGain(l);
            maxHp += Math.floor((min + max) / 2);

            // Deck Cost
            const projectedCost = GROWTH_RULES.BASE_DECK_COST + (l * GROWTH_RULES.COST_PER_LEVEL);
            if (projectedCost <= GROWTH_RULES.MAX_DECK_COST) {
                maxDeckCost = projectedCost;
            } else {
                maxDeckCost = GROWTH_RULES.MAX_DECK_COST;
            }

            // ATK/DEF: (平均値の1を使用)
            baseAtk += 1;
            baseDef += 1;
        }

        // EXP: ターゲットレベルの必要EXPに合わせる
        const newExp = GROWTH_RULES.EXP_FORMULA(targetLevel);

        const updates = {
            level: targetLevel,
            max_hp: maxHp,
            hp: maxHp, // Full Recovery
            max_deck_cost: maxDeckCost,
            attack: baseAtk,
            def: baseDef,
            exp: newExp
        };

        const { data: updated, error: updateError } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            previous_level: currentLevel,
            new_profile: updated
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
