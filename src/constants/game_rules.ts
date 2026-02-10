
// Protocol v8.0: Progression & Growth Rules

export const GROWTH_RULES = {
    // HP Scale Update (Spec v8.2)
    BASE_HP_MIN: 85,      // 16yo min
    BASE_HP_MAX: 120,     // 25yo max
    HP_PER_LEVEL: 10,     // LvUP gain

    // Deck Cost
    BASE_DECK_COST: 8,
    COST_PER_LEVEL: 2,

    // Defense
    DEF_PER_MILESTONE: 1, // +1 every 5 levels

    // Aging (Spec v9.3)
    DECAY_START_AGE: 40,
    DECAY_RATES: {
        40: 2,  // 40s: -2/year
        50: 5,  // 50s: -5/year
        60: 10  // 60s: -10/year
    } as Record<number, number>,

    EXP_FORMULA: (currentLevel: number) => 100 * Math.pow(currentLevel, 2)
};
