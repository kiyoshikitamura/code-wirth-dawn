/**
 * バトルシステム パラメータ定数 (v4.0)
 * 
 * ダメージ揺らぎ・ミス率・クリティカル率を一元管理。
 * バランス調整はこのファイルの値変更のみで対応可能。
 */
export const BATTLE_RULES = {
    // ── ダメージ揺らぎ ──
    DAMAGE_VARIANCE_MIN: 0.85,
    DAMAGE_VARIANCE_MAX: 1.15,

    // ── ミス率（加算方式: 基礎 + blind等のステータス） ──
    PLAYER_MISS_RATE: 0.05,
    ENEMY_MISS_RATE: 0.08,
    NPC_MISS_RATE: 0.05,

    // ── クリティカル ──
    PLAYER_CRIT_RATE: 0.08,
    ENEMY_CRIT_RATE: 0.05,
    ENEMY_BOSS_CRIT_RATE: 0.08,   // level >= 20
    NPC_CRIT_RATE: 0.05,
    NPC_HIGH_GRADE_CRIT_RATE: 0.08, // ai_grade === 'smart'
    CRIT_MULTIPLIER: 1.5,

    // ── NPC回復閾値 ──
    HEAL_THRESHOLD_MEDIC: 0.70,
    HEAL_THRESHOLD_SMART: 0.50,
    HEAL_THRESHOLD_DEFAULT: 0.40,  // striker / guardian
};
