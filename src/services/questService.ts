
import { createClient } from '@supabase/supabase-js';
import { UserProfile, ScenarioReward, LocationDB } from '@/types/game';

// Constants for growth (v8.1)
const BASE_HP = 80;
const HP_PER_LEVEL = 5;
const BASE_DECK_COST = 10;
const COST_PER_LEVEL = 2;
const MAX_ATK = 15;
const MAX_DEF = 15;

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
 * Spec v8.1: Progression & Growth
 */
export function calculateGrowth(
    currentLevel: number,
    currentExp: number,
    expGained: number,
    currentAtk: number = 1,
    currentDef: number = 1
): { newExp: number; levelInfo: LevelUpInfo } {
    let level = currentLevel;
    let exp = currentExp + expGained;
    let leveledUp = false;
    let hpInc = 0;
    let costInc = 0;
    let atkInc = 0;
    let defInc = 0;

    // Simple exponential curve: NextLevel = Base * (Lv^2)
    // For simplicity, we use a fixed table or formula. 
    // v8.1: NextLevelExp = Base * (CurrentLevel ^ 2) -> Let's say Base=100 for now or use existing logic
    // Existing logic in route.ts was: const nextLevelExp = level * 100 * 1.5;
    // Let's stick to v8.1 formula if possible, but for compatibility let's use a standard curve
    // v8.1 says: NextLevelExp = Base * (CurrentLevel ^ 2)
    const getNextExp = (lv: number) => 50 * (lv ** 2);

    while (exp >= getNextExp(level)) {
        exp -= getNextExp(level);
        level++;
        leveledUp = true;

        // Stat Growth
        hpInc += HP_PER_LEVEL;
        costInc += COST_PER_LEVEL;

        // ATK/DEF: +1 every 3 levels (3, 6, 9...)
        if (level % 3 === 0) {
            if (currentAtk + atkInc < MAX_ATK) atkInc++;
            if (currentDef + defInc < MAX_DEF) defInc++;
        }
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
            new_max_hp: BASE_HP + (level * HP_PER_LEVEL), // Formula based or additive? 
            // Note: If user has custom stats not following formula, additive is safer.
            // But spec implies formula: 20 + 5*Lv.
            new_max_cost: BASE_DECK_COST + (level * COST_PER_LEVEL)
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

    // 2. Try as Slug or Name
    const { data } = await supabase
        .from('locations')
        .select('id')
        .or(`slug.eq.${identifier},name.eq.${identifier}`)
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
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
}
