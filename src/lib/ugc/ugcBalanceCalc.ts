/**
 * UGC System v2 — TP/NP/PB バランス計算エンジン
 * @module ugcBalanceCalc
 *
 * エネミーTP、NPC NP、クエスト報酬PBの計算を統合的に提供する。
 * クライアントサイドでもサーバーサイドでも使用可能（純関数）。
 */

// ── TP（脅威度ポイント）計算 — エネミー ──────────────────────────────────────

export interface TpInput {
  level: number;
  hp: number;
  atk: number;
  def: number;
  skills: string[];
}

export interface TpBreakdown {
  hp: { value: number; cost: number };
  atk: { value: number; cost: number };
  def: { value: number; cost: number };
  skills: { count: number; aoe_count: number; drain_vit_count: number; cost: number };
}

export interface BalanceResult {
  total_points: number;
  consumed_points: number;
  remaining_points: number;
  is_valid: boolean;
  breakdown: Record<string, { value?: number; count?: number; cost: number }>;
}

/** AoE系スキル（TP 20コスト） */
const AOE_SKILLS = new Set([
  'fireball', 'ice_storm', 'thunder_storm', 'aoe_slash',
  'earthquake', 'whirlwind',
]);

/** VIT吸収スキル（TP 30コスト） */
const DRAIN_VIT_SKILLS = new Set(['drain_vit', 'life_drain']);

/**
 * エネミーのTP上限を計算する
 */
export function calcEnemyTpTotal(level: number): number {
  return 10 + level * 5;
}

/**
 * エネミーのTP消費を計算する
 */
export function calcEnemyTpConsumed(input: TpInput): TpBreakdown {
  const hpCost = input.hp; // HP +1 = 1 TP
  const atkCost = input.atk * 2; // ATK +1 = 2 TP
  const defCost = input.def * 2; // DEF +1 = 2 TP

  let skillCost = 0;
  let aoeCount = 0;
  let drainVitCount = 0;

  for (const skill of input.skills) {
    if (AOE_SKILLS.has(skill)) {
      skillCost += 20;
      aoeCount++;
    } else if (DRAIN_VIT_SKILLS.has(skill)) {
      skillCost += 30;
      drainVitCount++;
    }
    // その他スキル = 0 TP
  }

  return {
    hp: { value: input.hp, cost: hpCost },
    atk: { value: input.atk, cost: atkCost },
    def: { value: input.def, cost: defCost },
    skills: { count: input.skills.length, aoe_count: aoeCount, drain_vit_count: drainVitCount, cost: skillCost },
  };
}

/**
 * エネミーTPバランスを計算する
 */
export function calcEnemyTp(input: TpInput): BalanceResult {
  const total = calcEnemyTpTotal(input.level);
  const breakdown = calcEnemyTpConsumed(input);
  const consumed = breakdown.hp.cost + breakdown.atk.cost + breakdown.def.cost + breakdown.skills.cost;

  return {
    total_points: total,
    consumed_points: consumed,
    remaining_points: total - consumed,
    is_valid: consumed <= total,
    breakdown: {
      hp: { value: breakdown.hp.value, cost: breakdown.hp.cost },
      atk: { value: breakdown.atk.value, cost: breakdown.atk.cost },
      def: { value: breakdown.def.value, cost: breakdown.def.cost },
      skills: { count: breakdown.skills.count, cost: breakdown.skills.cost },
    },
  };
}

// ── NP（NPCポイント）計算 — NPC ─────────────────────────────────────────────

export interface NpInput {
  level: number;
  atk: number;
  def: number;
  durability: number;
  cover_rate: number;
  skills: string[];
}

/**
 * NPCのNP上限を計算する
 */
export function calcNpcNpTotal(level: number): number {
  return 10 + level * 5; // TP と同一式
}

/**
 * NPCのNPバランスを計算する
 */
export function calcNpcNp(input: NpInput): BalanceResult {
  const total = calcNpcNpTotal(input.level);

  const atkCost = input.atk * 2;       // ATK +1 = 2 NP
  const defCost = input.def * 2;       // DEF +1 = 2 NP
  const durCost = Math.floor(input.durability / 10); // 耐久度 +10 = 1 NP
  const coverCost = Math.floor(input.cover_rate / 5) * 2; // カバー率 +5% = 2 NP
  const skillCost = input.skills.length * 3; // スキル1つ = 3 NP

  const consumed = atkCost + defCost + durCost + coverCost + skillCost;

  return {
    total_points: total,
    consumed_points: consumed,
    remaining_points: total - consumed,
    is_valid: consumed <= total,
    breakdown: {
      atk: { value: input.atk, cost: atkCost },
      def: { value: input.def, cost: defCost },
      durability: { value: input.durability, cost: durCost },
      cover_rate: { value: input.cover_rate, cost: coverCost },
      skills: { count: input.skills.length, cost: skillCost },
    },
  };
}

// ── PB（パワーバジェット）計算 — クエスト報酬 ─────────────────────────────────

export interface PbRewardItem {
  type: 'consumable' | 'trade_good';
  heal_hp?: number;
  cure_status?: boolean;
}

export interface PbRewardSkill {
  power: number;
  ap_cost: number;
  effect_id: string;
}

export interface PbInput {
  rec_level: number;
  battle_count: number;
  node_count: number;
  items?: PbRewardItem[];
  skill_card?: PbRewardSkill | null;
}

/**
 * クエストのパワーバジェット上限を計算する
 */
export function calcPbTotal(recLevel: number, battleCount: number, nodeCount: number): number {
  return recLevel * 2 + battleCount * 5 + nodeCount * 1;
}

/** スキル効果ボーナス */
const EFFECT_BONUS: Record<string, number> = {
  attack: 0,
  pierce_attack: 0,
  multi_attack: 8,
  heal: 3,
  buff_self: 5,
  buff_party: 5,
  debuff_enemy: 5,
  aoe_attack: 8,
};

/** AP コストによるディスカウント */
function apDiscount(apCost: number): number {
  if (apCost >= 4) return -3;
  if (apCost === 3) return -1;
  if (apCost === 2) return 0;
  return 5; // ap_cost <= 1 → ペナルティ +5
}

/**
 * スキルカードのパワーコストを計算する
 */
export function calcSkillPowerCost(skill: PbRewardSkill): number {
  const effectB = EFFECT_BONUS[skill.effect_id] ?? 0;
  const apD = apDiscount(skill.ap_cost);
  return Math.max(0, skill.power + effectB + apD);
}

/**
 * アイテムのパワーコストを計算する
 */
export function calcItemPowerCost(item: PbRewardItem): number {
  if (item.heal_hp) {
    return Math.ceil(item.heal_hp / 10);
  }
  if (item.cure_status) {
    return 5;
  }
  // trade_good
  return 3;
}

/**
 * クエスト報酬のPBバランスを計算する
 */
export function calcQuestPb(input: PbInput): BalanceResult {
  const total = calcPbTotal(input.rec_level, input.battle_count, input.node_count);

  const itemCosts: { index: number; cost: number }[] = [];
  let totalItemCost = 0;
  if (input.items) {
    for (let i = 0; i < input.items.length; i++) {
      const cost = calcItemPowerCost(input.items[i]);
      itemCosts.push({ index: i, cost });
      totalItemCost += cost;
    }
  }

  let skillCost = 0;
  if (input.skill_card) {
    skillCost = calcSkillPowerCost(input.skill_card);
  }

  const consumed = totalItemCost + skillCost;

  return {
    total_points: total,
    consumed_points: consumed,
    remaining_points: total - consumed,
    is_valid: consumed <= total,
    breakdown: {
      items: { count: itemCosts.length, cost: totalItemCost },
      skill_card: { count: input.skill_card ? 1 : 0, cost: skillCost },
    },
  };
}
