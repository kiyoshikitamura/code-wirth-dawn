/**
 * v20: エネミースキルマスター辞書
 * enemy_skills.csv の内容をクライアントサイドで即時解決するための静的マップ。
 * seed_master.ts で DB にシードされるデータと同一内容。
 */

import { EnemySkillMaster } from '@/types/game';

/**
 * スキルslug → スキル定義のマップ
 */
export const ENEMY_SKILL_MAP: Record<string, EnemySkillMaster> = {
  // ─── 基礎スキル ──────────────────────
  skill_tackle:       { id: 2001, slug: 'skill_tackle',       name: '体当たり',       effect_type: 'damage', value: 1, description: '敵に物理ダメージを与える' },
  skill_heavy_blow:   { id: 2002, slug: 'skill_heavy_blow',   name: '強打',           effect_type: 'damage', value: 2, description: '敵に強力な物理ダメージを与える' },
  skill_arrow:        { id: 2003, slug: 'skill_arrow',        name: '矢を射る',       effect_type: 'damage', value: 1, description: '敵を遠隔から攻撃する' },
  skill_fireball:     { id: 2004, slug: 'skill_fireball',     name: '火の玉',         effect_type: 'damage', value: 1, description: '敵に炎のダメージを与える' },
  skill_dark_flare:   { id: 2005, slug: 'skill_dark_flare',   name: 'ダークフレア',   effect_type: 'damage', value: 2, description: '強力な闇の魔法ダメージ' },
  skill_poison_attack: { id: 2006, slug: 'skill_poison_attack', name: '毒針',         effect_type: 'damage', value: 1, description: '敵にダメージを与え毒を付与する' },
  skill_drain_vit:    { id: 2007, slug: 'skill_drain_vit',    name: '生命吸収',       effect_type: 'drain_vit', value: 1, description: '対象の寿命（Vitality）を直接奪う' },
  skill_heal_self:    { id: 2008, slug: 'skill_heal_self',    name: '自己再生',       effect_type: 'heal', value: 50, description: '自身のHPを回復する' },
  skill_heal_minor:   { id: 2009, slug: 'skill_heal_minor',   name: '小回復',         effect_type: 'heal', value: 30, description: '自身のHPを少し回復する' },
  skill_roar:         { id: 2010, slug: 'skill_roar',         name: '咆哮',           effect_type: 'damage', value: 1, description: '全体にダメージを与える' },
  skill_assassinate:  { id: 2011, slug: 'skill_assassinate',  name: '暗殺術',         effect_type: 'damage', value: 3, description: '急所を突く極大ダメージ' },
  skill_holy_ray:     { id: 2012, slug: 'skill_holy_ray',     name: 'ホーリーレイ',   effect_type: 'damage', value: 2, description: '神聖な光でダメージを与える' },
  skill_sand_breath:  { id: 2013, slug: 'skill_sand_breath',  name: '砂のブレス',     effect_type: 'damage', value: 1, description: '砂の塊を吐き出す' },
  skill_katana_slash: { id: 2014, slug: 'skill_katana_slash', name: '居合斬り',       effect_type: 'damage', value: 2, description: '鋭い刀による一撃' },
  skill_dragon_breath: { id: 2015, slug: 'skill_dragon_breath', name: '竜の息吹',     effect_type: 'damage', value: 3, description: '全てを焼き尽くす高威力ダメージ' },

  // ─── 賞金稼ぎ専用 ─────────────────────
  skill_bounty_strike: { id: 2016, slug: 'skill_bounty_strike', name: '処刑の一撃',   effect_type: 'damage', value: 3, description: '賞金首を狙う必殺の一撃' },
  skill_bounty_combo:  { id: 2017, slug: 'skill_bounty_combo',  name: '滅多斬り',     effect_type: 'damage', value: 2, description: '連続で斬りつける' },
  skill_bounty_hunt:   { id: 2018, slug: 'skill_bounty_hunt',   name: '追跡の刃',     effect_type: 'damage', value: 2, description: '逃がさないための鋭い一撃' },

  // ─── クエストボス専用 ──────────────────
  skill_defense_pierce: { id: 2045, slug: 'skill_defense_pierce', name: '防御貫通強打', effect_type: 'damage', value: 5, description: '防御を無視する強打' },
  skill_god_purge:      { id: 2088, slug: 'skill_god_purge',     name: '神の粛清',     effect_type: 'damage', value: 8, description: '大ダメージと全体スタン' },
  skill_god_enrage:     { id: 2099, slug: 'skill_god_enrage',    name: '神の怒り',     effect_type: 'damage', value: 12, description: '発狂時の超絶大ダメージ' },

  // ─── 6000番台ボス専用 ─────────────────
  skill_boss_heal:  { id: 501, slug: 'skill_boss_heal',  name: '暗黒の癒し',   effect_type: 'heal', value: 200, description: '5ターンに一度、自身を大きく回復させる' },
  skill_boss_nuke:  { id: 502, slug: 'skill_boss_nuke',  name: '終焉の息吹',   effect_type: 'damage', value: 50, description: '防御を貫通しうる強烈な全体ダメージ' },
  skill_boss_stun:  { id: 503, slug: 'skill_boss_stun',  name: '咆哮',         effect_type: 'status_effect', value: 1, description: '1ターンの間スタンさせる' },

  // ─── enemy_actions.csv にあるがスキル定義CSVにない（フォールバック用） ─
  skill_attack:       { id: 9001, slug: 'skill_attack',       name: '通常攻撃',     effect_type: 'damage', value: 1, description: '基本的な物理攻撃' },
  skill_heavy_attack: { id: 9002, slug: 'skill_heavy_attack', name: '強攻撃',       effect_type: 'damage', value: 2, description: '力を込めた攻撃' },
  // typo in CSV (skill_poision_attack → skill_poison_attack へマップ)
  skill_poision_attack: { id: 2006, slug: 'skill_poison_attack', name: '毒針', effect_type: 'damage', value: 1, description: '毒を帯びた攻撃' },
};

/**
 * スキルslugからスキル定義を取得するヘルパー
 * 存在しないslugの場合はフォールバック（通常攻撃）を返す
 */
export function getEnemySkill(slug: string): EnemySkillMaster {
  return ENEMY_SKILL_MAP[slug] || ENEMY_SKILL_MAP['skill_attack'];
}
