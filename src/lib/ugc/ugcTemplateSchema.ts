/**
 * UGC System v2 — Zod バリデーションスキーマ
 * @module ugcTemplateSchema
 *
 * テンプレートのインポート時にパース結果を検証する。
 * クエスト / エネミー / アイテム / スキルカード / NPC の5種を定義。
 */

import { z } from 'zod';
import {
  UGC_TEMPLATE_VERSION,
  UGC_TEMPLATE_MARKER,
  UGC_SCENARIO_TYPES,
  UGC_NODE_TYPES,
  UGC_ALLOWED_SKILL_EFFECTS,
  UGC_REWARD_LIMITS,
} from './ugcConfig';

// ── 共通ヘッダー ────────────────────────────────────────────────────────────

const TemplateHeaderSchema = z.object({
  $template: z.literal(UGC_TEMPLATE_MARKER).optional(), // JSON のみ
  version: z.literal(UGC_TEMPLATE_VERSION),
  type: z.enum(['quest', 'enemy', 'item', 'skill_card', 'npc']),
});

// ── ugc:// パス（または空文字） ──────────────────────────────────────────────

const UgcImageUrl = z.union([
  z.string().startsWith('ugc://'),
  z.literal(''),
]).optional();

const UgcOrOfficialKey = z.string().optional();

// ── エネミーアクションパターン ────────────────────────────────────────────────

const EnemyActionSchema = z.object({
  skill: z.string(),
  prob: z.number().int().min(1).max(100),
  condition: z.enum(['hp_under_50', 'hp_under_25', 'turn_mod_3', '']).optional(),
});

// ── エネミーデータ ──────────────────────────────────────────────────────────

export const UgcEnemyDataSchema = z.object({
  name: z.string().min(1).max(20),
  level: z.number().int().min(1).max(50),
  hp: z.number().int().min(1).max(9999),
  atk: z.number().int().min(0).max(99),
  def: z.number().int().min(0).max(99),
  skills: z.array(z.string()).max(10).default([]),
  action_pattern: z.array(EnemyActionSchema).max(10).optional(),
  image_url: UgcImageUrl,
  flavor_text: z.string().max(200).optional(),
  asset_type: z.enum(['enemy', 'npc_companion']).default('enemy'),
});

export type UgcEnemyData = z.infer<typeof UgcEnemyDataSchema>;

// ── アイテムデータ ──────────────────────────────────────────────────────────

export const UgcItemDataSchema = z.object({
  name: z.string().min(1).max(20),
  type: z.enum(['consumable', 'trade_good']),
  sub_type: z.string().optional(),
  description: z.string().max(100).default(''),
  base_price: z.literal(1).default(1),
  effect_data: z.object({
    heal_hp: z.number().int().min(1).max(200).optional(),
    cure_status: z.boolean().optional(),
    // restore_vitality は禁止（スキーマに含めない）
  }).optional(),
  rarity: z.enum(['common', 'uncommon', 'rare']).default('common'),
  use_timing: z.enum(['battle', 'field']).optional(),
  image_url: UgcImageUrl,
});

export type UgcItemData = z.infer<typeof UgcItemDataSchema>;

// ── スキルカードデータ ──────────────────────────────────────────────────────

export const UgcSkillCardDataSchema = z.object({
  name: z.string().min(1).max(20),
  power: z.number().int().min(1).max(UGC_REWARD_LIMITS.max_skill_power),
  ap_cost: z.number().int().min(1).max(5),
  target_type: z.enum(['single_enemy', 'all_enemies', 'self', 'single_ally']),
  effect_id: z.enum(UGC_ALLOWED_SKILL_EFFECTS as unknown as [string, ...string[]]),
  effect_duration: z.number().int().min(0).max(3).default(0),
  description: z.string().max(100).default(''),
  image_url: UgcImageUrl,
});

export type UgcSkillCardData = z.infer<typeof UgcSkillCardDataSchema>;

// ── NPCデータ ───────────────────────────────────────────────────────────────

export const UgcNpcDataSchema = z.object({
  name: z.string().min(1).max(20),
  level: z.number().int().min(1).max(50),
  atk: z.number().int().min(0).max(99),
  def: z.number().int().min(0).max(99),
  durability: z.number().int().min(1).max(999),
  cover_rate: z.number().int().min(0).max(100),
  ai_role: z.enum(['striker', 'guardian', 'medic']).default('striker'),
  ai_grade: z.literal('random').default('random'),
  signature_skills: z.array(z.string()).max(5).default([]),
  image_url: UgcImageUrl,
  flavor_text: z.string().max(200).optional(),
  is_escort: z.boolean().default(false), // 護衛対象フラグ
});

export type UgcNpcData = z.infer<typeof UgcNpcDataSchema>;

// ── クエスト報酬 ────────────────────────────────────────────────────────────

const UgcRewardSchema = z.object({
  // 禁止フィールドは SuperRefine で検出
  gold: z.never().optional(),
  exp: z.never().optional(),
  reputation: z.never().optional(),
  alignment_shift: z.never().optional(),

  items: z.array(UgcItemDataSchema).max(UGC_REWARD_LIMITS.max_items).optional(),
  skill_card: UgcSkillCardDataSchema.optional(),
}).optional();

// ── アライメント条件 ────────────────────────────────────────────────────────

const AlignmentConditionSchema = z.object({
  min_align_order_pct: z.number().min(0).max(100).optional(),
  min_align_chaos_pct: z.number().min(0).max(100).optional(),
  min_align_justice_pct: z.number().min(0).max(100).optional(),
  min_align_evil_pct: z.number().min(0).max(100).optional(),
}).optional();

// ── シナリオ選択肢 ──────────────────────────────────────────────────────────

const UgcChoiceSchema = z.object({
  label: z.string().min(1).max(40),
  next: z.string(), // "ノード N" or node id
});

// ── シナリオフローノード ─────────────────────────────────────────────────────

export const UgcFlowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(UGC_NODE_TYPES as unknown as [string, ...string[]]),
  text: z.string().max(2000).default(''),
  speaker_name: z.string().max(20).optional(),
  speaker_image_url: UgcOrOfficialKey,
  bg_key: UgcOrOfficialKey,
  bgm_key: UgcOrOfficialKey,
  se_key: UgcOrOfficialKey,
  choices: z.array(UgcChoiceSchema).max(5).default([]),
  next: z.string().optional(), // 自動進行先
  // バトルノード用
  enemyData: UgcEnemyDataSchema.optional(),
  // NPC加入ノード用
  npcData: UgcNpcDataSchema.optional(),
  // 納品ノード用
  delivery_item: z.string().optional(),
  delivery_count: z.number().int().min(1).optional(),
  // ランダム分岐ノード用
  probability: z.number().int().min(1).max(99).optional(),
  // 罠ノード用
  trap_damage_pct: z.number().int().min(1).max(100).optional(),
});

export type UgcFlowNode = z.infer<typeof UgcFlowNodeSchema>;

// ── クエストテンプレートスキーマ ──────────────────────────────────────────────

export const UgcQuestTemplateSchema = z.object({
  version: z.literal(UGC_TEMPLATE_VERSION),
  type: z.literal('quest'),

  // 基本情報
  title: z.string().min(1).max(30),
  short_description: z.string().min(1).max(40),
  full_description: z.string().max(500).optional(),
  client_name: z.string().max(20).default('謎の依頼人'),
  scenario_type: z.enum(UGC_SCENARIO_TYPES as unknown as [string, ...string[]]).default('Other'),
  difficulty: z.number().int().min(1).max(10).default(1),
  rec_level: z.number().int().min(1).max(50).default(1),
  days_success: z.number().int().min(1).max(10).default(1),
  days_failure: z.number().int().min(1).max(10).default(1),

  // 受注条件
  conditions: AlignmentConditionSchema,

  // 報酬
  rewards: UgcRewardSchema,

  // シナリオフロー
  nodes: z.array(UgcFlowNodeSchema).min(1).max(100),
});

export type UgcQuestTemplate = z.infer<typeof UgcQuestTemplateSchema>;

// ── 個別アセットテンプレートスキーマ ──────────────────────────────────────────

export const UgcEnemyTemplateSchema = z.object({
  $template: z.literal(UGC_TEMPLATE_MARKER).optional(),
  version: z.literal(UGC_TEMPLATE_VERSION),
  type: z.literal('enemy'),
  enemy: UgcEnemyDataSchema,
});

export const UgcItemTemplateSchema = z.object({
  $template: z.literal(UGC_TEMPLATE_MARKER).optional(),
  version: z.literal(UGC_TEMPLATE_VERSION),
  type: z.literal('item'),
  item: UgcItemDataSchema,
});

export const UgcSkillCardTemplateSchema = z.object({
  $template: z.literal(UGC_TEMPLATE_MARKER).optional(),
  version: z.literal(UGC_TEMPLATE_VERSION),
  type: z.literal('skill_card'),
  card: UgcSkillCardDataSchema,
});

export const UgcNpcTemplateSchema = z.object({
  $template: z.literal(UGC_TEMPLATE_MARKER).optional(),
  version: z.literal(UGC_TEMPLATE_VERSION),
  type: z.literal('npc'),
  npc: UgcNpcDataSchema,
});

// ── ユニオン型 ──────────────────────────────────────────────────────────────

export const UgcTemplateSchema = z.discriminatedUnion('type', [
  UgcQuestTemplateSchema,
  UgcEnemyTemplateSchema,
  UgcItemTemplateSchema,
  UgcSkillCardTemplateSchema,
  UgcNpcTemplateSchema,
]);

export type UgcTemplate = z.infer<typeof UgcTemplateSchema>;
