/**
 * サポートバフエンジン (旧 passiveEffects.ts → v19 リネーム)
 * 
 * cards.csv の type='Support' カードのうちバフ効果を持つものの効果を定義・集計する。
 * 方式A: 手札からAPを消費して使用 → そのバトル内で永続効果。
 * バトル外バフ（地図、リュック等）は装備中に常時発動。
 */

import { Card } from '@/types/game';

// ─── バトル中サポートバフ修正値 ─────────────────────────────

export interface BattleSupportModifiers {
    evasionBonus: number;      // 回避率加算(%)  (クイックステップ)
    physResistPct: number;     // 物理ダメ軽減(%) (防御/鉄布衫)
    magicDmgPct: number;       // 魔法威力UP(%)
    atkUpPct: number;          // ATK UP(%)      (集中, 血の怒り)
    critBonus: number;         // クリティカル率(%)
    goldDropPct: number;       // ゴールドドロップ率UP(%)
    slipDamage: number;        // 毎ターン自傷HP (血の怒りの代償)
    noiseInjection: number;    // ノイズ追加枚数 (廃止: 常に0)
}

// v19 後方互換エイリアス
export type BattlePassiveModifiers = BattleSupportModifiers;

// ─── バトル外サポートバフ修正値 ─────────────────────────────

export interface TravelSupportModifiers {
    eventAvoidPct: number;     // イベント回避率UP(%)
    itemDropPct: number;       // アイテムドロップ率UP(%)
    campRecoveryPct: number;   // 野営回復量UP(%)
}

// v19 後方互換エイリアス
export type TravelPassiveModifiers = TravelSupportModifiers;

// ─── カードID → サポートバフ効果マッピング (新ID体系) ────────

type SupportBuffData = Partial<BattleSupportModifiers & TravelSupportModifiers> & { label: string };

const SUPPORT_BUFF_MAP: Record<string, SupportBuffData> = {
    '7':  { label: '集中: ATK+15%',            atkUpPct: 15 },
    '8':  { label: 'クイックステップ: 回避+15%', evasionBonus: 15 },
    '42': { label: '血の怒り: ATK+25%, HP-5/T', atkUpPct: 25, slipDamage: 5 },
};

// v19 後方互換エイリアス
const PASSIVE_MAP = SUPPORT_BUFF_MAP;

// ─── デフォルト値 ───────────────────────────────────────

const DEFAULT_BATTLE: BattleSupportModifiers = {
    evasionBonus: 0, physResistPct: 0, magicDmgPct: 0,
    atkUpPct: 0, critBonus: 0, goldDropPct: 0,
    slipDamage: 0, noiseInjection: 0,
};

const DEFAULT_TRAVEL: TravelSupportModifiers = {
    eventAvoidPct: 0, itemDropPct: 0, campRecoveryPct: 0,
};

// ─── 集計関数 ───────────────────────────────────────────

/**
 * getBaseCardId: NPC注入カードの "14_member_xxx" から "14" を抽出
 */
function getBaseId(cardId: string): string {
    const m = cardId.match(/^(\d+)/);
    return m ? m[1] : cardId;
}

/**
 * アクティブなSupportバフカードID配列から、バトル中修正値を合算して返す。
 * activeSupportBuffs に登録された（使用済みの）SupportカードIDのリストを渡す。
 */
export function aggregateBattlePassives(activeSupportIds: string[]): BattleSupportModifiers {
    const result = { ...DEFAULT_BATTLE };
    for (const id of activeSupportIds) {
        const base = getBaseId(id);
        const data = SUPPORT_BUFF_MAP[base];
        if (!data) continue;
        result.evasionBonus += data.evasionBonus || 0;
        result.physResistPct += data.physResistPct || 0;
        result.magicDmgPct += data.magicDmgPct || 0;
        result.atkUpPct += data.atkUpPct || 0;
        result.critBonus += data.critBonus || 0;
        result.goldDropPct += data.goldDropPct || 0;
        result.slipDamage += data.slipDamage || 0;
        result.noiseInjection += data.noiseInjection || 0;
    }
    return result;
}

/**
 * 装備中のスキルのカードID配列から、バトル外バフ修正値を合算して返す。
 */
export function getTravelPassives(equippedCardIds: string[]): TravelSupportModifiers {
    const result = { ...DEFAULT_TRAVEL };
    for (const id of equippedCardIds) {
        const base = getBaseId(id);
        const data = SUPPORT_BUFF_MAP[base];
        if (!data) continue;
        result.eventAvoidPct += data.eventAvoidPct || 0;
        result.itemDropPct += data.itemDropPct || 0;
        result.campRecoveryPct += data.campRecoveryPct || 0;
    }
    return result;
}

/**
 * SupportバフカードのID（基底ID）からラベル文字列を取得する。
 * バトルログ出力用。
 */
export function getPassiveLabel(cardId: string): string {
    const base = getBaseId(cardId);
    return SUPPORT_BUFF_MAP[base]?.label || 'サポートバフ効果';
}

/**
 * ノイズ注入カウント (v19: 呪いの偶像廃止のため常に0を返す)
 */
export function getNoiseInjectionCount(_passiveCards: Card[]): number {
    return 0;
}
