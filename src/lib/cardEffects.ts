/**
 * カード効果分岐エンジン (v3.0: 全カード効果実装)
 *
 * cards.csv のカードIDから、バトル中の効果タイプを判定する。
 * gameStore.ts の attackEnemy() から呼び出される。
 */

import { Card } from '@/types/game';
import { StatusEffectId } from '@/lib/statusEffects';

// ─── 効果タイプ定義 ──────────────────────────────────────────

export type CardEffectType =
    | 'attack'           // 通常攻撃（デフォルト）
    | 'pierce_attack'    // 貫通攻撃（DEF無視、魔法扱い）
    | 'multi_attack'     // 連撃（2回攻撃）
    | 'instakill'        // 即死攻撃（30%確率でHP=0、失敗時は通常攻撃）
    | 'recoil_attack'    // 全体攻撃+自傷（魂の生贄等）
    | 'heal'             // HP回復
    | 'escape'           // 逃走（バトル終了、報酬なし）
    | 'buff_self'        // 自己バフ（ATK UP, DEF UP等）
    | 'taunt'            // 挑発（敵の攻撃を引きつける）
    | 'buff_party'       // パーティ全体バフ
    | 'aoe_attack'       // 全体攻撃
    | 'debuff_enemy'     // 敵デバフ（毒付与等）
    | 'cure_self'        // 自己の状態異常/デバフ解除
    | 'support_activate';// Supportカード使用（バトル内永続バフ）

export interface CardEffectInfo {
    effectType: CardEffectType;
    effectId?: StatusEffectId;    // 付与する状態異常ID
    effectDuration?: number;      // 効果持続ターン数
    healAmount?: number;          // 回復量（heal用）
    skipDamage?: boolean;         // true = 敵へのダメージ計算をスキップ
    defValue?: number;            // def_up付与時のDEF加算値（提案A）
    postRegen?: boolean;          // heal後にregenを付与するか
    cureType?: 'status' | 'debuff'; // cure_self 時の解除タイプ
}

// ─── カードID → 効果マッピング (cards.csv 全対応) ─────────────

const CARD_EFFECT_MAP: Record<string, CardEffectInfo> = {
    // ─── 汎用スキル (1-10) ────────────────────────────────────────
    // 1: card_strike    → デフォルトattack（マップ定義不要）
    '2':  { effectType: 'attack', effectId: 'bleed_minor', effectDuration: 2 },          // 斬撃（軽微な出血付与）
    // 3: card_thrust    → デフォルトattack（マップ定義不要）
    '4':  { effectType: 'buff_self', effectId: 'def_up', effectDuration: 2, defValue: 10, skipDamage: true },  // 防御
    '5':  { effectType: 'heal', skipDamage: true },                                       // 応急手当
    '6':  { effectType: 'attack', effectId: 'stun', effectDuration: 1 },                  // シールドバッシュ
    '7':  { effectType: 'support_activate', effectId: 'atk_up', effectDuration: 3, skipDamage: true },  // 集中 (ATK UP 3T)
    '8':  { effectType: 'support_activate', effectId: 'evasion_up', effectDuration: 3, skipDamage: true }, // クイックステップ
    '9':  { effectType: 'taunt', effectId: 'taunt', effectDuration: 2, skipDamage: true },// 挑発
    '10': { effectType: 'attack', effectId: 'blind_minor', effectDuration: 2 },           // 投石（軽微な目潰し）

    // ─── ローラン聖帝国 (11-15) ──────────────────────────────────
    // 11: card_holy_sword → attack扱い（DEF貫通は将来実装）
    // 12: card_holy_smite → デフォルトattack
    '13': { effectType: 'heal', effectId: 'regen', effectDuration: 3, postRegen: true, skipDamage: true }, // 祈り（HP回復+リジェネ）
    '14': { effectType: 'heal', skipDamage: true },                                       // 治癒
    '15': { effectType: 'buff_party', effectId: 'def_up', effectDuration: 2, defValue: 20, skipDamage: true }, // 聖壁

    // ─── マルカンド (16-20) ──────────────────────────────────────
    '16': { effectType: 'debuff_enemy', effectId: 'bind', effectDuration: 1, skipDamage: true },   // 砂の罠（拘束）
    '17': { effectType: 'debuff_enemy', effectId: 'blind', effectDuration: 2, skipDamage: true },   // 砂塵（目潰し）
    '18': { effectType: 'attack', effectId: 'poison', effectDuration: 3 },                // 毒刃
    '19': { effectType: 'buff_party', effectId: 'evasion_up', effectDuration: 3, skipDamage: true },// 蜃気楼（回避UP）
    '20': { effectType: 'cure_self', cureType: 'status', skipDamage: true },              // オアシスの水（状態異常解除）

    // ─── 夜刀神国 (21-25) ────────────────────────────────────────
    '21': { effectType: 'attack' },                                                        // ツバメ返し（※counter確認中 → attack扱い）
    '22': { effectType: 'attack', effectId: 'bleed', effectDuration: 2 },                 // クナイ投げ（出血）
    '23': { effectType: 'debuff_enemy', effectId: 'stun', effectDuration: 2, skipDamage: true }, // 影縫い（スタン 2T）
    '24': { effectType: 'cure_self', cureType: 'debuff', skipDamage: true },              // 清め（デバフ解除）
    '25': { effectType: 'attack' },                                                        // 居合斬り（デフォルト高威力）

    // ─── 華龍神朝 (26-30) ────────────────────────────────────────
    '26': { effectType: 'heal', effectId: 'regen', effectDuration: 3, postRegen: true, skipDamage: true }, // 氣の癒やし
    '27': { effectType: 'debuff_enemy', effectId: 'atk_down', effectDuration: 2, skipDamage: true },        // 龍の咆哮（敵ATK DOWN）
    '28': { effectType: 'buff_self', effectId: 'def_up_heavy', effectDuration: 3, defValue: 30, skipDamage: true }, // 鉄布衫
    '29': { effectType: 'multi_attack' },                                                  // 連撃（2回攻撃）
    '30': { effectType: 'pierce_attack' },                                                 // 飛刀（DEF無視貫通）

    // ─── NPC専用 (31-55) ─────────────────────────────────────────
    '31': { effectType: 'buff_party', effectId: 'def_up', effectDuration: 3, defValue: 0, skipDamage: true },  // 王の城壁
    '32': { effectType: 'aoe_attack' },                                                    // ドラゴンダイブ
    '33': { effectType: 'heal', skipDamage: true },                                        // 奇跡
    '34': { effectType: 'taunt', effectId: 'taunt', effectDuration: 3, skipDamage: true }, // 皇帝の盾
    '35': { effectType: 'buff_self', effectId: 'def_up_heavy', effectDuration: 2, defValue: 50, skipDamage: true }, // 絶対防御
    '36': { effectType: 'multi_attack' },                                                  // 百連打
    '37': { effectType: 'aoe_attack', effectId: 'poison', effectDuration: 2 },             // メテオストライク（全体+毒）
    '38': { effectType: 'heal', skipDamage: true },                                        // 完全治癒
    '39': { effectType: 'aoe_attack', effectId: 'blind', effectDuration: 1 },              // ホーリーノヴァ
    '40': { effectType: 'attack', effectId: 'poison', effectDuration: 3 },                 // 暗殺（毒付与）
    '41': { effectType: 'attack' },                                                        // 鬼斬
    '42': { effectType: 'support_activate', effectId: 'atk_up', effectDuration: 3, skipDamage: true }, // 血の怒り (ATK UP 3T)
    '43': { effectType: 'buff_party', effectId: 'atk_up', effectDuration: 3, skipDamage: true }, // 獅子の心
    '44': { effectType: 'buff_party', effectId: 'evasion_up', effectDuration: 2, skipDamage: true }, // 疾風術
    '45': { effectType: 'aoe_attack', effectId: 'stun', effectDuration: 1 },               // 岩砕き
    '46': { effectType: 'attack' },                                                        // 魂裂き
    '47': { effectType: 'attack', effectId: 'blind', effectDuration: 1 },                  // 幻影斬り
    '48': { effectType: 'attack' },                                                        // 天鈴斬
    '49': { effectType: 'aoe_attack', effectId: 'atk_down', effectDuration: 2 },           // 黒曜球（全体ATK DOWN）
    '50': { effectType: 'buff_party', effectId: 'def_up', effectDuration: 2, defValue: 30, skipDamage: true }, // 王室の盾
    '51': { effectType: 'buff_self', effectId: 'def_up', effectDuration: 2, defValue: 40, skipDamage: true }, // 龍の鱗
    '52': { effectType: 'pierce_attack' },                                                 // 虚空斬り（DEF無視）
    '53': { effectType: 'heal', effectId: 'regen', effectDuration: 3, postRegen: true, skipDamage: true }, // 加護の祈り
    '54': { effectType: 'aoe_attack', effectId: 'bleed', effectDuration: 2 },              // 死の舞踊
    '55': { effectType: 'debuff_enemy', effectId: 'stun', effectDuration: 2, skipDamage: true }, // 時止め（スタン）

    // ─── 闇市 (56-60) ─────────────────────────────────────────────
    '56': { effectType: 'attack' },                                                        // 吸血
    '57': { effectType: 'support_activate', skipDamage: true },                            // 闇の代償（AP全回復）
    '58': { effectType: 'instakill' },                                                     // 死殺剣（確率即死）
    '59': { effectType: 'support_activate', skipDamage: true },                            // 狂戦士の薬
    '60': { effectType: 'recoil_attack' },                                                 // 魂の生贄（全体+自傷）
};

// ─── ユーティリティ ─────────────────────────────────────────

function getBaseCardId(cardId: string): string {
    const match = cardId.match(/^(\d+)/);
    return match ? match[1] : cardId;
}

/**
 * カードの効果情報を取得する。
 * 1. CARD_EFFECT_MAP に明示的な定義があればそれを返す
 * 2. card.effect_id が設定されていれば推定する
 * 3. card.type / name からフォールバック
 * 4. デフォルト: 通常攻撃
 */
export function getCardEffectInfo(card: Card): CardEffectInfo {
    const baseId = getBaseCardId(card.id);

    // 1. 明示的マッピング
    if (CARD_EFFECT_MAP[baseId]) {
        return CARD_EFFECT_MAP[baseId];
    }

    // 2. card.effect_id からの推定
    if (card.effect_id) {
        const selfBuffIds: string[] = ['atk_up', 'def_up', 'def_up_heavy', 'regen', 'stun_immune', 'evasion_up'];
        const healIds: string[] = ['cure_status', 'cure_debuff'];
        const isSelfBuff = selfBuffIds.includes(card.effect_id);
        const isHeal = healIds.includes(card.effect_id);
        if (isHeal) return { effectType: 'cure_self', cureType: card.effect_id === 'cure_status' ? 'status' : 'debuff', skipDamage: true };
        return {
            effectType: isSelfBuff ? 'buff_self' : 'attack',
            effectId: card.effect_id as StatusEffectId,
            effectDuration: card.effect_duration || 3,
            skipDamage: isSelfBuff,
        };
    }

    // 3. card.type / name からフォールバック
    if (card.type === 'Defense' || card.name.includes('防御') || card.name.includes('鉄壁')) {
        return { effectType: 'buff_self', effectId: 'def_up', effectDuration: card.effect_duration || 2, defValue: card.power || 10, skipDamage: true };
    }
    if (card.type === 'Heal' || card.name.includes('回復') || card.name.includes('ヒール') || card.name.includes('治癒') || card.name.includes('癒') || card.name.includes('応急')) {
        return { effectType: 'heal', skipDamage: true };
    }
    if (card.type === 'Support') {
        return { effectType: 'support_activate', skipDamage: true };
    }

    // 4. デフォルト: 通常攻撃
    return { effectType: 'attack' };
}
