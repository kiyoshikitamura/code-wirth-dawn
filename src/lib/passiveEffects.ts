/**
 * パッシブ効果エンジン
 * 
 * cards.csv の type='Passive' カードの効果を定義・集計する。
 * 方式A: 手札からAPを消費して使用 → そのバトル内で永続効果。
 * バトル外パッシブ（地図、リュック等）は装備中に常時発動。
 */

import { Card } from '@/types/game';

// ─── バトル中パッシブ修正値 ─────────────────────────────

export interface BattlePassiveModifiers {
    evasionBonus: number;      // 回避率加算(%)  (砂漠の外套)
    physResistPct: number;     // 物理ダメ軽減(%) (重装鎧)
    magicDmgPct: number;       // 魔法威力UP(%)  (大賢者の魔力)
    atkUpPct: number;          // ATK UP(%)      (十字軍の誓い, 呪いの仮面)
    critBonus: number;         // クリティカル率(%) (幸運のコイン)
    goldDropPct: number;       // ゴールドドロップ率UP(%) (商人の鞄)
    slipDamage: number;        // 毎ターン自傷HP (呪いの仮面)
    noiseInjection: number;    // ノイズ追加枚数 (呪いの偶像)
}

// ─── バトル外パッシブ修正値 ─────────────────────────────

export interface TravelPassiveModifiers {
    eventAvoidPct: number;     // イベント回避率UP(%) (詳細な地図)
    itemDropPct: number;       // アイテムドロップ率UP(%) (旅人のリュック)
    campRecoveryPct: number;   // 野営回復量UP(%) (サバイバル)
}

// ─── カードID → パッシブ効果マッピング ────────────────────

type PassiveData = Partial<BattlePassiveModifiers & TravelPassiveModifiers> & { label: string };

const PASSIVE_MAP: Record<string, PassiveData> = {
    '2006': { label: '砂漠の外套: 回避+15%',       evasionBonus: 15 },
    '2007': { label: '重装鎧: 物理軽減20%',         physResistPct: 20 },
    '2018': { label: '大賢者の魔力: 魔法威力+30%',  magicDmgPct: 30 },
    '2025': { label: '十字軍の誓い: ATK+10%',       atkUpPct: 10 },
    '2066': { label: '呪いの仮面: ATK+25%, HP-5/T', atkUpPct: 25, slipDamage: 5 },
    '2069': { label: '呪いの偶像: ノイズ+2枚',      noiseInjection: 2 },
    '2088': { label: '幸運のコイン: Crit+15%',      critBonus: 15 },
    '2090': { label: '商人の鞄: Gold+30%',          goldDropPct: 30 },
    '2091': { label: '旅人のリュック: Drop+20%',    itemDropPct: 20 },
    '2092': { label: 'サバイバル: 野営回復+50%',    campRecoveryPct: 50 },
    '2093': { label: '詳細な地図: エンカウント回避+25%', eventAvoidPct: 25 },
};

// ─── デフォルト値 ───────────────────────────────────────

const DEFAULT_BATTLE: BattlePassiveModifiers = {
    evasionBonus: 0, physResistPct: 0, magicDmgPct: 0,
    atkUpPct: 0, critBonus: 0, goldDropPct: 0,
    slipDamage: 0, noiseInjection: 0,
};

const DEFAULT_TRAVEL: TravelPassiveModifiers = {
    eventAvoidPct: 0, itemDropPct: 0, campRecoveryPct: 0,
};

// ─── 集計関数 ───────────────────────────────────────────

/**
 * getBaseCardId: NPC注入カードの "2006_member_xxx" から "2006" を抽出
 */
function getBaseId(cardId: string): string {
    const m = cardId.match(/^(\d+)/);
    return m ? m[1] : cardId;
}

/**
 * アクティブなPassiveカードID配列から、バトル中パッシブ修正値を合算して返す。
 * 方式A: activePassives に登録された（使用済みの）PassiveカードIDのリストを渡す。
 */
export function aggregateBattlePassives(activePassiveIds: string[]): BattlePassiveModifiers {
    const result = { ...DEFAULT_BATTLE };
    for (const id of activePassiveIds) {
        const base = getBaseId(id);
        const data = PASSIVE_MAP[base];
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
 * 装備中のスキルのカードID配列から、バトル外パッシブ修正値を合算して返す。
 * move/route.ts 等から呼ばれる。
 */
export function getTravelPassives(equippedCardIds: string[]): TravelPassiveModifiers {
    const result = { ...DEFAULT_TRAVEL };
    for (const id of equippedCardIds) {
        const base = getBaseId(id);
        const data = PASSIVE_MAP[base];
        if (!data) continue;
        result.eventAvoidPct += data.eventAvoidPct || 0;
        result.itemDropPct += data.itemDropPct || 0;
        result.campRecoveryPct += data.campRecoveryPct || 0;
    }
    return result;
}

/**
 * PassiveカードのID（基底ID）からラベル文字列を取得する。
 * バトルログ出力用。
 */
export function getPassiveLabel(cardId: string): string {
    const base = getBaseId(cardId);
    return PASSIVE_MAP[base]?.label || 'パッシブ効果';
}

/**
 * 指定カードが呪いの偶像かどうか判定する。
 * buildBattleDeck でノイズ注入の判定に使う。
 */
export function getNoiseInjectionCount(passiveCards: Card[]): number {
    let count = 0;
    for (const card of passiveCards) {
        const base = getBaseId(card.id);
        const data = PASSIVE_MAP[base];
        if (data?.noiseInjection) count += data.noiseInjection;
    }
    return count;
}
