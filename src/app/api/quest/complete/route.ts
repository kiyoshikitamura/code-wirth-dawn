
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GROWTH_RULES } from '@/constants/game_rules';
import { releaseQuestLock } from '@/lib/questLock';

// Initialize Supabase Client safely (Service Role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey || '', {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

/**
 * POST /api/quest/complete
 * Handles quest completion logic v3.0
 */
export async function POST(req: Request) {
    try {
        if (!supabaseServiceKey) {
            console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.");
            return NextResponse.json({ error: 'Server Configuration Error: Missing Service Key' }, { status: 500 });
        }

        const body = await req.json();
        const { quest_id, result, user_id, history, loot_pool, consumed_items } = body;

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
            while (newExp >= GROWTH_RULES.EXP_FORMULA(newLevel)) {
                newLevel++;
            }

            if (newLevel > currentLevel) {
                updates.level = newLevel;

                // v8.1: MaxHP = InitialHP + (Level - 1) * 5
                const initialHp = user.initial_hp || GROWTH_RULES.BASE_HP_MIN;
                const newMaxHp = initialHp + (newLevel - 1) * GROWTH_RULES.HP_PER_LEVEL;
                const newMaxCost = GROWTH_RULES.BASE_DECK_COST + (newLevel - 1) * GROWTH_RULES.COST_PER_LEVEL;

                updates.max_hp = newMaxHp;
                updates.max_deck_cost = newMaxCost;
                updates.hp = newMaxHp; // Full Heal on Level Up

                // v8.1: ATK/DEF Growth (every 3 levels, Cap 15)
                let atkGain = 0;
                let defGain = 0;
                // Check each level crossed for milestone
                for (let lv = currentLevel + 1; lv <= newLevel; lv++) {
                    if (lv % GROWTH_RULES.ATK_DEF_GROWTH_INTERVAL === 0) {
                        atkGain++;
                        defGain++;
                    }
                }

                const currentAtk = user.atk || user.attack || 1;
                const currentDef = user.def || 1;
                const newAtk = Math.min(GROWTH_RULES.MAX_ATK, currentAtk + atkGain);
                const newDef = Math.min(GROWTH_RULES.MAX_DEF, currentDef + defGain);
                // Clamp gains to actual increase after cap
                atkGain = newAtk - currentAtk;
                defGain = newDef - currentDef;

                if (atkGain > 0) updates.atk = newAtk;
                if (defGain > 0) updates.def = newDef;

                levelUpInfo = {
                    oldLevel: currentLevel,
                    newLevel: newLevel,
                    hpDiff: newMaxHp - (user.max_hp || initialHp),
                    costDiff: newMaxCost - (user.max_deck_cost || GROWTH_RULES.BASE_DECK_COST),
                    atkGain,
                    defGain,
                    newHp: newMaxHp,
                    newCost: newMaxCost,
                    newAtk,
                    newDef,
                };
            }
        }

        // Aging Logic (Spec v9.3)
        let decayAmount = 0;
        let yearsAdded = 0;

        let atkDecay = 0;
        let defDecay = 0;

        if (updates.age_days >= 365) {
            const years = Math.floor(updates.age_days / 365);
            const oldAge = user.age || 18;
            const newAge = oldAge + years;

            updates.age = newAge;
            updates.age_days = updates.age_days % 365;
            yearsAdded = years;

            // v9.3: Decay Check for each year crossed
            for (let y = 0; y < years; y++) {
                const ageAtYear = oldAge + y + 1;
                if (ageAtYear < GROWTH_RULES.DECAY_START_AGE) continue;

                // Vitality Decay
                let vitDecayRate = 0;
                if (ageAtYear < 50) vitDecayRate = GROWTH_RULES.DECAY_RATES[40];
                else if (ageAtYear < 60) vitDecayRate = GROWTH_RULES.DECAY_RATES[50];
                else vitDecayRate = GROWTH_RULES.DECAY_RATES[60];
                decayAmount += vitDecayRate;

                // ATK/DEF Decay (zone-based)
                let atkDefZone: { amount: number; interval: number };
                if (ageAtYear < 50) atkDefZone = GROWTH_RULES.ATK_DEF_DECAY[40];
                else if (ageAtYear < 60) atkDefZone = GROWTH_RULES.ATK_DEF_DECAY[50];
                else atkDefZone = GROWTH_RULES.ATK_DEF_DECAY[60];

                // Check interval: 40s = even ages only, 50s/60s = every year
                if (ageAtYear % atkDefZone.interval === 0) {
                    atkDecay += atkDefZone.amount;
                    defDecay += atkDefZone.amount;
                }
            }

            // Apply Vitality Decay
            if (decayAmount > 0) {
                const currentMaxVitality = user.max_vitality || 100;
                const currentVitality = user.vitality || 100;
                const newMaxVitality = Math.max(0, currentMaxVitality - decayAmount);
                const newVitality = Math.min(currentVitality, newMaxVitality);
                updates.max_vitality = newMaxVitality;
                updates.vitality = newVitality;
            }

            // Apply ATK/DEF Decay (Min 1)
            if (atkDecay > 0) {
                const currentAtk = updates.atk || user.atk || user.attack || 1;
                updates.atk = Math.max(1, currentAtk - atkDecay);
            }
            if (defDecay > 0) {
                const currentDef = updates.def || user.def || 1;
                updates.def = Math.max(1, currentDef - defDecay);
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

        // 5. Release Quest Lock (Spec v3.3 §4.2)
        updates.current_quest_id = null;

        // Apply User Updates
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user_id);

        if (updateError) throw updateError;

        // 5b. Loot Pool Persistence (Success only → inventory)
        let lootSaved: any[] = [];
        if (result === 'success' && Array.isArray(loot_pool) && loot_pool.length > 0) {
            // Insert each loot item into inventory
            for (const loot of loot_pool) {
                const { data: existing } = await supabase
                    .from('inventory')
                    .select('id, quantity')
                    .eq('user_id', user_id)
                    .eq('item_id', loot.itemId)
                    .maybeSingle();

                if (existing) {
                    await supabase
                        .from('inventory')
                        .update({ quantity: existing.quantity + (loot.quantity || 1) })
                        .eq('id', existing.id);
                } else {
                    await supabase
                        .from('inventory')
                        .insert({ user_id, item_id: loot.itemId, quantity: loot.quantity || 1 });
                }
                lootSaved.push(loot);
            }
        }
        // Failure: loot_pool is discarded (not saved)

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
            atk_decay: atkDecay,
            def_decay: defDecay,
            level_up: levelUpInfo
        };

        return NextResponse.json({
            success: true,
            days_passed: daysPassed,
            new_location: updates.current_location_id,
            rewards: quest.rewards,
            loot_saved: lootSaved,
            changes
        });

    } catch (e: any) {
        console.error('Quest Complete API Critical Error:', e);
        return NextResponse.json({
            error: e.message || 'Unknown server error',
            stack: e.stack
        }, { status: 500 });
    }
}
