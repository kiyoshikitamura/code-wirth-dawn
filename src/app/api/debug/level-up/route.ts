
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

        // Apply Growth
        for (let l = currentLevel + 1; l <= targetLevel; l++) {
            // HP: Simulating +5 per level (Example, user didn't specify formula, but said "Recalculate")
            // Let's assume Base 100 + (Lv-1)*5
            maxHp = 100 + (l - 1) * 5;

            // Deck Cost: +2
            maxDeckCost += 2;

            // Threshold: Every 3 levels
            if (l % 3 === 0) {
                baseAtk += 1;
                baseDef += 1;
            }
        }

        // EXP: Set to minimum required for target level (Mock formula: Lv^2 * 100)
        // User said "reset to min value".
        const newExp = (targetLevel ** 2) * 100;

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
