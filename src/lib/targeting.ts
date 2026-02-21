/**
 * ターゲットバリデーションエンジン (Targeting Engine) - spec v2.7
 *
 * カード使用時の二重検証:
 *   1. AP不足チェック
 *   2. target_type に応じたターゲット正当性チェック（taunt含む）
 */

import type { Card, BattleState, TargetType } from '@/types/game';
import { hasEffect, type StatusEffect } from './statusEffects';

// ─── 型定義 ───────────────────────────────────────────────

export interface ValidationResult {
    valid: boolean;
    error?: string;   // UIに表示するエラーメッセージ
}

// ─── メインバリデーション ─────────────────────────────────

/**
 * カード使用の二重バリデーション。
 * 1. AP不足 → エラー
 * 2. ターゲット不正 → エラー
 * 両方パスで valid: true。
 */
export function validateCardUse(
    card: Card,
    targetId: string | undefined,
    battleState: BattleState
): ValidationResult {
    // ─── Step 1: APチェック ───
    const apCost = card.ap_cost ?? 1;
    const currentAp = battleState.current_ap || 0;

    if (currentAp < apCost) {
        return {
            valid: false,
            error: `APが足りない！ (必要: ${apCost}, 残り: ${currentAp})`
        };
    }

    // ─── Step 2: ターゲットチェック ───
    const targetType: TargetType = card.target_type || inferTargetType(card);

    switch (targetType) {
        case 'single_enemy': {
            // 敵が存在するか
            if (!battleState.enemy) {
                return { valid: false, error: '攻撃対象の敵がいない！' };
            }

            // Tauntチェック: 敵にtaunt持ちがいればそれ以外への攻撃をブロック
            const tauntTarget = resolveTauntTarget(battleState);
            if (tauntTarget && targetId && targetId !== tauntTarget) {
                return {
                    valid: false,
                    error: '挑発中の敵を狙うしかない！'
                };
            }
            break;
        }

        case 'all_enemies':
        case 'random_enemy': {
            // 敵が存在すればOK（targetId不要）
            if (!battleState.enemy) {
                return { valid: false, error: '攻撃対象の敵がいない！' };
            }
            break;
        }

        case 'self': {
            // 自分自身への使用。targetId不要（自動解決）
            break;
        }

        case 'single_ally': {
            // 味方NPCが存在し、targetIdが味方のIDであること
            if (!battleState.party || battleState.party.length === 0) {
                return { valid: false, error: '対象の味方がいない！' };
            }
            if (targetId) {
                const targetExists = battleState.party.some(p => String(p.id) === targetId);
                if (!targetExists) {
                    return { valid: false, error: '指定した味方が見つからない！' };
                }
            }
            break;
        }

        case 'all_allies': {
            // 味方全体。targetId不要
            break;
        }

        default: {
            // 未知のtarget_type → 通過（後方互換性）
            break;
        }
    }

    return { valid: true };
}

// ─── Taunt解決 ───────────────────────────────────────────

/**
 * 敵陣にtaunt状態のユニットがいればそのIDを返す。
 * 現状は単一敵のため、敵のeffectsにtauntがあれば敵IDを返す。
 */
export function resolveTauntTarget(battleState: BattleState): string | null {
    if (!battleState.enemy) return null;

    const enemyEffects = (battleState.enemy_effects || []) as StatusEffect[];
    if (hasEffect(enemyEffects, 'taunt')) {
        return battleState.enemy.id;
    }

    return null;
}

// ─── デフォルトターゲット解決 ─────────────────────────────

/**
 * カードのtarget_typeに基づき、自動的にターゲットIDを決定する。
 * 単一敵戦闘の場合、single_enemy は敵IDを自動セット。
 */
export function getDefaultTarget(
    card: Card,
    battleState: BattleState
): string | undefined {
    const targetType: TargetType = card.target_type || inferTargetType(card);

    switch (targetType) {
        case 'single_enemy': {
            // Taunt優先
            const tauntTarget = resolveTauntTarget(battleState);
            if (tauntTarget) return tauntTarget;
            // 単一敵: 自動ターゲット
            return battleState.enemy?.id;
        }

        case 'random_enemy': {
            return battleState.enemy?.id;
        }

        case 'self': {
            return 'player';
        }

        case 'all_enemies':
        case 'all_allies': {
            return undefined; // 全体対象
        }

        case 'single_ally': {
            // 最もHPが低い味方を自動選択（将来拡張可）
            if (battleState.party && battleState.party.length > 0) {
                const sorted = [...battleState.party].sort(
                    (a, b) => (a.durability / a.max_durability) - (b.durability / b.max_durability)
                );
                return String(sorted[0].id);
            }
            return undefined;
        }

        default:
            return battleState.enemy?.id;
    }
}

// ─── ヘルパー ────────────────────────────────────────────

/**
 * target_typeが未設定のカードに対して、typeから推論する。
 * 後方互換性のためのフォールバック。
 */
function inferTargetType(card: Card): TargetType {
    // バフ系effect_idを持つカード → self
    if (card.effect_id) {
        const selfBuffs = ['atk_up', 'def_up', 'regen', 'taunt'];
        if (selfBuffs.includes(card.effect_id)) return 'self';
        // デバフ系 → single_enemy
        return 'single_enemy';
    }

    // Itemは基本的にself（ポーション等）
    if (card.type === 'Item') return 'self';

    // Skill/Basic/Personality → single_enemy
    return 'single_enemy';
}
