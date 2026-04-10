/**
 * カード効果分岐エンジン (v19: Passive→Support移行)
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
    | 'support_activate'; // v19: Supportカード使用（バトル内永続バフを付与）

export interface CardEffectInfo {
    effectType: CardEffectType;
    effectId?: StatusEffectId;    // 付与する状態異常ID
    effectDuration?: number;      // 効果持続ターン数
    healAmount?: number;          // 回復量（heal用、effect_valと別途指定時）
    skipDamage?: boolean;         // true = 敵へのダメージ計算をスキップ
}

// ─── カードID → 効果マッピング (新ID体系: 1-60) ────────────

/**
 * cards.csv の id (数値部) をキーに、そのカードの効果を定義する。
 * ここに定義がないカードはデフォルトで 'attack' として扱う。
 */
const CARD_EFFECT_MAP: Record<string, CardEffectInfo> = {
    // ─── 汎用スキル (1-10) ────────────────────
    '4':  { effectType: 'buff_self', effectId: 'def_up', effectDuration: 2, skipDamage: true },     // 防御
    '5':  { effectType: 'heal', skipDamage: true },                                                  // 応急手当
    '6':  { effectType: 'attack', effectId: 'stun', effectDuration: 1 },                             // シールドバッシュ
    '7':  { effectType: 'support_activate', skipDamage: true },                                      // 集中 (ATK UP)
    '8':  { effectType: 'support_activate', skipDamage: true },                                      // クイックステップ (回避UP)
    '9':  { effectType: 'taunt', effectId: 'taunt', effectDuration: 2, skipDamage: true },           // 挑発

    // ─── ローラン聖帝国 (11-15) ──────────────
    '13': { effectType: 'heal', skipDamage: true },                                                  // 祈り (全体リジェネ)
    '14': { effectType: 'heal', skipDamage: true },                                                  // 治癒
    '15': { effectType: 'buff_party', effectId: 'def_up', effectDuration: 2, skipDamage: true },     // 聖壁 (全体バリア)

    // ─── マルカンド (16-20) ──────────────────
    '16': { effectType: 'debuff_enemy', effectId: 'bind' as StatusEffectId, effectDuration: 2, skipDamage: true }, // 砂の罠
    '17': { effectType: 'debuff_enemy', effectId: 'blind' as StatusEffectId, effectDuration: 2, skipDamage: true }, // 砂塵
    '18': { effectType: 'attack', effectId: 'poison', effectDuration: 3 },                           // 毒刃
    '19': { effectType: 'buff_party', effectId: 'evasion_up' as StatusEffectId, effectDuration: 2, skipDamage: true }, // 蜃気楼
    '20': { effectType: 'heal', skipDamage: true },                                                  // オアシスの水

    // ─── 夜刀神国 (21-25) ────────────────────
    '23': { effectType: 'debuff_enemy', effectId: 'stun', effectDuration: 1, skipDamage: true },     // 影縫い
    '24': { effectType: 'heal', skipDamage: true },                                                  // 清め

    // ─── 華龍神朝 (26-30) ────────────────────
    '26': { effectType: 'heal', skipDamage: true },                                                  // 氣の癒やし
    '27': { effectType: 'debuff_enemy', effectId: 'atk_down' as StatusEffectId, effectDuration: 2, skipDamage: true }, // 龍の咆哮
    '28': { effectType: 'buff_self', effectId: 'def_up', effectDuration: 3, skipDamage: true },      // 鉄布衫

    // ─── NPC専用 (31-55) ─────────────────────
    '31': { effectType: 'buff_party', effectId: 'def_up', effectDuration: 3, skipDamage: true },     // 王の城壁
    '32': { effectType: 'aoe_attack' },                                                              // ドラゴンダイブ
    '33': { effectType: 'heal', skipDamage: true },                                                  // 奇跡
    '34': { effectType: 'taunt', effectId: 'taunt', effectDuration: 3, skipDamage: true },           // 皇帝の盾
    '35': { effectType: 'buff_self', effectId: 'stun_immune', effectDuration: 2, skipDamage: true }, // 絶対防御
    '37': { effectType: 'aoe_attack', effectId: 'burn' as StatusEffectId, effectDuration: 2 },       // メテオストライク
    '38': { effectType: 'heal', skipDamage: true },                                                  // 完全治癒
    '39': { effectType: 'aoe_attack', effectId: 'blind' as StatusEffectId, effectDuration: 1 },      // ホーリーノヴァ
    '42': { effectType: 'support_activate', skipDamage: true },                                      // 血の怒り (ATK大UP代償あり)
    '43': { effectType: 'buff_party', effectId: 'atk_up', effectDuration: 3, skipDamage: true },     // 獅子の心
    '44': { effectType: 'buff_party', effectId: 'spd_up' as StatusEffectId, effectDuration: 2, skipDamage: true }, // 疾風術
    '45': { effectType: 'aoe_attack', effectId: 'stun', effectDuration: 1 },                         // 岩砕き
    '49': { effectType: 'aoe_attack', effectId: 'curse' as StatusEffectId, effectDuration: 2 },      // 黒曜球
    '54': { effectType: 'aoe_attack', effectId: 'bleed' as StatusEffectId, effectDuration: 2 },      // 死の舞踊
    '55': { effectType: 'debuff_enemy', effectId: 'freeze' as StatusEffectId, effectDuration: 2, skipDamage: true }, // 時止め

    // ─── 闇市 (56-60) ────────────────────────
    '56': { effectType: 'attack', effectId: 'drain' as StatusEffectId },                              // 吸血
    '57': { effectType: 'support_activate', skipDamage: true },                                      // 闇の代償 (AP全回復)
    '59': { effectType: 'support_activate', skipDamage: true },                                      // 狂戦士の薬
    '60': { effectType: 'aoe_attack' },                                                              // 魂の生贄
};

// ─── ユーティリティ ─────────────────────────────────────

/**
 * NPC注入カードの "14_memberid_xxxxx" から基底ID "14" を抽出する。
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

    // 3. card.type / name からの推定 (v8.5 フォールバック強化)
    if (card.type === 'Defense' || card.name.includes('防御') || card.name.includes('鉄壁')) {
        return { effectType: 'buff_self', effectId: 'def_up', effectDuration: card.effect_duration || 2, skipDamage: true };
    }
    if (card.type === 'Heal' || card.name.includes('回復') || card.name.includes('ヒール')) {
        return { effectType: 'heal', skipDamage: true };
    }
    if (card.type === 'Support') {
        return { effectType: 'support_activate', skipDamage: true };
    }

    // 4. デフォルト: 通常攻撃
    return { effectType: 'attack' };
}
