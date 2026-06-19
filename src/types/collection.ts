/**
 * コレクション（図鑑）機能で使用する共通型定義
 */

// ─── エネミー ───
export interface CollectionEnemyEntry {
    id: number;
    slug: string;
    unlocked: boolean;
    name: string | null;
    level: number | null;
    hp: number | null;
    atk: number | null;
    def: number | null;
    exp_reward: number | null;
    gold_reward: number | null;
    drop_item_name: string | null;
    death_immune?: boolean | null;
}

// ─── アイテム ───
export interface CollectionItemEntry {
    id: number;
    slug: string;
    unlocked: boolean;
    name: string | null;
    type: string;
    sub_type: string | null;
    base_price: number | null;
    effect_data: Record<string, any> | null;
}

// ─── スキル ───
export interface CollectionSkillEntry {
    id: number;
    slug: string;
    unlocked: boolean;
    name: string | null;
    base_price: number | null;
    deck_cost: number | null;
    image_url: string | null;
    card_type: string | null;
    card_ap_cost: number | null;
    card_effect_val: number | null;
    card_description: string | null;
}

// ─── NPC ───
export interface CollectionNpcEntry {
    id: number;
    slug: string;
    unlocked: boolean;
    name: string | null;
    epithet: string | null;
    job_class: string | null;
    level: number | null;
    max_hp: number | null;
    attack: number | null;
    defense: number | null;
    cover_rate: number | null;
    hire_cost: number | null;
    introduction: string | null;
}

// ─── セクション ───
export interface CollectionSection<T> {
    total: number;
    unlocked: number;
    list: T[];
}

// ─── API レスポンス ───
export interface CollectionData {
    enemies: CollectionSection<CollectionEnemyEntry>;
    items: CollectionSection<CollectionItemEntry>;
    skills: CollectionSection<CollectionSkillEntry>;
    npcs: CollectionSection<CollectionNpcEntry>;
    share_data_list?: ShareDataItem[];
}

// ─── シェアデータ ───
export interface ShareDataItem {
    slug: string;
    text: string;
    vars: Record<string, string>;
}
