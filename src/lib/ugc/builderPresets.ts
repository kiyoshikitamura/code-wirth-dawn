// UGC Quest Builder - Preset Data Constants
// Phase 1: All preset definitions for enemies, items, backgrounds, and BGM

import type { PresetEnemy, PresetRewardItem, BuilderBgOption, BuilderBgmOption } from '@/types/builder';

// ────────────────────────────────────────────
// PRESET_ENEMIES (24 entries, 4 categories)
// ────────────────────────────────────────────

export const PRESET_ENEMIES: PresetEnemy[] = [
  // ── Beginner (Lv 1-8) ──
  {
    id: 'preset_slime',
    name: 'スライム',
    category: 'beginner',
    baseLevel: 1,
    hp: 20,
    atk: 10,
    def: 1,
    skills: ['skill_tackle'],
    actionPattern: [
      { skill: 'skill_tackle', prob: 100 },
    ],
    description: '最も弱い魔物。初心者向けの練習相手。',
  },
  {
    id: 'preset_goblin',
    name: 'ゴブリン',
    category: 'beginner',
    baseLevel: 2,
    hp: 30,
    atk: 14,
    def: 2,
    skills: ['skill_tackle', 'skill_arrow'],
    actionPattern: [
      { skill: 'skill_tackle', prob: 60 },
      { skill: 'skill_arrow', prob: 40 },
    ],
    description: '小柄だが狡猾な魔物。弓を持つこともある。',
  },
  {
    id: 'preset_wild_dog',
    name: '野犬',
    category: 'beginner',
    baseLevel: 3,
    hp: 35,
    atk: 16,
    def: 1,
    skills: ['skill_tackle', 'skill_claw_rend'],
    actionPattern: [
      { skill: 'skill_tackle', prob: 50 },
      { skill: 'skill_claw_rend', prob: 50 },
    ],
    description: '飢えた野犬の群れ。素早い攻撃が特徴。',
  },
  {
    id: 'preset_skeleton',
    name: 'スケルトン',
    category: 'beginner',
    baseLevel: 4,
    hp: 45,
    atk: 22,
    def: 3,
    skills: ['skill_tackle', 'skill_poison_attack'],
    actionPattern: [
      { skill: 'skill_tackle', prob: 65 },
      { skill: 'skill_poison_attack', prob: 35 },
    ],
    description: '動く骸骨。毒を帯びた攻撃を仕掛けてくる。',
  },
  {
    id: 'preset_bandit',
    name: 'ならず者',
    category: 'beginner',
    baseLevel: 5,
    hp: 60,
    atk: 28,
    def: 3,
    skills: ['skill_heavy_blow', 'skill_arrow'],
    actionPattern: [
      { skill: 'skill_heavy_blow', prob: 55 },
      { skill: 'skill_arrow', prob: 45 },
    ],
    description: '街道を荒らす盗賊。武器の扱いに長ける。',
  },
  {
    id: 'preset_giant_bear',
    name: '大熊',
    category: 'beginner',
    baseLevel: 8,
    hp: 150,
    atk: 48,
    def: 5,
    skills: ['skill_heavy_blow', 'skill_war_cry'],
    actionPattern: [
      { skill: 'skill_heavy_blow', prob: 70 },
      { skill: 'skill_war_cry', prob: 30 },
    ],
    description: '森に棲む巨大な熊。一撃が重い。',
  },

  // ── Intermediate (Lv 9-16) ──
  {
    id: 'preset_zombie',
    name: 'ゾンビ',
    category: 'intermediate',
    baseLevel: 9,
    hp: 100,
    atk: 40,
    def: 5,
    skills: ['skill_tackle', 'skill_poison_attack'],
    actionPattern: [
      { skill: 'skill_tackle', prob: 55 },
      { skill: 'skill_poison_attack', prob: 45 },
    ],
    description: '腐敗した死体が蘇った魔物。毒の爪を持つ。',
  },
  {
    id: 'preset_ghost_knight',
    name: '亡霊騎士',
    category: 'intermediate',
    baseLevel: 10,
    hp: 120,
    atk: 42,
    def: 10,
    skills: ['skill_heavy_blow', 'skill_counter_stance'],
    actionPattern: [
      { skill: 'skill_heavy_blow', prob: 60 },
      { skill: 'skill_counter_stance', prob: 40 },
    ],
    description: '滅びた騎士の亡霊。鎧の防御力が高い。',
  },
  {
    id: 'preset_hobgoblin',
    name: 'ホブゴブリン',
    category: 'intermediate',
    baseLevel: 10,
    hp: 120,
    atk: 42,
    def: 8,
    skills: ['skill_heavy_blow', 'skill_heal_minor'],
    actionPattern: [
      { skill: 'skill_heavy_blow', prob: 65 },
      { skill: 'skill_heal_minor', prob: 35, condition: 'hp_under:50' },
    ],
    description: 'ゴブリンの上位種。回復術を使いこなす。',
  },
  {
    id: 'preset_assassin',
    name: '暗殺者',
    category: 'intermediate',
    baseLevel: 12,
    hp: 110,
    atk: 45,
    def: 5,
    skills: ['skill_assassinate', 'skill_poison_attack'],
    actionPattern: [
      { skill: 'skill_assassinate', prob: 50 },
      { skill: 'skill_poison_attack', prob: 50 },
    ],
    description: '闇に潜む殺し屋。暗殺術と毒を駆使する。',
  },
  {
    id: 'preset_sand_worm',
    name: 'サンドワーム',
    category: 'intermediate',
    baseLevel: 14,
    hp: 180,
    atk: 45,
    def: 5,
    skills: ['skill_heavy_blow', 'skill_fireball'],
    actionPattern: [
      { skill: 'skill_heavy_blow', prob: 55 },
      { skill: 'skill_fireball', prob: 45 },
    ],
    description: '砂漠に棲む巨大な蟲。炎を吐くこともある。',
  },
  {
    id: 'preset_gargoyle',
    name: 'ガーゴイル',
    category: 'intermediate',
    baseLevel: 12,
    hp: 150,
    atk: 45,
    def: 25,
    skills: ['skill_tackle', 'skill_heal_self'],
    actionPattern: [
      { skill: 'skill_tackle', prob: 65 },
      { skill: 'skill_heal_self', prob: 35, condition: 'hp_under:50' },
    ],
    description: '石像が動き出した魔物。高い防御力と自己回復を持つ。',
  },

  // ── Advanced (Lv 17-30) ──
  {
    id: 'preset_witch',
    name: '魔女',
    category: 'advanced',
    baseLevel: 15,
    hp: 100,
    atk: 60,
    def: 5,
    skills: ['skill_fireball', 'skill_curse', 'skill_poison_breath'],
    actionPattern: [
      { skill: 'skill_fireball', prob: 40 },
      { skill: 'skill_curse', prob: 30 },
      { skill: 'skill_poison_breath', prob: 30 },
    ],
    description: '禁忌の術を操る魔女。多彩な魔法攻撃を持つ。',
  },
  {
    id: 'preset_fox_spirit',
    name: '妖狐',
    category: 'advanced',
    baseLevel: 15,
    hp: 140,
    atk: 50,
    def: 5,
    skills: ['skill_charm', 'skill_fireball'],
    actionPattern: [
      { skill: 'skill_charm', prob: 40 },
      { skill: 'skill_fireball', prob: 60 },
    ],
    description: '人を惑わす狐の妖怪。魅了と炎を操る。',
  },
  {
    id: 'preset_terracotta',
    name: '兵馬俑',
    category: 'advanced',
    baseLevel: 18,
    hp: 200,
    atk: 60,
    def: 20,
    skills: ['skill_heavy_blow', 'skill_armor_break'],
    actionPattern: [
      { skill: 'skill_heavy_blow', prob: 55 },
      { skill: 'skill_armor_break', prob: 45 },
    ],
    description: '古代の戦士像。高い防御力と装甲破壊を持つ。',
  },
  {
    id: 'preset_tengu',
    name: '天狗',
    category: 'advanced',
    baseLevel: 16,
    hp: 160,
    atk: 55,
    def: 8,
    skills: ['skill_heavy_blow', 'skill_dark_flare'],
    actionPattern: [
      { skill: 'skill_heavy_blow', prob: 50 },
      { skill: 'skill_dark_flare', prob: 50 },
    ],
    description: '山に棲む妖怪。強力な物理攻撃と闇の炎を使う。',
  },
  {
    id: 'preset_djinn',
    name: '魔人',
    category: 'advanced',
    baseLevel: 18,
    hp: 240,
    atk: 70,
    def: 10,
    skills: ['skill_dark_flare', 'skill_heal_self'],
    actionPattern: [
      { skill: 'skill_dark_flare', prob: 65 },
      { skill: 'skill_heal_self', prob: 35, condition: 'hp_under:50' },
    ],
    description: '異界から召喚された魔人。闇の魔法と回復を操る。',
  },
  {
    id: 'preset_red_ogre',
    name: '赤鬼',
    category: 'advanced',
    baseLevel: 24,
    hp: 500,
    atk: 110,
    def: 15,
    skills: ['skill_berserk_rage', 'skill_war_cry'],
    actionPattern: [
      { skill: 'skill_berserk_rage', prob: 60 },
      { skill: 'skill_war_cry', prob: 40 },
    ],
    description: '凶暴な赤鬼。狂暴化すると手がつけられない。',
  },

  // ── Boss (Lv 15-30) ──
  {
    id: 'preset_boss_skeleton_king',
    name: '骸骨王',
    category: 'boss',
    baseLevel: 15,
    hp: 500,
    atk: 55,
    def: 10,
    skills: ['skill_heavy_blow', 'skill_dark_flare', 'skill_heal_self'],
    actionPattern: [
      { skill: 'skill_heavy_blow', prob: 40 },
      { skill: 'skill_dark_flare', prob: 35 },
      { skill: 'skill_heal_self', prob: 25, condition: 'hp_under:50' },
    ],
    description: '骸骨の王。闇の魔法と自己回復で長期戦を仕掛ける。',
  },
  {
    id: 'preset_boss_pirate',
    name: '海賊船長',
    category: 'boss',
    baseLevel: 18,
    hp: 450,
    atk: 65,
    def: 10,
    skills: ['skill_heavy_blow', 'skill_arrow', 'skill_war_cry'],
    actionPattern: [
      { skill: 'skill_heavy_blow', prob: 40 },
      { skill: 'skill_arrow', prob: 30 },
      { skill: 'skill_war_cry', prob: 30 },
    ],
    description: '荒海を支配する海賊の首領。多彩な戦い方をする。',
  },
  {
    id: 'preset_boss_ronin',
    name: '剣豪',
    category: 'boss',
    baseLevel: 20,
    hp: 350,
    atk: 75,
    def: 5,
    skills: ['skill_assassinate', 'skill_counter_stance'],
    actionPattern: [
      { skill: 'skill_assassinate', prob: 55 },
      { skill: 'skill_counter_stance', prob: 45 },
    ],
    description: '一刀のもとに敵を斬り伏せる剣の達人。',
  },
  {
    id: 'preset_boss_golem',
    name: 'ゴーレム王',
    category: 'boss',
    baseLevel: 22,
    hp: 700,
    atk: 50,
    def: 25,
    skills: ['skill_heavy_blow', 'skill_armor_break', 'skill_heal_self'],
    actionPattern: [
      { skill: 'skill_heavy_blow', prob: 40 },
      { skill: 'skill_armor_break', prob: 30 },
      { skill: 'skill_heal_self', prob: 30, condition: 'hp_under:40' },
    ],
    description: '巨大な岩の巨人の王。驚異的な耐久力を持つ。',
  },
  {
    id: 'preset_boss_dragon',
    name: 'ドラゴン',
    category: 'boss',
    baseLevel: 28,
    hp: 900,
    atk: 85,
    def: 18,
    skills: ['skill_dragon_breath', 'skill_berserk_rage', 'skill_heal_self'],
    actionPattern: [
      { skill: 'skill_dragon_breath', prob: 45 },
      { skill: 'skill_berserk_rage', prob: 30 },
      { skill: 'skill_heal_self', prob: 25, condition: 'hp_under:30' },
    ],
    description: '最強の幻獣。ブレス攻撃と狂暴化が脅威。',
  },
  {
    id: 'preset_boss_demon',
    name: '魔王',
    category: 'boss',
    baseLevel: 30,
    hp: 1500,
    atk: 90,
    def: 20,
    skills: ['skill_dark_flare', 'skill_dragon_breath', 'skill_curse', 'skill_heal_self'],
    actionPattern: [
      { skill: 'skill_dark_flare', prob: 30 },
      { skill: 'skill_dragon_breath', prob: 25 },
      { skill: 'skill_curse', prob: 20 },
      { skill: 'skill_heal_self', prob: 25, condition: 'hp_under:40' },
    ],
    description: '全てを統べる魔の王。あらゆる魔法を操る最凶の存在。',
  },
];

// ────────────────────────────────────────────
// PRESET_REWARD_ITEMS (12 entries)
// ────────────────────────────────────────────

export const PRESET_REWARD_ITEMS: PresetRewardItem[] = [
  // Consumables (8)
  {
    slug: 'item_potion_s',
    name: '傷薬',
    type: 'consumable',
    effect_summary: 'HP50回復',
    power_cost: 5,
  },
  {
    slug: 'item_potion',
    name: '高級傷薬',
    type: 'consumable',
    effect_summary: 'HP100回復',
    power_cost: 10,
  },
  {
    slug: 'item_ration',
    name: '携帯保存食',
    type: 'consumable',
    effect_summary: 'HP30回復',
    power_cost: 3,
  },
  {
    slug: 'item_repair_kit',
    name: '応急処置キット',
    type: 'consumable',
    effect_summary: 'HP80回復',
    power_cost: 8,
  },
  {
    slug: 'item_antidote',
    name: '解毒剤',
    type: 'consumable',
    effect_summary: '毒解除',
    power_cost: 5,
  },
  {
    slug: 'item_holy_water',
    name: '聖水',
    type: 'consumable',
    effect_summary: '30ダメージ',
    power_cost: 3,
  },
  {
    slug: 'item_whetstone',
    name: '砥石',
    type: 'consumable',
    effect_summary: 'ATK UP 3T',
    power_cost: 5,
  },
  {
    slug: 'item_smokescreen',
    name: '煙玉',
    type: 'consumable',
    effect_summary: '逃走率70%',
    power_cost: 5,
  },
  // Trade goods (4)
  {
    slug: 'item_trade_iron',
    name: '良質な鉄鉱石',
    type: 'trade_good',
    effect_summary: '交易品',
    power_cost: 3,
  },
  {
    slug: 'item_trade_silk',
    name: '煌びやかな絹織物',
    type: 'trade_good',
    effect_summary: '交易品',
    power_cost: 3,
  },
  {
    slug: 'item_bear_pelt',
    name: '獣の毛皮',
    type: 'trade_good',
    effect_summary: '交易品',
    power_cost: 3,
  },
  {
    slug: 'item_supply_box',
    name: '物資ボックス',
    type: 'trade_good',
    effect_summary: '交易品',
    power_cost: 3,
  },
];

// ────────────────────────────────────────────
// BUILDER_BG_OPTIONS (20 entries)
// ────────────────────────────────────────────

export const BUILDER_BG_OPTIONS: BuilderBgOption[] = [
  // Nature (9)
  { key: 'bg_forest_day',  label: '森（昼）',   category: '自然', icon: '🌲' },
  { key: 'bg_forest_night', label: '森（夜）',  category: '自然', icon: '🌙' },
  { key: 'bg_road_day',    label: '街道（昼）', category: '自然', icon: '🛤️' },
  { key: 'bg_road_night',  label: '街道（夜）', category: '自然', icon: '🌃' },
  { key: 'bg_mountain',    label: '山道',       category: '自然', icon: '⛰️' },
  { key: 'bg_river',       label: '河川',       category: '自然', icon: '🏞️' },
  { key: 'bg_desert',      label: '砂漠',       category: '自然', icon: '🏜️' },
  { key: 'bg_island',      label: '島',         category: '自然', icon: '🏝️' },
  { key: 'bg_wasteland',   label: '荒野',       category: '自然', icon: '🌾' },
  // Building (6)
  { key: 'bg_guild',       label: 'ギルド',     category: '建物', icon: '🏛️' },
  { key: 'bg_tavern_day',  label: '酒場（昼）', category: '建物', icon: '🍺' },
  { key: 'bg_tavern_night', label: '酒場（夜）', category: '建物', icon: '🕯️' },
  { key: 'bg_shop',        label: '商店',       category: '建物', icon: '🏪' },
  { key: 'bg_church',      label: '教会',       category: '建物', icon: '⛪' },
  { key: 'bg_office',      label: '執務室',     category: '建物', icon: '📜' },
  // Military (3)
  { key: 'bg_camp',        label: '野営地',     category: '軍事', icon: '⛺' },
  { key: 'bg_bandit_camp', label: '盗賊野営地', category: '軍事', icon: '🏴' },
  { key: 'bg_fort',        label: '砦',         category: '軍事', icon: '🏰' },
  // Underground (2)
  { key: 'bg_cave',        label: '洞窟',       category: '地下', icon: '🕳️' },
  { key: 'bg_catacombs',   label: '地下墓地',   category: '地下', icon: '💀' },
];

// ────────────────────────────────────────────
// BUILDER_BGM_OPTIONS (15 entries)
// ────────────────────────────────────────────

export const BUILDER_BGM_OPTIONS: BuilderBgmOption[] = [
  // Quest
  { key: 'bgm_quest_calm',    label: '穏やかな旅路',   category: 'クエスト', icon: '🎵' },
  { key: 'bgm_quest_tense',   label: '緊迫',           category: 'クエスト', icon: '🎵' },
  { key: 'bgm_quest_crisis',  label: '危機',           category: 'クエスト', icon: '🎵' },
  { key: 'bgm_quest_mystery', label: '謎',             category: 'クエスト', icon: '🎵' },
  // Battle
  { key: 'bgm_battle',        label: '通常戦闘',       category: '戦闘',     icon: '⚔️' },
  { key: 'bgm_battle_strong', label: '強敵戦闘',       category: '戦闘',     icon: '⚔️' },
  { key: 'bgm_battle_boss',   label: 'ボス戦闘',       category: '戦闘',     icon: '⚔️' },
  // Field
  { key: 'bgm_field',         label: 'フィールド',     category: 'フィールド', icon: '🌍' },
  // Nation
  { key: 'bgm_roland',        label: 'ローラント王国', category: '国家',     icon: '🏰' },
  { key: 'bgm_markand',       label: 'マルカンド商国', category: '国家',     icon: '🏰' },
  { key: 'bgm_yato',          label: '八都連合',       category: '国家',     icon: '🏰' },
  { key: 'bgm_karyu',         label: '華龍帝国',       category: '国家',     icon: '🏰' },
  // Other
  { key: 'bgm_inn',           label: '宿屋',           category: 'その他',   icon: '🏠' },
  { key: 'bgm_collapse',      label: '崩壊',           category: 'その他',   icon: '💥' },
  // None
  { key: '',                   label: 'BGMなし',        category: 'その他',   icon: '🔇' },
];

// ────────────────────────────────────────────
// Helper: Scale enemy stats by target level
// ────────────────────────────────────────────

/**
 * Scale a preset enemy's stats (HP, ATK, DEF) to a target level.
 * Uses a linear ratio based on the preset's base level.
 */
export function scaleEnemyStats(
  preset: PresetEnemy,
  targetLevel: number
): { hp: number; atk: number; def: number } {
  const ratio = targetLevel / Math.max(preset.baseLevel, 1);
  return {
    hp: Math.max(1, Math.round(preset.hp * ratio)),
    atk: Math.max(1, Math.round(preset.atk * ratio)),
    def: Math.max(0, Math.round(preset.def * ratio)),
  };
}
