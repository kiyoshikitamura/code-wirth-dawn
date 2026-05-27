/**
 * 国家定数定義 (v27.0)
 * 4大国家のID、表示名、カラー、属性マッピングを一元管理。
 * HegemonyModal, GlobalStatusBar, API, world-simulation で共有。
 */

export type NationId = 'Roland' | 'Markand' | 'Karyu' | 'Yato';

export interface NationConfig {
    id: NationId;
    /** 短縮日本語名（UI表示用） */
    nameShort: string;
    /** 正式日本語名 */
    nameFull: string;
    /** TailwindCSS背景色クラス */
    color: string;
    /** 対応するアライメント属性 */
    attributeKey: 'order_score' | 'chaos_score' | 'justice_score' | 'evil_score';
}

/**
 * 4大国家の設定マスター
 */
export const NATIONS: readonly NationConfig[] = [
    { id: 'Roland',  nameShort: 'ローランド', nameFull: 'ローランド聖王国', color: 'bg-blue-600',    attributeKey: 'order_score' },
    { id: 'Markand', nameShort: 'マルカンド', nameFull: '砂塵の王国マルカンド', color: 'bg-emerald-600', attributeKey: 'chaos_score' },
    { id: 'Karyu',   nameShort: '華龍神朝',   nameFull: '華龍神朝',         color: 'bg-red-600',     attributeKey: 'evil_score' },
    { id: 'Yato',    nameShort: '夜刀神国',   nameFull: '夜刀神国',         color: 'bg-purple-700',  attributeKey: 'justice_score' },
] as const;

/**
 * NationId → 正式日本語名のマッピング
 */
export const NATION_NAME_MAP: Record<string, string> = Object.fromEntries(
    NATIONS.map(n => [n.id, n.nameFull])
);

/**
 * hegemony API/コンポーネントで使用するデフォルト値（フォールバック）
 */
export const DEFAULT_HEGEMONY = NATIONS.map(n => ({
    name: n.nameShort,
    power: 25,
    locations: 0,
    color: n.color,
}));
