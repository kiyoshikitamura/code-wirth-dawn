import { SupabaseClient } from '@supabase/supabase-js';
import { getShareText, getFlavor } from './shareTextLoader';

/**
 * 号外システム共通ユーティリティ
 * 
 * - トリガー発火チェック＋登録（重複防止）
 * - 称号Tier判定
 * - share_data構築ヘルパー
 */

// ─── 称号Tier定義（character.ts のTITLES配列と同期） ───
const TITLE_TIER_MAP: Record<string, string> = {
    // Tier S (P50-45)
    '光輝の守護聖者': 'S', '終末の覇王': 'S', '天秤の調停者': 'S',
    '嵐の解放者': 'S', '不滅の古豪': 'S', '神話の富豪': 'S',
    // Tier A (P44-37)
    '聖騎士': 'A', '暗黒卿': 'A', '義賊': 'A', '冷徹な執行者': 'A',
    '黄金の暴君': 'A', '清廉の騎士団長': 'A', '戦乙女': 'A', '魔女': 'A',
    // Tier B (P36-29)
    '法の番人': 'B', '混沌の使徒': 'B', '英雄': 'B', '悪鬼': 'B',
    '秩序の盾': 'B', '自由の刃': 'B', '善なる剣': 'B', '暗き牙': 'B',
    // Tier C (P28-19)
    '鉄血宰相': 'C', '覇道の王': 'C', '若き天才': 'C', '死に損ないの老兵': 'C',
    '銭ゲバ': 'C', '清貧の聖人': 'C', '流浪の剣聖': 'C', '世捨て人': 'C',
    '鉄の規律': 'C', '嵐を呼ぶ者': 'C',
    // Tier D (P18-11)
    '秩序の信徒': 'D', '自由の風': 'D', '善なる心': 'D', '暗き魂': 'D',
    '灰色の賢者': 'D', '修羅の亡霊': 'D', '傷だらけの守護者': 'D', '壮年の武人': 'D',
    // Tier E (P10-5)
    '正義の見習い': 'E', '小悪党': 'E', '規律ある新兵': 'E', '気ままな旅人': 'E',
    '均衡の旅人': 'E', '貧乏剣士': 'E',
    // Tier F (P4-1)
    '見習い戦士': 'F', '駆け出しの冒険者': 'F', '若き冒険者': 'F', '名もなき旅人': 'F',
};

const TIER_RANK: Record<string, number> = {
    'S': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0,
};

/**
 * 称号名からTierを判定
 */
export function getTitleTier(titleName: string): string {
    return TITLE_TIER_MAP[titleName] || 'F';
}

/**
 * Tier比較（新Tierが旧Tierより上ならtrue）
 */
export function isTierUpgrade(oldTitle: string, newTitle: string): boolean {
    const oldTier = getTitleTier(oldTitle);
    const newTier = getTitleTier(newTitle);
    return (TIER_RANK[newTier] || 0) > (TIER_RANK[oldTier] || 0);
}

/**
 * トリガー発火チェック＋登録（1回/キャラ1回/世代1回用）
 * 
 * 既に発火済みの場合はfalseを返し、未発火ならINSERTしてtrueを返す。
 * 「繰返」トリガーではこの関数を呼ばない（常にシェア可能）。
 * 
 * @returns true = 初回発火（シェアテキストを返すべき）, false = 既に発火済み
 */
export async function checkAndFireTrigger(
    supabase: SupabaseClient,
    userId: string,
    triggerSlug: string,
    triggerKey: string = ''
): Promise<boolean> {
    try {
        const { data } = await supabase
            .from('user_share_triggers')
            .select('trigger_slug')
            .eq('user_id', userId)
            .eq('trigger_slug', triggerSlug)
            .eq('trigger_key', triggerKey)
            .maybeSingle();

        if (data) return false; // 既に発火済み

        // 発火登録
        await supabase.from('user_share_triggers').insert({
            user_id: userId,
            trigger_slug: triggerSlug,
            trigger_key: triggerKey,
        });
        return true;
    } catch (e) {
        console.error(`[ShareUtils] checkAndFireTrigger error (${triggerSlug}/${triggerKey}):`, e);
        return false; // エラー時は発火しない（安全側）
    }
}

/**
 * share_data オブジェクトを構築
 * 
 * APIレスポンスに含める統一フォーマット。
 * フロント側でこの情報からシェアURL + テキストを構築。
 */
export function buildShareData(
    slug: string,
    vars: Record<string, string | number>
): { text: string; slug: string; vars: Record<string, string> } | null {
    const text = getShareText(slug, vars);
    if (!text) return null;

    // vars を全て string に統一（URLパラメータ用）
    const stringVars: Record<string, string> = {};
    for (const [k, v] of Object.entries(vars)) {
        stringVars[k] = String(v);
    }

    return { text, slug, vars: stringVars };
}

/**
 * レベルマイルストーン判定
 * 対象レベル: 10, 20, 30, 40, 50
 */
export const LEVEL_MILESTONES = [10, 20, 30, 40, 50];

/**
 * 所持金マイルストーン判定
 * 対象: 100,000G
 */
export const GOLD_MILESTONES = [100000];

/**
 * 名声閾値
 */
export const FAME_HERO_THRESHOLD = 200;
export const FAME_VILLAIN_THRESHOLD = -200;
export const FAME_BANNED_THRESHOLD = -50;

/**
 * 世代交代時に維持するトリガー（キャラ1回 + 1回）
 * これら以外は世代交代時にDELETEされる。
 */
export const PERSISTENT_TRIGGERS = [
    'main_quest_clear',     // キャラ1回
    'collection_half',      // キャラ1回
    'collection_complete',  // 1回
];
