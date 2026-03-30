/**
 * カード効果分岐エンジン
 * 
 * cards.csv のカードIDから、バトル中の効果タイプ（attack / heal / escape 等）を判定する。
 * gameStore.ts の attackEnemy() から呼び出され、効果に応じた処理分岐を実現する。
 */

import { Card } from '@/types/game';
import { StatusEffectId } from '@/lib/statusEffects';

// ─── 効果タイプ定義 ──────────────────────────────────────

export type CardEffectType =
    | 'attack'         // 通常攻撃（デフォルト）
    | 'heal'           // HP回復（対象: 自分）
    | 'escape'         // 逃走（バトル終了、報酬なし）
    | 'buff_self'      // 自己バフ（ATK UP, DEF UP等）
    | 'taunt'          // 挑発（敵の攻撃を引きつける）
    | 'buff_party'     // パーティ全体バフ
    | 'aoe_attack'     // 全体攻撃
    | 'debuff_enemy'   // 敵デバフ（毒付与等、ダメージなし/低ダメージ）
    | 'passive_activate'; // v5.2: Passiveカード使用（バトル内永続バフを付与）

export interface CardEffectInfo {
    effectType: CardEffectType;
    effectId?: StatusEffectId;    // 付与する状態異常ID
    effectDuration?: number;      // 効果持続ターン数
    healAmount?: number;          // 回復量（heal用、effect_valと別途指定時）
    skipDamage?: boolean;         // true = 敵へのダメージ計算をスキップ
}

// ─── カードID → 効果マッピング ──────────────────────────

/**
 * cards.csv の id (数値部) をキーに、そのカードの効果を定義する。
 * ここに定義がないカードはデフォルトで 'attack' として扱う。
 * 
 * NPC注入カードは "1003_memberid_xxxxx" の形式で来るため、
 * getBaseCardId() で数値部を抽出してからこのマップを参照する。
 */
const CARD_EFFECT_MAP: Record<string, CardEffectInfo> = {
    // ─── 基本カード ─────────────────────────
    '1003': { effectType: 'heal', skipDamage: true },                                       // ヒール
    '1004': { effectType: 'buff_self', effectId: 'def_up', effectDuration: 2, skipDamage: true }, // 鉄壁
    '1035': { effectType: 'aoe_attack' },                                                   // 青龍偃月刀
    '1099': { effectType: 'aoe_attack' },                                                   // 神器:草薙

    // ─── NPC注入カード ──────────────────────
    '2000': { effectType: 'heal', skipDamage: true },                                       // 応急手当
    '2004': { effectType: 'buff_self', effectId: 'def_up', effectDuration: 2, skipDamage: true }, // 防御結界
    '2005': { effectType: 'taunt', effectId: 'taunt', effectDuration: 2, skipDamage: true },     // 挑発
    '2008': { effectType: 'buff_party', effectId: 'def_up', effectDuration: 2, skipDamage: true }, // 広域防壁
    '2009': { effectType: 'buff_self', effectId: 'stun_immune', effectDuration: 1, skipDamage: true }, // 禅
    '2012': { effectType: 'attack', effectId: 'stun', effectDuration: 1 },                  // 雷撃 (攻撃+スタン)
    '2016': { effectType: 'aoe_attack', effectId: 'stun', effectDuration: 1 },              // 獅子吼 (全体+スタン)
    '2030': { effectType: 'debuff_enemy', effectId: 'poison', effectDuration: 3, skipDamage: true }, // 猛毒
    '2050': { effectType: 'buff_self', effectId: 'atk_up', effectDuration: 3, skipDamage: true },  // 血の契約
    '2055': { effectType: 'buff_self', effectId: 'atk_up', effectDuration: 3, skipDamage: true },  // 狂戦士
    '2060': { effectType: 'aoe_attack', effectId: 'fear', effectDuration: 2 },              // 般若の威圧 (全体+恐怖)
    '2095': { effectType: 'escape', skipDamage: true },                                     // 賄賂
    '2099': { effectType: 'escape', skipDamage: true },                                     // 逃走

    // ─── Passiveカード (v5.2) ──────────────
    '2006': { effectType: 'passive_activate', skipDamage: true },    // 砂漠の外套
    '2007': { effectType: 'passive_activate', skipDamage: true },    // 重装鎧
    '2018': { effectType: 'passive_activate', skipDamage: true },    // 大賢者の魔力
    '2025': { effectType: 'passive_activate', skipDamage: true },    // 十字軍の誓い
    '2066': { effectType: 'passive_activate', skipDamage: true },    // 呪いの仮面
    '2069': { effectType: 'passive_activate', skipDamage: true },    // 呪いの偶像
    '2088': { effectType: 'passive_activate', skipDamage: true },    // 幸運のコイン
    '2090': { effectType: 'passive_activate', skipDamage: true },    // 商人の鞄
};

// ─── ユーティリティ ─────────────────────────────────────

/**
 * NPC注入カードの "1003_memberid_xxxxx" から基底ID "1003" を抽出する。
 */
function getBaseCardId(cardId: string): string {
    const match = cardId.match(/^(\d+)/);
    return match ? match[1] : cardId;
}

/**
 * カードの効果情報を取得する。
 * 1. CARD_EFFECT_MAP に明示的な定義があればそれを返す
 * 2. card.effect_id が設定されていれば、それに基づいて推定する
 * 3. どちらもなければ 'attack'（通常攻撃）として返す
 */
export function getCardEffectInfo(card: Card): CardEffectInfo {
    const baseId = getBaseCardId(card.id);

    // 1. 明示的マッピング
    if (CARD_EFFECT_MAP[baseId]) {
        return CARD_EFFECT_MAP[baseId];
    }

    // 2. card.effect_id からの推定
    if (card.effect_id) {
        const selfBuffIds: string[] = ['atk_up', 'def_up', 'regen', 'stun_immune'];
        const isSelfBuff = selfBuffIds.includes(card.effect_id);
        return {
            effectType: isSelfBuff ? 'buff_self' : 'attack',
            effectId: card.effect_id as StatusEffectId,
            effectDuration: card.effect_duration || 3,
            skipDamage: isSelfBuff,
        };
    }

    // 3. デフォルト: 通常攻撃
    return { effectType: 'attack' };
}
