
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import { GROWTH_RULES } from '@/constants/game_rules';

/**
 * POST /api/quest/complete
 * Handles quest completion logic v3.0
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { quest_id, result, user_id, history } = body;

        if (!quest_id || !user_id) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Fetch Quest
        const { data: quest, error: qError } = await supabase
            .from('scenarios')
            .select('*')
            .eq('id', quest_id)
            .single();

        if (qError || !quest) return NextResponse.json({ error: 'Quest not found' }, { status: 404 });

        // 2. Fetch User
        const { data: user, error: uError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user_id)
            .single();

        if (uError || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 3. Aging
        let daysPassed = 1;
        if (result === 'success') daysPassed = quest.days_success || 1;
        else if (result === 'failure') daysPassed = quest.days_failure || 1;

        const updates: any = {
            age_days: (user.age_days || 0) + daysPassed
        };

        // EXP & Level Up Logic (v8.0)
        let levelUpInfo: any = null;
        if (result === 'success') {
            const currentLevel = user.level || 1;
            const valExp = Number(user.exp || 0);

            const difficulty = quest.difficulty || 1;
            // Check if rewards.exp exists in JSONB, else fallback
            const questExp = (quest.rewards?.exp) || (difficulty * 20);

            // Battle Bonus (Simple: 30 * battle_nodes_visited)
            const battleCount = Array.isArray(history) ? history.filter((h: any) => h.nodeType === 'battle').length : 0;
            const earnedExp = questExp + (battleCount * 30);

            let newExp = valExp + earnedExp;
            updates.exp = newExp;

            // Check Level Up
            let newLevel = currentLevel;
            // Loop in case of multiple levels
            // Formula gives "Threshold for Level X to X+1"? 
            // Spec: "NextLevelExp = Base * (CurrentLevel ^ 2)"
            // If current level is 1, Formula(1) is threshold to 2.
            while (newExp >= GROWTH_RULES.EXP_FORMULA(newLevel)) {
                newLevel++;
            }

            if (newLevel > currentLevel) {
                updates.level = newLevel;
                // Update Stats (Spec v8.2)
                // MaxHP = InitialHP + (Level - 1) * 10
                // Use user.initial_hp if available, else fallback to current max_hp - (oldLevel-1)*10 ?? No, safer to use a base.
                // Fallback: If initial_hp missing, assume Base 20 (old) or 100 (new)?
                // Let's rely on initial_hp. If null, use GROWTH_RULES.BASE_HP_MIN.
                const initialHp = user.initial_hp || GROWTH_RULES.BASE_HP_MIN;
                const newMaxHp = initialHp + (newLevel - 1) * GROWTH_RULES.HP_PER_LEVEL;

                const newMaxCost = GROWTH_RULES.BASE_DECK_COST + (newLevel - 1) * GROWTH_RULES.COST_PER_LEVEL;

                updates.max_hp = newMaxHp;
                updates.max_deck_cost = newMaxCost;
                updates.hp = newMaxHp; // Full Heal on Level Up (Spec v8 2.1)

                // Defense Gain Logic (Every 5 levels)
                let defGain = 0;
                if (newLevel % 5 === 0) {
                    updates.def = (user.def || 0) + 1;
                    defGain = 1;
                }

                levelUpInfo = {
                    oldLevel: currentLevel,
                    newLevel: newLevel,
                    hpDiff: newMaxHp - (user.max_hp || initialHp),
                    costDiff: newMaxCost - (user.max_deck_cost || GROWTH_RULES.BASE_DECK_COST),
                    defGain: defGain,
                    newHp: newMaxHp,
                    newCost: newMaxCost,
                    newDef: updates.def || user.def || 0
                };
            }
        }

        // Aging Logic (Spec v9.3)
        let decayAmount = 0;
        let yearsAdded = 0;

        if (updates.age_days >= 365) {
            const years = Math.floor(updates.age_days / 365);
            const newAge = (user.age || 18) + years;

            updates.age = newAge;
            updates.age_days = updates.age_days % 365;
            yearsAdded = years;

            // Decay Check (Age >= 40)
            if (newAge >= 40) {
                // Determine decay amount based on age bracket from RULES
                if (newAge < 50) decayAmount = GROWTH_RULES.DECAY_RATES[40];
                else if (newAge < 60) decayAmount = GROWTH_RULES.DECAY_RATES[50];
                else decayAmount = GROWTH_RULES.DECAY_RATES[60];

                // Apply Decay
                const currentMaxVitality = user.max_vitality || 100;
                const currentVitality = user.vitality || 100;

                const newMaxVitality = Math.max(0, currentMaxVitality - decayAmount);
                const newVitality = Math.min(currentVitality, newMaxVitality);

                updates.max_vitality = newMaxVitality;
                updates.vitality = newVitality;
            }
        }

        // 4. Rewards & Travel (Success Only)
        if (result === 'success') {
            const rewards = quest.rewards || {};

            // Gold
            if (rewards.gold) {
                updates.gold = (user.gold || 0) + rewards.gold;
            }

            // Travel (move_to)
            if (rewards.move_to) {
                // Check if move_to is ID or Slug
                // For now assign directly, assuming location_id logic handles it
                updates.current_location_id = rewards.move_to;
            }
        }

        // 5. Apply User Updates
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user_id);

        if (updateError) throw updateError;

        // 6. World Impact
        if (result === 'success' && quest.impact) {
            const imp = quest.impact;
            if (imp.target_loc && imp.attribute && imp.value) {
                // Finding world state by location ID/Name
                // This part depends on how world_states are identified (loc_id or name)
                const { data: ws } = await supabase
                    .from('world_states')
                    .select('id, ' + imp.attribute + '_score') // Dynamic selection risky, but for prototype ok
                    .eq('location_id', imp.target_loc) // Assuming ID
                    .maybeSingle();

                if (ws) {
                    const attrKey = imp.attribute + '_score';
                    // const newVal = (ws[attrKey] || 0) + imp.value;
                    // await supabase.from('world_states').update({ [attrKey]: newVal }).eq('id', ws.id);
                }
            }
        }

        // Calculate changes for UI
        const changes = {
            gold_gained: (quest.rewards?.gold || 0),
            old_age: user.age,
            new_age: updates.age || user.age,
            aged_up: yearsAdded > 0,
            years_added: yearsAdded,
            vit_penalty: decayAmount,
            level_up: levelUpInfo
        };

        return NextResponse.json({
            success: true,
            days_passed: daysPassed,
            new_location: updates.current_location_id,
            rewards: quest.rewards,
            changes
        });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
