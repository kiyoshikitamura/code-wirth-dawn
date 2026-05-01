
// Protocol v15.0: Progression & Growth Rules (上方修正・ランダム成長)

export const GROWTH_RULES = {
    // HP Scale (Spec v15.0)
    BASE_HP_MIN: 85,            // 15歳の基底HP
    BASE_HP_MAX: 135,           // 40歳の基底HP上限（ランダム幅含む）
    BASE_HP_FALLBACK: 85,       // questService等のフォールバック用（v15.0: 80→85に引き上げ）

    // HP Level Growth (Spec v15.0: ランダム増加)
    HP_LEVEL_GAIN_MIN: 3,       // レベルアップごとの最小HP増加
    HP_LEVEL_GAIN_MAX: 6,       // レベルアップごとの最大HP増加

    // Deck Cost (Spec v16.0: 上限40, Lv×1成長)
    BASE_DECK_COST: 8,
    COST_PER_LEVEL: 1,          // v16.0: 2→1に減速（中盤以降の成長感維持）
    MAX_DECK_COST: 40,          // v16.0: 30→40（Lv32で到達）

    // ATK/DEF Growth (Spec v15.0: 毎Lv +0〜2、上限廃止)
    ATK_LEVEL_GAIN_MIN: 0,      // レベルアップごとの最小ATK増加
    ATK_LEVEL_GAIN_MAX: 2,      // レベルアップごとの最大ATK増加
    DEF_LEVEL_GAIN_MIN: 0,      // レベルアップごとの最小DEF増加
    DEF_LEVEL_GAIN_MAX: 2,      // レベルアップごとの最大DEF増加

    // Initial Gold Range (Spec v15.0)
    INITIAL_GOLD_MIN: 900,      // 800 + 100
    INITIAL_GOLD_MAX: 1200,     // 800 + 400

    // Hand Size by Level (spec v16.0: Lv20+:6枚, Lv30+:7枚 追加)
    // Lv1-4: 4枚 / Lv5-19: 5枚 / Lv20-29: 6枚 / Lv30+: 7枚
    HAND_SIZE_BY_LEVEL: [
        { minLevel: 30, size: 7 },
        { minLevel: 20, size: 6 },
        { minLevel: 5, size: 5 },
        { minLevel: 1, size: 4 },
    ] as const,

    // Aging (Spec v9.3 / v10)
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

    EXP_FORMULA: (currentLevel: number) => 50 * Math.pow(currentLevel, 2)
};

// ─── spec_v16: Economy & Reputation Rules ────────────────────────────────────
export const ECONOMY_RULES = {
    // §1: 移動エンカウント
    RANDOM_ENCOUNTER_RATE: 0.20,        // 通常ランダムエンカウント発生率 (20%)
    BOUNTY_HUNTER_THRESHOLD: -100,      // 賞金稼ぎ確定エンカウント閾値（以下で確定）
    BOUNTY_PENALTY_RATE: 0.50,          // 賞金稼ぎ敗北時ゴールド没収率 (50%)
    ENCOUNTER_VITALITY_LOSS: 1,         // 通常エンカウント敗北時Vitality減算量

    // §2: 首都入場制限
    PASS_PRICE: 20_000,                 // 通行許可証価格 (G)
    PASS_DURATION_DAYS: 365,            // 許可証有効日数
    BRIBE_COST: 10_000,                 // 賄賂費用 (G)

    // §3: クエスト失敗ペナルティ
    QUEST_FAIL_REP_PENALTY_MIN: -3,     // 名声ペナルティ最小値
    QUEST_FAIL_REP_PENALTY_MAX: -10,    // 名声ペナルティ最大値
    BATTLE_DEFEAT_VIT_PENALTY: 1,       // バトル敗北時VIT減算量（全バトル共通）

    // §4: 祈りの強化
    CAPITAL_PRAYER_MULTIPLIER: 2.0,     // 首都での祈りの影響力倍率
    PRAYER_BUFF_HP_PCT: 0.10,           // Blessing: 最大HP +10%
    PRAYER_BUFF_AP: 1,                  // Blessing: 初期AP +1

    // §5: 名声の自然減少
    REP_DECAY_THRESHOLD: 100,           // Decay発動の名声閾値
    REP_DECAY_AMOUNT: -5,               // 1日あたりの名声減少量

    // §6: ゴールドシンク
    LAUNDERING_COST: 100_000,           // 名声ロンダリング費用 (G)

    // §7: 宿屋と酒場
    INN_REST_COST_BASE: 200,
    INN_REST_COST_CHEAP: 100,
    INN_REST_COST_EXPENSIVE: 300,
    HIRE_HEROIC_BASE: 5000,
    HIRE_HEROIC_PER_LEVEL: 1000,
    HIRE_ACTIVE_PER_LEVEL: 1000,
    HIRE_MERCENARY_PER_LEVEL: 100,
} as const;

export const UI_RULES = {
    DEFAULT_AVATAR: '/avatars/adventurer.jpg',
} as const;
