/**
 * UGC System v2 — 公式/UGC 統合レイヤー
 * @module ugcResolver
 *
 * 既存の公式データ参照コードと UGC データを統合的に扱うためのヘルパー群。
 * バトル開始時のエネミー解決、クエスト完了時の報酬処理などで使用する。
 */

import { resolveUgcUrl, isUgcPath } from './ugcAssetUrl';
import { UGC_REWARD_LIMITS } from './ugcConfig';
import type { Enemy, PartyMember } from '@/types/game';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = { from: (table: string) => any };

// ── UGC エネミー → 既存 Enemy 型変換 ────────────────────────────────────────

export interface UgcEnemyRow {
  id: string;
  name: string;
  level: number;
  hp: number;
  atk: number;
  def: number;
  skills: string[];
  action_pattern: Array<{ skill: string; prob: number; condition?: string }>;
  image_url: string | null;
  flavor_text: string | null;
  creator_id: string;
}

/**
 * ugc_enemies のレコードを既存の Enemy インターフェースに変換する
 */
export function resolveUgcEnemy(row: UgcEnemyRow): Enemy {
  const imageUrl = row.image_url && isUgcPath(row.image_url)
    ? resolveUgcUrl(row.image_url, row.creator_id)
    : (row.image_url || undefined);

  return {
    id: row.id,
    name: row.name,
    level: row.level,
    hp: row.hp,
    maxHp: row.hp,
    def: row.def,
    image_url: imageUrl,
    traits: [],
    action_pattern: row.action_pattern || [],
  };
}

// ── UGC NPC → 既存 PartyMember 型変換 ───────────────────────────────────────

export interface UgcNpcRow {
  id: string;
  name: string;
  level: number;
  atk: number;
  def: number;
  durability: number;
  cover_rate: number;
  ai_role: 'striker' | 'guardian' | 'medic';
  signature_skills: string[];
  image_url: string | null;
  creator_id: string;
}

/**
 * ugc_npcs のレコードを既存の PartyMember インターフェースに変換する
 */
export function resolveUgcNpc(row: UgcNpcRow): PartyMember {
  const imageUrl = row.image_url && isUgcPath(row.image_url)
    ? resolveUgcUrl(row.image_url, row.creator_id)
    : (row.image_url || undefined);

  return {
    id: row.id,
    owner_id: '',
    name: row.name,
    gender: 'Unknown',
    origin: 'system',
    origin_type: 'ugc_npc',
    job_class: 'Adventurer',
    durability: row.durability,
    max_durability: row.durability,
    atk: row.atk,
    def: row.def,
    cover_rate: row.cover_rate,
    loyalty: 100,
    image_url: imageUrl,
    inject_cards: [],
    is_active: true,
    ai_role: row.ai_role,
    ai_grade: 'random',
  };
}

// ── UGC クエスト完了報酬生成 ────────────────────────────────────────────────

export interface UgcQuestRewards {
  fixed_gold: number;
  fixed_exp: number;
  custom_items: Array<{
    ugc_item_id: string;
    name: string;
    type: string;
    description: string;
    effect_data?: unknown;
    rarity: string;
    image_url?: string;
  }>;
  custom_skill: {
    ugc_card_id: string;
    name: string;
    power: number;
    ap_cost: number;
    target_type: string;
    effect_id: string;
    description: string;
    image_url?: string;
  } | null;
}

/**
 * UGCクエスト完了時の報酬を構築する。
 * 固定ゴールド/EXP + カスタムアイテム/スキルを返す。
 */
export async function buildUgcRewards(
  supabase: SupabaseClient,
  scenarioId: string,
  creatorId: string
): Promise<UgcQuestRewards> {
  const rewards: UgcQuestRewards = {
    fixed_gold: UGC_REWARD_LIMITS.fixed_gold,
    fixed_exp: UGC_REWARD_LIMITS.fixed_exp,
    custom_items: [],
    custom_skill: null,
  };

  // UGCシナリオの報酬定義を取得
  const { data: scenario } = await supabase
    .from('ugc_scenarios')
    .select('rewards')
    .eq('id', scenarioId)
    .single();

  if (!scenario?.rewards) return rewards;

  const rewardDef = scenario.rewards as {
    items?: Array<{ name: string; type: string; description: string; effect_data?: unknown; rarity: string; image_url?: string }>;
    skill_card?: { name: string; power: number; ap_cost: number; target_type: string; effect_id: string; description: string; image_url?: string };
  };

  // カスタムアイテム
  if (rewardDef.items) {
    // ugc_items から該当アイテムを取得
    const { data: items } = await supabase
      .from('ugc_items')
      .select('id, name, type, description, effect_data, rarity, image_url')
      .eq('scenario_id', scenarioId);

    if (items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rewards.custom_items = items.map((item: any) => ({
        ugc_item_id: item.id,
        name: item.name,
        type: item.type,
        description: item.description || '',
        effect_data: item.effect_data,
        rarity: item.rarity,
        image_url: item.image_url && isUgcPath(item.image_url)
          ? resolveUgcUrl(item.image_url, creatorId)
          : item.image_url || undefined,
      }));
    }
  }

  // カスタムスキル
  if (rewardDef.skill_card) {
    const { data: card } = await supabase
      .from('ugc_cards')
      .select('id, name, power, ap_cost, target_type, effect_id, description, image_url')
      .eq('scenario_id', scenarioId)
      .limit(1)
      .single();

    if (card) {
      rewards.custom_skill = {
        ugc_card_id: card.id,
        name: card.name,
        power: card.power,
        ap_cost: card.ap_cost,
        target_type: card.target_type,
        effect_id: card.effect_id,
        description: card.description || '',
        image_url: card.image_url && isUgcPath(card.image_url)
          ? resolveUgcUrl(card.image_url, creatorId)
          : card.image_url || undefined,
      };
    }
  }

  return rewards;
}

// ── BGM/SE キー解決 ─────────────────────────────────────────────────────────

/**
 * BGM/SEキーを解決する。
 * ugc:// → Supabase Storage URL に変換
 * それ以外 → 公式キーとしてそのまま返す
 */
export function resolveBgmKey(key: string | undefined, creatorId: string): string | undefined {
  if (!key) return undefined;
  if (isUgcPath(key)) return resolveUgcUrl(key, creatorId);
  return key; // 公式キー
}
