
// Protocol v8.1 / v9.3: Progression & Growth Rules

export const GROWTH_RULES = {
    // HP Scale (Spec v8.1)
    BASE_HP_MIN: 85,      // 16yo min
    BASE_HP_MAX: 120,     // 25yo max
    HP_PER_LEVEL: 5,      // v8.1: +5/Lv (was 10 in v8.0)

    // Deck Cost
    BASE_DECK_COST: 8,
    COST_PER_LEVEL: 2,

    // ATK/DEF Growth (Spec v8.1)
    ATK_DEF_GROWTH_INTERVAL: 3,  // +1 every 3 levels (Lv 3,6,9...)
    MAX_ATK: 15,
    MAX_DEF: 15,

    // Aging (Spec v9.3)
    DECAY_START_AGE: 40,
    DECAY_RATES: {
        40: 2,  // 40s: Vit -2/year
        50: 5,  // 50s: Vit -5/year
        60: 10  // 60s: Vit -10/year
    } as Record<number, number>,

    // v9.3: ATK/DEF Decay per aging zone
    ATK_DEF_DECAY: {
        40: { amount: 1, interval: 2 },  // 40-49: -1 every 2 years (even ages)
        50: { amount: 1, interval: 1 },  // 50-59: -1 every year
        60: { amount: 2, interval: 1 }   // 60+:   -2 every year
    } as Record<number, { amount: number; interval: number }>,

    EXP_FORMULA: (currentLevel: number) => 100 * Math.pow(currentLevel, 2)
};
