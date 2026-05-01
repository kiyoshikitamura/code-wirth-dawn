
import { createClient } from '@supabase/supabase-js';
import { UserProfile, ScenarioReward, LocationDB } from '@/types/game';
import { GROWTH_RULES } from '@/constants/game_rules';

// v15.0: game_rules.ts に一元化（ATK/DEF 上限廃止・ランダム成長対応）
const BASE_HP = GROWTH_RULES.BASE_HP_FALLBACK;
const BASE_DECK_COST = GROWTH_RULES.BASE_DECK_COST;
const COST_PER_LEVEL = GROWTH_RULES.COST_PER_LEVEL;
const MAX_DECK_COST = GROWTH_RULES.MAX_DECK_COST;

// v15.0: ランダムヘルパー（サーバーサイド専用）
const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

interface LevelUpInfo {
    level_up: boolean;
    new_level: number;
    hp_increase: number;
    cost_increase: number;
    atk_increase: number;
    def_increase: number;
    new_max_hp: number;
    new_max_cost: number;
}

/**
 * Calculate level up and stat growth based on EXP
 * Spec v15.0: 上方修正・ランダム成長
 * - HP: +randInt(3, 6) / Lv（累積加算）
 * - ATK/DEF: +randInt(0, 2) / Lv（毎Lv・上限なし）
 * - DeckCost: 上限 MAX_DECK_COST(30) でキャップ
 */
export function calculateGrowth(
    currentLevel: number,
    currentExp: number,
    expGained: number,
    currentAtk: number = 1,
    currentDef: number = 1,
    currentMaxHp: number = BASE_HP
): { newExp: number; levelInfo: LevelUpInfo } {
    let level = currentLevel;
    let exp = currentExp + expGained;
    let leveledUp = false;
    let hpInc = 0;
    let costInc = 0;
    let atkInc = 0;
    let defInc = 0;

    while (exp >= GROWTH_RULES.EXP_FORMULA(level)) {
        exp -= GROWTH_RULES.EXP_FORMULA(level);
        level++;
        leveledUp = true;

        // HP: レベル帯ごとの可変成長（累積加算）
        const { min, max } = GROWTH_RULES.getHpLevelGain(level);
        hpInc += randInt(min, max);

        // DeckCost: 上限 MAX_DECK_COST でキャップ
        const projectedCost = BASE_DECK_COST + (level * COST_PER_LEVEL);
        if (projectedCost <= MAX_DECK_COST) {
            costInc += COST_PER_LEVEL;
        }

        // ATK/DEF: +randInt(0, 2) / Lv（毎Lv・上限なし）
        atkInc += randInt(
            GROWTH_RULES.ATK_LEVEL_GAIN_MIN,
            GROWTH_RULES.ATK_LEVEL_GAIN_MAX
        );
        defInc += randInt(
            GROWTH_RULES.DEF_LEVEL_GAIN_MIN,
            GROWTH_RULES.DEF_LEVEL_GAIN_MAX
        );
    }

    return {
        newExp: exp,
        levelInfo: {
            level_up: leveledUp,
            new_level: level,
            hp_increase: hpInc,
            cost_increase: costInc,
            atk_increase: atkInc,
            def_increase: defInc,
            // v15.0: currentMaxHp からの累積加算（固定式ではなく加算方式）
            new_max_hp: currentMaxHp + hpInc,
            new_max_cost: Math.min(MAX_DECK_COST, BASE_DECK_COST + (level * COST_PER_LEVEL))
        }
    };
}

/**
 * Resolve Location Slug or ID to ID
 */
export async function resolveLocationId(
    supabase: any,
    identifier: string // UUID or Slug or Name
): Promise<string | null> {
    // 1. Try as UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) return identifier;

    // 2. Try as Name
    const { data } = await supabase
        .from('locations')
        .select('id')
        .eq('name', identifier)
        .maybeSingle();

    return data?.id || null;
}


/**
 * Handle Aging and Vitality Decay
 * Spec v9.3: Aging & Decay
 */
export function processAging(
    age: number,
    ageDays: number,
    daysPassed: number
): { newAge: number; newAgeDays: number; decay: { vit: number; atk: number; def: number } } {
    let newAge = age;
    let newAgeDays = ageDays + daysPassed;
    let decay = { vit: 0, atk: 0, def: 0 };

    while (newAgeDays >= 365) {
        newAge++;
        newAgeDays -= 365;

        // Decay Logic (Spec v9.3)
        if (newAge >= 60) {
            decay.vit += 10;
            decay.atk += 2;
            decay.def += 2;
        } else if (newAge >= 50) {
            decay.vit += 5;
            decay.atk += 1;
            decay.def += 1;
        } else if (newAge >= 40) {
            decay.vit += 2;
            if (newAge % 2 === 0) { // Spec: "2年に1回" -> Simplify to even years? Or Accumulate?
                // Spec says "2年に1回" for 40-49. Let's just say even years for now.
                decay.atk += 1;
                decay.def += 1;
            }
        }
    }

    return { newAge, newAgeDays, decay };
}

export class QuestService {
    static async fetchAvailableQuests(userId: string, locationId: string) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { data: quests, error } = await supabase
            .from('scenarios')
            .select('*')
            .eq('location_id', locationId);

        if (error) {
            console.error("QuestService Error:", error);
            throw error;
        }

        return quests || [];
    }

    /**
     * Validate if a user meets the requirements for a scenario
     * Checks completed quests, required generations, etc.
     */
    static async validateRequirements(supabase: any, userId: string, requirements: any): Promise<{ valid: boolean; reason?: string }> {
        if (!requirements || Object.keys(requirements).length === 0) return { valid: true };

        // 1. Generation Check
        if (requirements.required_generations) {
            const { count } = await supabase
                .from('retired_characters')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
            const generation = (count || 0) + 1;
            if (generation < requirements.required_generations) {
                return { valid: false, reason: `Generation ${requirements.required_generations} or higher required (Current: ${generation})` };
            }
        }

        // 2. Completed Quest Check (Value can be ID or Slug)
        if (requirements.completed_quest) {
            const reqVal = String(requirements.completed_quest);
            
            // Check if it's numeric ID
            let targetId: string | null = null;
            if (!isNaN(Number(reqVal))) {
                targetId = reqVal;
            } else {
                // Look up by slug
                const { data: targetQuest } = await supabase
                    .from('scenarios')
                    .select('id')
                    .eq('slug', reqVal)
                    .maybeSingle();
                if (targetQuest) targetId = targetQuest.id;
            }

            if (targetId) {
                const { data } = await supabase
                    .from('user_completed_quests')
                    .select('scenario_id')
                    .eq('user_id', userId)
                    .eq('scenario_id', targetId)
                    .maybeSingle();
                
                if (!data) return { valid: false, reason: `Prerequisite quest not completed` };
            } else {
                // If slug not found, assume unfulfilled or error
                return { valid: false, reason: `Invalid prerequisite quest definition` };
            }
        }

        return { valid: true };
    }
}
