/**
 * UGC System v2 — ユニットテスト: バランス計算
 */
import { describe, it, expect } from 'vitest';
import {
  calcEnemyTp,
  calcEnemyTpTotal,
  calcNpcNp,
  calcNpcNpTotal,
  calcQuestPb,
  calcPbTotal,
  calcSkillPowerCost,
  calcItemPowerCost,
} from '../ugcBalanceCalc';

// ── TP（エネミー） ──────────────────────────────────────────────────────────

describe('calcEnemyTpTotal', () => {
  it('Lv1 → 15', () => expect(calcEnemyTpTotal(1)).toBe(15));
  it('Lv5 → 35', () => expect(calcEnemyTpTotal(5)).toBe(35));
  it('Lv10 → 60', () => expect(calcEnemyTpTotal(10)).toBe(60));
  it('Lv30 → 160', () => expect(calcEnemyTpTotal(30)).toBe(160));
});

describe('calcEnemyTp', () => {
  it('通常エネミー（TP内）', () => {
    const result = calcEnemyTp({
      level: 10, hp: 30, atk: 5, def: 3, skills: ['tackle'],
    });
    // 30 + 10 + 6 + 0 = 46 ≤ 60
    expect(result.is_valid).toBe(true);
    expect(result.total_points).toBe(60);
    expect(result.consumed_points).toBe(46);
  });

  it('AoEスキル持ちエネミー', () => {
    const result = calcEnemyTp({
      level: 10, hp: 10, atk: 3, def: 2, skills: ['fireball'],
    });
    // 10 + 6 + 4 + 20 = 40 ≤ 60
    expect(result.is_valid).toBe(true);
    expect(result.consumed_points).toBe(40);
  });

  it('TP超過エネミー', () => {
    const result = calcEnemyTp({
      level: 5, hp: 200, atk: 12, def: 8, skills: [],
    });
    // 200 + 24 + 16 = 240 > 35
    expect(result.is_valid).toBe(false);
    expect(result.consumed_points).toBe(240);
    expect(result.total_points).toBe(35);
  });

  it('VIT吸収スキルは30TP', () => {
    const result = calcEnemyTp({
      level: 50, hp: 10, atk: 5, def: 5, skills: ['drain_vit'],
    });
    // 10 + 10 + 10 + 30 = 60 ≤ 260
    expect(result.is_valid).toBe(true);
    expect(result.breakdown.skills.cost).toBe(30);
  });
});

// ── NP（NPC） ───────────────────────────────────────────────────────────────

describe('calcNpcNpTotal', () => {
  it('Lv5 → 35', () => expect(calcNpcNpTotal(5)).toBe(35));
  it('Lv12 → 70', () => expect(calcNpcNpTotal(12)).toBe(70));
});

describe('calcNpcNp', () => {
  it('仕様書の例: Lv12 NPC (NP48 ≤ 70)', () => {
    const result = calcNpcNp({
      level: 12, atk: 8, def: 5, durability: 100, cover_rate: 15,
      skills: ['arrow', 'double_slash'],
    });
    // ATK: 16, DEF: 10, DUR: 10, COV: 6, SKILL: 6 = 48
    expect(result.consumed_points).toBe(48);
    expect(result.total_points).toBe(70);
    expect(result.is_valid).toBe(true);
  });

  it('NP超過NPC', () => {
    const result = calcNpcNp({
      level: 5, atk: 15, def: 10, durability: 200, cover_rate: 30,
      skills: ['a', 'b', 'c', 'd', 'e'],
    });
    // ATK: 30, DEF: 20, DUR: 20, COV: 12, SKILL: 15 = 97 > 35
    expect(result.is_valid).toBe(false);
  });
});

// ── PB（クエスト報酬） ──────────────────────────────────────────────────────

describe('calcPbTotal', () => {
  it('Lv5, battle=1, nodes=4 → 19', () => {
    expect(calcPbTotal(5, 1, 4)).toBe(19);
  });

  it('Lv10, battle=2, nodes=8 → 38', () => {
    expect(calcPbTotal(10, 2, 8)).toBe(38);
  });

  it('Lv30, battle=3, nodes=15 → 90', () => {
    expect(calcPbTotal(30, 3, 15)).toBe(90);
  });
});

describe('calcItemPowerCost', () => {
  it('HP80回復 → 8PC', () => {
    expect(calcItemPowerCost({ type: 'consumable', heal_hp: 80 })).toBe(8);
  });

  it('ステータス回復 → 5PC', () => {
    expect(calcItemPowerCost({ type: 'consumable', cure_status: true })).toBe(5);
  });

  it('換金素材 → 3PC', () => {
    expect(calcItemPowerCost({ type: 'trade_good' })).toBe(3);
  });
});

describe('calcSkillPowerCost', () => {
  it('attack, power=12, ap=3 → 12 + 0 - 1 = 11', () => {
    expect(calcSkillPowerCost({ power: 12, ap_cost: 3, effect_id: 'attack' })).toBe(11);
  });

  it('aoe_attack, power=20, ap=2 → 20 + 8 + 0 = 28', () => {
    expect(calcSkillPowerCost({ power: 20, ap_cost: 2, effect_id: 'aoe_attack' })).toBe(28);
  });

  it('heal, power=10, ap=1 → 10 + 3 + 5 = 18 (低コストペナルティ)', () => {
    expect(calcSkillPowerCost({ power: 10, ap_cost: 1, effect_id: 'heal' })).toBe(18);
  });

  it('buff_self, power=5, ap=4 → 5 + 5 - 3 = 7', () => {
    expect(calcSkillPowerCost({ power: 5, ap_cost: 4, effect_id: 'buff_self' })).toBe(7);
  });
});

describe('calcQuestPb', () => {
  it('PB内の報酬', () => {
    const result = calcQuestPb({
      rec_level: 10, battle_count: 2, node_count: 8,
      items: [{ type: 'consumable', heal_hp: 80 }],
      skill_card: { power: 12, ap_cost: 3, effect_id: 'attack' },
    });
    // PB = 38, items = 8, skill = 11, total = 19 ≤ 38
    expect(result.is_valid).toBe(true);
    expect(result.consumed_points).toBe(19);
  });

  it('PB超過の報酬', () => {
    const result = calcQuestPb({
      rec_level: 5, battle_count: 1, node_count: 3,
      items: [{ type: 'consumable', heal_hp: 150 }],
      skill_card: { power: 20, ap_cost: 2, effect_id: 'aoe_attack' },
    });
    // PB = 18, items = 15, skill = 28, total = 43 > 18
    expect(result.is_valid).toBe(false);
  });
});
