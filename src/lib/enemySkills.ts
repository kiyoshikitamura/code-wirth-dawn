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
  skill_heavy_blow:   { id: 2002, slug: 'skill_heavy_blow',   name: '強打',           effect_type: 'damage', value: 1.5, description: '敵に強力な物理ダメージを与える' },
  skill_arrow:        { id: 2003, slug: 'skill_arrow',        name: '矢を射る',       effect_type: 'damage', value: 1, description: '敵を遠隔から攻撃する' },
  skill_fireball:     { id: 2004, slug: 'skill_fireball',     name: '火の玉',         effect_type: 'damage', value: 1, description: '敵に炎のダメージを与える' },
  skill_dark_flare:   { id: 2005, slug: 'skill_dark_flare',   name: 'ダークフレア',   effect_type: 'damage', value: 2, description: '強力な闇の魔法ダメージ' },
  // v2.9.3h: 毒付与に修正（旧: damage value:1 → damage_poison）
  skill_poison_attack: { id: 2006, slug: 'skill_poison_attack', name: '毒針',         effect_type: 'damage_poison', value: 1, description: '敵にダメージを与え毒(3T)を付与する' },
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

  // ─── v2.9.3h: 状態異常付きスキル ──────────────────
  skill_poison_breath:  { id: 2020, slug: 'skill_poison_breath',  name: '毒の息',       effect_type: 'damage_poison', value: 1, description: '毒の塊を吐き出しダメージと毒(3T)を付与する' },
  skill_thunder_strike: { id: 2021, slug: 'skill_thunder_strike', name: '雷撃',         effect_type: 'damage_stun', value: 2, description: '雷を落とし大ダメージとスタン(1T)を与える' },
  skill_sand_blind:     { id: 2022, slug: 'skill_sand_blind',     name: '砂塵',         effect_type: 'damage_blind', value: 1, description: '砂を巻き上げダメージと目潰し(2T)を付与する' },
  skill_claw_rend:      { id: 2023, slug: 'skill_claw_rend',      name: '裂傷の爪',     effect_type: 'damage_bleed', value: 1, description: '鋭い爪で引き裂きダメージと出血(2T)を付与する' },
  skill_charm:          { id: 2024, slug: 'skill_charm',          name: '魅惑の歌',     effect_type: 'damage_stun', value: 1, description: '妖艶な歌で魅了しスタン(1T)を与える' },
  skill_petrify_gaze:   { id: 2025, slug: 'skill_petrify_gaze',   name: '石化の視線',   effect_type: 'damage_stun', value: 2, description: '石化の視線でダメージとスタン(1T)を与える' },
  skill_soul_drain:     { id: 2026, slug: 'skill_soul_drain',     name: '魂抜き',       effect_type: 'drain_vit', value: 1, description: '魂を引き抜き寿命を奪う' },
  skill_regenerate:     { id: 2027, slug: 'skill_regenerate',     name: '強力再生',     effect_type: 'heal', value: 100, description: '強力な再生能力でHPを大きく回復する' },
  // ─── v2.9.3h: 自己バフ / デバフスキル ─────────────
  skill_war_cry:        { id: 2030, slug: 'skill_war_cry',        name: '雄叫び',       effect_type: 'buff_self_atk', value: 0, description: '雄叫びを上げて攻撃力を高める(ATK UP 3T)' },
  skill_curse:          { id: 2031, slug: 'skill_curse',          name: '呪詛',         effect_type: 'debuff_atk_down', value: 0, description: '呪いの言葉で攻撃力を奪う(ATK DOWN 2T)' },
  skill_armor_break:    { id: 2032, slug: 'skill_armor_break',    name: '鎧砕き',       effect_type: 'debuff_def_down', value: 0, description: '防具を叩き壊し防御力を下げる(DEF DOWN 2T)' },

  // ─── enemy_actions.csv にあるがスキル定義CSVにない（フォールバック用） ─
  skill_attack:       { id: 9001, slug: 'skill_attack',       name: '通常攻撃',     effect_type: 'damage', value: 1, description: '基本的な物理攻撃' },
  skill_heavy_attack: { id: 9002, slug: 'skill_heavy_attack', name: '強攻撃',       effect_type: 'damage', value: 1.5, description: '力を込めた攻撃' },
  // typo in CSV (skill_poision_attack → skill_poison_attack へマップ)
  skill_poision_attack: { id: 2006, slug: 'skill_poison_attack', name: '毒針', effect_type: 'damage_poison', value: 1, description: '毒を帯びた攻撃' },
};

/**
 * スキルslugからスキル定義を取得するヘルパー
 * 存在しないslugの場合はフォールバック（通常攻撃）を返す
 */
export function getEnemySkill(slug: string): EnemySkillMaster {
  return ENEMY_SKILL_MAP[slug] || ENEMY_SKILL_MAP['skill_attack'];
}
