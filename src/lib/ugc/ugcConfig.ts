/**
 * UGC System v2 — 設定・Feature Flag・定数
 * @module ugcConfig
 */

// ── Feature Flag ──────────────────────────────────────────────────────────────
export const UGC_ENABLED = process.env.NEXT_PUBLIC_UGC_ENABLED === 'true';

// ── テンプレートバージョン ────────────────────────────────────────────────────
export const UGC_TEMPLATE_VERSION = '1.0';
export const UGC_TEMPLATE_MARKER = 'wirth-dawn-ugc';

// ── ファイルサイズ上限 ────────────────────────────────────────────────────────
export const UGC_TEMPLATE_MAX_SIZE = 200 * 1024; // 200KB
export const UGC_IMAGE_MAX_SIZE = 2 * 1024 * 1024; // 2MB
export const UGC_BGM_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const UGC_SE_MAX_SIZE = 1 * 1024 * 1024; // 1MB

// ── 画像解像度上限 ───────────────────────────────────────────────────────────
export const UGC_IMAGE_MAX_RESOLUTION = 1024;

// ── ストレージ容量（バイト） ──────────────────────────────────────────────────
export const UGC_STORAGE_LIMITS = {
  free: 10 * 1024 * 1024,    // 10MB
  basic: 50 * 1024 * 1024,   // 50MB
  premium: 200 * 1024 * 1024, // 200MB
} as const;

// ── Subscription Tier 型 ─────────────────────────────────────────────────────
export type SubscriptionTier = 'free' | 'basic' | 'premium';

// ── レートリミット ───────────────────────────────────────────────────────────
export const UGC_RATE_LIMITS: Record<SubscriptionTier, {
  publish: number;
  save: number;
  import: number;
}> = {
  free:    { publish: 1,  save: 5,   import: 10  },
  basic:   { publish: 3,  save: 15,  import: 30  },
  premium: { publish: 10, save: 50,  import: 100 },
};

// ── アセット枠 ──────────────────────────────────────────────────────────────
export const UGC_ASSET_LIMITS: Record<SubscriptionTier, {
  published: number;
  drafts: number;
  enemies: number;
  items: number;
  cards: number;
  npcs: number;
}> = {
  free:    { published: 1,  drafts: 5,   enemies: 5,  items: 5,  cards: 5,  npcs: 5  },
  basic:   { published: 5,  drafts: 10,  enemies: 20, items: 20, cards: 20, npcs: 20 },
  premium: { published: 30, drafts: 50,  enemies: -1, items: -1, cards: -1, npcs: -1 },
};

// ── ゴールドによる枠追加コスト ───────────────────────────────────────────────
export const UGC_GOLD_COSTS = {
  extra_draft_slot: 2000,      // 下書き枠 +1: 2,000G
  extra_published_slot: 10000, // 公開枠 +1: 10,000G
  extra_daily_import: 2000,    // 1日のインポート回数 +5: 2,000G（当日限り）
} as const;

// ── オーディオ枠 ─────────────────────────────────────────────────────────────
export const UGC_AUDIO_LIMITS = {
  bgm_per_quest: 3,
  se_per_quest: 5,
};

// ── 報酬制限 ─────────────────────────────────────────────────────────────────
export const UGC_REWARD_LIMITS = {
  max_items: 3,          // 最大報酬アイテム数
  max_skill_cards: 1,    // 最大報酬スキルカード数
  fixed_gold: 50,        // UGCクエスト固定ゴールド報酬
  fixed_exp: 30,         // UGCクエスト固定EXP報酬
  max_skill_power: 25,   // スキルカード最大power
};

// ── レベル制限 ───────────────────────────────────────────────────────────────
export const UGC_MIN_PLAY_LEVEL = 5; // UGCクエスト受注最低レベル

// ── テンプレートタイプ ───────────────────────────────────────────────────────
export const UGC_TEMPLATE_TYPES = [
  'quest', 'enemy', 'item', 'skill_card', 'npc',
] as const;
export type UgcTemplateType = typeof UGC_TEMPLATE_TYPES[number];

// ── シナリオタイプ ───────────────────────────────────────────────────────────
export const UGC_SCENARIO_TYPES = [
  'Subjugation', 'Delivery', 'Politics', 'Dungeon', 'Other',
] as const;

// ── ノードタイプ ─────────────────────────────────────────────────────────────
export const UGC_NODE_TYPES = [
  'text', 'battle', 'npc_join', 'npc_leave',
  'delivery', 'random_branch', 'trap', 'success', 'failure',
] as const;
export type UgcNodeType = typeof UGC_NODE_TYPES[number];

// ── 許可されたスキル効果 ─────────────────────────────────────────────────────
export const UGC_ALLOWED_SKILL_EFFECTS = [
  'attack', 'pierce_attack', 'multi_attack', 'heal',
  'buff_self', 'buff_party', 'debuff_enemy', 'aoe_attack',
] as const;

// ── 禁止されたスキル効果 ─────────────────────────────────────────────────────
export const UGC_FORBIDDEN_SKILL_EFFECTS = [
  'instakill', 'recoil_attack', 'escape', 'taunt', 'support_activate',
] as const;

// ── 許可された ugc:// ディレクトリ ────────────────────────────────────────────
export const UGC_ALLOWED_ASSET_PREFIXES = [
  'images/enemies/',
  'images/items/',
  'images/cards/',
  'images/npcs/',
  'images/scenarios/',
  'audio/bgm/',
  'audio/se/',
] as const;

// ── ステータス定義 ───────────────────────────────────────────────────────────
export const UGC_STATUSES = ['draft', 'pending_review', 'published', 'rejected'] as const;
export type UgcStatus = typeof UGC_STATUSES[number];
