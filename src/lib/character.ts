import { UserProfile } from '@/types/game';

// 称号の定義
type TitleDef = {
    name: string;
    condition: (p: UserProfile) => boolean;
    priority: number;
};

const TITLES: TitleDef[] = [
    // 複合属性 (優先度高)
    { name: '聖騎士', condition: (p) => p.order_pts > 50 && p.justice_pts > 50, priority: 10 },
    { name: '暗黒卿', condition: (p) => p.chaos_pts > 50 && p.evil_pts > 50, priority: 10 },
    { name: '義賊', condition: (p) => p.chaos_pts > 30 && p.justice_pts > 30, priority: 8 },
    { name: '冷徹な執行者', condition: (p) => p.order_pts > 30 && p.evil_pts > 30, priority: 8 },

    // 単一属性 (優先度中)
    { name: '法の番人', condition: (p) => p.order_pts > 80, priority: 5 },
    { name: '混沌の使徒', condition: (p) => p.chaos_pts > 80, priority: 5 },
    { name: '英雄', condition: (p) => p.justice_pts > 80, priority: 5 },
    { name: '悪鬼', condition: (p) => p.evil_pts > 80, priority: 5 },

    // 初心者・その他 (優先度低)
    { name: '駆け出しの冒険者', condition: (p) => p.level !== undefined && p.level <= 3, priority: 1 },
    { name: '名もなき旅人', condition: () => true, priority: 0 },
];

/**
 * プロフィールに基づいて最適な称号を算出する
 */
export function calculateTitle(profile: UserProfile): string {
    // 条件を満たすもののうち、優先度が最も高いものを探す
    // 同じ優先度なら先に定義されたもの勝ち（あるいはランダムなど拡張可）
    let bestTitle = '名もなき旅人';
    let maxPriority = -1;

    for (const t of TITLES) {
        if (t.condition(profile)) {
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
