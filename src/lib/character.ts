import { UserProfile } from '@/types/game';
import { getUserAlignmentPcts, AlignmentPcts } from '@/lib/alignment';

// 称号の定義 — 全50種、一意の優先度（50〜1）でタイブレーク排除
// 条件中の O/C/J/E は対立軸割合(0-100)。50=中立。
type TitleDef = {
    name: string;
    condition: (p: UserProfile, a: AlignmentPcts) => boolean;
    priority: number;
};

// ヘルパー: 中立判定
const isNeutralOC = (a: AlignmentPcts, lo: number, hi: number) => a.order_ratio >= lo && a.order_ratio <= hi;
const isNeutralJE = (a: AlignmentPcts, lo: number, hi: number) => a.justice_ratio >= lo && a.justice_ratio <= hi;

const TITLES: TitleDef[] = [
    // ── Tier S: 伝説称号 (P50-45) ───────────────────────────
    { name: '光輝の守護聖者', priority: 50, condition: (p, a) => a.order_ratio >= 80 && a.justice_ratio >= 80 && (p.level || 1) >= 25 },
    { name: '終末の覇王', priority: 49, condition: (p, a) => a.chaos_ratio >= 80 && a.evil_ratio >= 80 && (p.level || 1) >= 25 },
    { name: '天秤の調停者', priority: 48, condition: (p, a) => a.order_ratio >= 75 && a.evil_ratio >= 75 && (p.level || 1) >= 20 },
    { name: '嵐の解放者', priority: 47, condition: (p, a) => a.chaos_ratio >= 75 && a.justice_ratio >= 75 && (p.level || 1) >= 20 },
    { name: '不滅の古豪', priority: 46, condition: (p) => (p.age || 20) >= 55 && (p.level || 1) >= 20 && (p.vitality ?? 100) > 0 },
    { name: '神話の富豪', priority: 45, condition: (p) => (p.gold || 0) >= 300000 && (p.level || 1) >= 20 },

    // ── Tier A: 上位複合 (P44-37) ───────────────────────────
    { name: '聖騎士', priority: 44, condition: (p, a) => a.order_ratio >= 65 && a.justice_ratio >= 65 && (p.level || 1) >= 10 },
    { name: '暗黒卿', priority: 43, condition: (p, a) => a.chaos_ratio >= 65 && a.evil_ratio >= 65 && (p.level || 1) >= 10 },
    { name: '義賊', priority: 42, condition: (p, a) => a.chaos_ratio >= 60 && a.justice_ratio >= 60 && (p.level || 1) >= 8 },
    { name: '冷徹な執行者', priority: 41, condition: (p, a) => a.order_ratio >= 60 && a.evil_ratio >= 60 && (p.level || 1) >= 8 },
    { name: '黄金の暴君', priority: 40, condition: (p, a) => a.evil_ratio >= 60 && (p.gold || 0) >= 100000 && (p.level || 1) >= 12 },
    { name: '清廉の騎士団長', priority: 39, condition: (p, a) => a.order_ratio >= 65 && a.justice_ratio >= 55 && (p.gold || 0) <= 5000 && (p.level || 1) >= 12 },
    { name: '戦乙女', priority: 38, condition: (p, a) => p.gender === 'Female' && a.justice_ratio >= 60 && (p.level || 1) >= 15 },
    { name: '魔女', priority: 37, condition: (p, a) => p.gender === 'Female' && a.evil_ratio >= 65 && (p.level || 1) >= 10 },

    // ── Tier B: アライメント＋レベル帯 (P36-29) ─────────────
    { name: '法の番人', priority: 36, condition: (p, a) => a.order_ratio >= 70 && (p.level || 1) >= 15 },
    { name: '混沌の使徒', priority: 35, condition: (p, a) => a.chaos_ratio >= 70 && (p.level || 1) >= 15 },
    { name: '英雄', priority: 34, condition: (p, a) => a.justice_ratio >= 70 && (p.level || 1) >= 15 },
    { name: '悪鬼', priority: 33, condition: (p, a) => a.evil_ratio >= 70 && (p.level || 1) >= 15 },
    { name: '秩序の盾', priority: 32, condition: (p, a) => a.order_ratio >= 65 && (p.level || 1) >= 10 },
    { name: '自由の刃', priority: 31, condition: (p, a) => a.chaos_ratio >= 65 && (p.level || 1) >= 10 },
    { name: '善なる剣', priority: 30, condition: (p, a) => a.justice_ratio >= 65 && (p.level || 1) >= 10 },
    { name: '暗き牙', priority: 29, condition: (p, a) => a.evil_ratio >= 65 && (p.level || 1) >= 10 },

    // ── Tier C: 特殊複合 (P28-19) ───────────────────────────
    { name: '鉄血宰相', priority: 28, condition: (p, a) => p.gender === 'Male' && a.order_ratio >= 65 && a.evil_ratio >= 55 && (p.level || 1) >= 12 },
    { name: '覇道の王', priority: 27, condition: (p, a) => p.gender === 'Male' && a.chaos_ratio >= 60 && (p.level || 1) >= 20 },
    { name: '若き天才', priority: 26, condition: (p) => (p.age || 20) <= 22 && (p.level || 1) >= 15 },
    { name: '死に損ないの老兵', priority: 25, condition: (p) => (p.age || 20) >= 50 && (p.vitality ?? 100) <= 20 && (p.vitality ?? 100) > 0 && (p.level || 1) >= 8 },
    { name: '銭ゲバ', priority: 24, condition: (p, a) => (p.gold || 0) >= 100000 && a.evil_ratio >= 55 },
    { name: '清貧の聖人', priority: 23, condition: (p, a) => (p.gold || 0) <= 500 && a.justice_ratio >= 65 && (p.level || 1) >= 5 },
    { name: '流浪の剣聖', priority: 22, condition: (p) => (p.accumulated_days || 0) >= 500 && (p.level || 1) >= 12 },
    { name: '世捨て人', priority: 21, condition: (p, a) => (p.gold || 0) <= 200 && a.chaos_ratio >= 60 && (p.level || 1) >= 8 },
    { name: '鉄の規律', priority: 20, condition: (p, a) => a.order_ratio >= 70 && (p.level || 1) >= 20 && (p.gold || 0) >= 30000 },
    { name: '嵐を呼ぶ者', priority: 19, condition: (p, a) => a.chaos_ratio >= 70 && (p.level || 1) >= 20 && (p.gold || 0) >= 30000 },

    // ── Tier D: 中堅アライメント＋レベル (P18-11) ─────────────
    { name: '秩序の信徒', priority: 18, condition: (p, a) => a.order_ratio >= 58 && (p.level || 1) >= 7 },
    { name: '自由の風', priority: 17, condition: (p, a) => a.chaos_ratio >= 58 && (p.level || 1) >= 7 },
    { name: '善なる心', priority: 16, condition: (p, a) => a.justice_ratio >= 58 && (p.level || 1) >= 7 },
    { name: '暗き魂', priority: 15, condition: (p, a) => a.evil_ratio >= 58 && (p.level || 1) >= 7 },
    { name: '灰色の賢者', priority: 14, condition: (p, a) => isNeutralOC(a, 45, 55) && isNeutralJE(a, 45, 55) && (p.level || 1) >= 10 },
    { name: '修羅の亡霊', priority: 13, condition: (p, a) => a.evil_ratio >= 55 && (p.vitality ?? 100) <= 30 && (p.level || 1) >= 8 },
    { name: '傷だらけの守護者', priority: 12, condition: (p, a) => a.justice_ratio >= 55 && (p.vitality ?? 100) <= 30 && (p.level || 1) >= 8 },
    { name: '壮年の武人', priority: 11, condition: (p) => (p.age || 20) >= 35 && (p.level || 1) >= 10 },

    // ── Tier E: 序盤複合 (P10-5) ────────────────────────────
    { name: '正義の見習い', priority: 10, condition: (p, a) => a.justice_ratio >= 53 && (p.level || 1) >= 4 },
    { name: '小悪党', priority: 9, condition: (p, a) => a.evil_ratio >= 53 && (p.level || 1) >= 4 },
    { name: '規律ある新兵', priority: 8, condition: (p, a) => a.order_ratio >= 53 && (p.level || 1) >= 4 },
    { name: '気ままな旅人', priority: 7, condition: (p, a) => a.chaos_ratio >= 53 && (p.level || 1) >= 4 },
    { name: '均衡の旅人', priority: 6, condition: (p, a) => isNeutralOC(a, 46, 54) && isNeutralJE(a, 46, 54) && (p.level || 1) >= 4 },
    { name: '貧乏剣士', priority: 5, condition: (p) => (p.gold || 0) <= 300 && (p.level || 1) >= 4 },

    // ── Tier F: フォールバック (P4-1) ───────────────────────
    { name: '見習い戦士', priority: 4, condition: (p) => (p.level || 1) >= 4 },
    { name: '駆け出しの冒険者', priority: 3, condition: (p) => (p.level || 1) >= 2 },
    { name: '若き冒険者', priority: 2, condition: (p) => (p.level || 1) === 1 },
    { name: '名もなき旅人', priority: 1, condition: () => true },
];

/**
 * プロフィールに基づいて最適な称号を算出する
 * アライメント割合は1回のみ計算し、全50称号の条件に渡す
 */
export function calculateTitle(profile: UserProfile): string {
    const alignment = getUserAlignmentPcts(profile);
    let bestTitle = '名もなき旅人';
    let maxPriority = -1;

    for (const t of TITLES) {
        if (t.condition(profile, alignment)) {
            if (t.priority > maxPriority) {
                maxPriority = t.priority;
                bestTitle = t.name;
            }
        }
    }
    return bestTitle;
}

/**
 * 加齢処理
 * 365日経過で1歳加算し、Vitalityを減少させる
 * @returns 更新されたパラメータのオブジェクト（DB更新用）
 */
export function processAging(currentAge: number, currentVitality: number, accumulatedDays: number, birthDate?: string | null): { age: number, vitality: number, accumulated_days: number, aged: boolean } {
    let newAge = currentAge;
    let newVitality = currentVitality;
    let newDays = accumulatedDays;
    let aged = false;

    // 年齢計算: birth_dateがあれば実年齢を正確に計算、なければcurrentAge + 経過年数で推定
    let calculatedAge: number;
    if (birthDate) {
        const bd = new Date(birthDate);
        const today = new Date();
        calculatedAge = today.getFullYear() - bd.getFullYear();
        const m = today.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) calculatedAge--;
    } else {
        // birth_dateがない旧データ向けフォールバック: currentAge + 累積日数から経過年数を加算
        calculatedAge = currentAge + Math.floor(newDays / 365);
    }

    if (calculatedAge > newAge) {
        const ageDiff = calculatedAge - newAge;
        newAge = calculatedAge;
        // 1歳ごとにVitalityが 2〜5 減少 (ランダム要素を持たせるならここで計算だが、決定論的でもよい)
        // ここでは固定で 3 減らす
        newVitality = Math.max(0, newVitality - (3 * ageDiff));
        aged = true;
    }

    return { age: newAge, vitality: newVitality, accumulated_days: newDays, aged };
}

/**
 * Vitalityの状態判定
 */
export function getVitalityStatus(vitality: number): 'Prime' | 'Twilight' | 'Retired' {
    if (vitality <= 0) return 'Retired';
    if (vitality < 40) return 'Twilight';
    return 'Prime';
}
