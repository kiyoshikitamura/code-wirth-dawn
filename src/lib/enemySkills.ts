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
  skill_tackle: { id: 2001, slug: 'skill_tackle', name: '体当たり', effect_type: 'damage', value: 1, description: '敵に物理ダメージを与える' },
  skill_heavy_blow: { id: 2002, slug: 'skill_heavy_blow', name: '強打', effect_type: 'damage', value: 2, description: '敵に強力な物理ダメージを与える' },
  skill_arrow: { id: 2003, slug: 'skill_arrow', name: '矢を射る', effect_type: 'damage', value: 1.3, description: '敵を遠隔から攻撃する' },
  skill_fireball: { id: 2004, slug: 'skill_fireball', name: '火の玉', effect_type: 'damage', value: 1.5, description: '敵に炎のダメージを与える' },
  skill_dark_flare: { id: 2005, slug: 'skill_dark_flare', name: 'ダークフレア', effect_type: 'damage', value: 2, description: '強力な闇の魔法ダメージ' },
  skill_poison_attack: { id: 2006, slug: 'skill_poison_attack', name: '毒針', effect_type: 'damage_poison', value: 1.2, description: '敵にダメージを与え毒(3T)を付与する' },
  skill_drain_vit: { id: 2007, slug: 'skill_drain_vit', name: '生命吸収', effect_type: 'drain_vit', value: 1, description: '対象の寿命（Vitality）を直接奪う' },
  skill_heal_self: { id: 2008, slug: 'skill_heal_self', name: '自己再生', effect_type: 'heal', value: 50, description: '自身のHPを回復する' },
  skill_heal_minor: { id: 2009, slug: 'skill_heal_minor', name: '小回復', effect_type: 'heal', value: 30, description: '自身のHPを少し回復する' },
  skill_roar: { id: 2010, slug: 'skill_roar', name: '咆哮', effect_type: 'damage', value: 1.5, description: '全体にダメージを与える' },
  skill_assassinate: { id: 2011, slug: 'skill_assassinate', name: '暗殺術', effect_type: 'damage', value: 3, description: '急所を突く極大ダメージ' },
  skill_holy_ray: { id: 2012, slug: 'skill_holy_ray', name: 'ホーリーレイ', effect_type: 'damage', value: 2, description: '神聖な光でダメージを与える' },
  skill_sand_breath: { id: 2013, slug: 'skill_sand_breath', name: '砂のブレス', effect_type: 'damage', value: 1.3, description: '砂の塊を吐き出す' },
  skill_katana_slash: { id: 2014, slug: 'skill_katana_slash', name: '居合斬り', effect_type: 'damage', value: 2, description: '鋭い刀による一撃' },
  skill_dragon_breath: { id: 2015, slug: 'skill_dragon_breath', name: '竜の息吹', effect_type: 'damage', value: 3, description: '全てを焼き尽くす高威力ダメージ' },
  skill_bounty_strike: { id: 2016, slug: 'skill_bounty_strike', name: '処刑の一撃', effect_type: 'damage', value: 3, description: '賞金首を狙う必殺の一撃' },
  skill_bounty_combo: { id: 2017, slug: 'skill_bounty_combo', name: '滅多斬り', effect_type: 'damage', value: 2, description: '連続で斬りつける' },
  skill_bounty_hunt: { id: 2018, slug: 'skill_bounty_hunt', name: '追跡の刃', effect_type: 'damage', value: 2, description: '逃がさないための鋭い一撃' },
  skill_poison_breath: { id: 2020, slug: 'skill_poison_breath', name: '毒の息', effect_type: 'damage_poison', value: 1, description: '毒の塊を吐き出しダメージと毒(3T)を付与する' },
  skill_thunder_strike: { id: 2021, slug: 'skill_thunder_strike', name: '雷撃', effect_type: 'damage_stun', value: 2, description: '雷を落とし大ダメージとスタン(1T)を与える' },
  skill_sand_blind: { id: 2022, slug: 'skill_sand_blind', name: '砂塵', effect_type: 'damage_blind', value: 1.2, description: '砂を巻き上げダメージと目潰し(2T)を付与する' },
  skill_claw_rend: { id: 2023, slug: 'skill_claw_rend', name: '裂傷の爪', effect_type: 'damage_bleed', value: 1.3, description: '鋭い爪で引き裂きダメージと出血(2T)を付与する' },
  skill_charm: { id: 2024, slug: 'skill_charm', name: '魅惑の歌', effect_type: 'damage_stun', value: 1.2, description: '妖艶な歌で魅了しスタン(1T)を与える' },
  skill_petrify_gaze: { id: 2025, slug: 'skill_petrify_gaze', name: '石化の視線', effect_type: 'damage_stun', value: 2.5, description: '石化の視線でダメージとスタン(1T)を与える' },
  skill_soul_drain: { id: 2026, slug: 'skill_soul_drain', name: '魂抜き', effect_type: 'drain_vit', value: 1, description: '魂を引き抜き寿命を奪う' },
  skill_regenerate: { id: 2027, slug: 'skill_regenerate', name: '強力再生', effect_type: 'heal', value: 100, description: '強力な再生能力でHPを大きく回復する' },
  skill_war_cry: { id: 2030, slug: 'skill_war_cry', name: '雄叫び', effect_type: 'buff_self_atk', value: 0, description: '雄叫びを上げて攻撃力を高める(ATK UP 3T)' },
  skill_curse: { id: 2031, slug: 'skill_curse', name: '呪詛', effect_type: 'debuff_atk_down', value: 0, description: '呪いの言葉で攻撃力を奪う(ATK DOWN 2T)' },
  skill_armor_break: { id: 2032, slug: 'skill_armor_break', name: '鎧砕き', effect_type: 'debuff_def_down', value: 0, description: '防具を叩き壊し防御力を下げる(DEF DOWN 2T)' },
  skill_defense_pierce: { id: 2045, slug: 'skill_defense_pierce', name: '防御貫通強打', effect_type: 'damage', value: 5, description: '防御を無視する強打' },
  skill_god_purge: { id: 2088, slug: 'skill_god_purge', name: '神の粛清', effect_type: 'damage', value: 8, description: '大ダメージと全体スタン' },
  skill_god_enrage: { id: 2099, slug: 'skill_god_enrage', name: '神の怒り', effect_type: 'damage', value: 12, description: '発狂時の超絶大ダメージ' },
  skill_boss_heal: { id: 501, slug: 'skill_boss_heal', name: '暗黒の癒し', effect_type: 'heal', value: 200, description: '5ターンに一度自身を大きく回復する' },
  skill_boss_nuke: { id: 502, slug: 'skill_boss_nuke', name: '終焉の息吹', effect_type: 'damage', value: 6, description: '防御を貫通しうる強烈な全体ダメージ' },
  skill_boss_stun: { id: 503, slug: 'skill_boss_stun', name: '咆哮', effect_type: 'status_effect', value: 1, description: '1ターンの間スタンさせる' },
  skill_enrage: { id: 2033, slug: 'skill_enrage', name: '激昂', effect_type: 'damage', value: 2.5, description: 'HP50%以下で暴走する高威力攻撃' },
  skill_shield_bash: { id: 2034, slug: 'skill_shield_bash', name: 'シールドバッシュ', effect_type: 'damage_stun', value: 1.5, description: '盾で殴りつけスタン(1T)を付与する' },
  skill_multi_strike: { id: 2035, slug: 'skill_multi_strike', name: '連続攻撃', effect_type: 'damage', value: 0.6, description: '2-3回の連続ヒット' },
  skill_death_sentence: { id: 2036, slug: 'skill_death_sentence', name: '死の宣告', effect_type: 'debuff_def_down', value: 0, description: '呪いの力で防御力を大きく下げる(DEF DOWN 3T)' },
  skill_counter_stance: { id: 2037, slug: 'skill_counter_stance', name: '反撃の構え', effect_type: 'buff_self_atk', value: 0, description: '身構えて攻撃力を高める(ATK UP 5T)' },
  skill_aoe_blast: { id: 2038, slug: 'skill_aoe_blast', name: '全体攻撃', effect_type: 'damage', value: 1.5, description: '全体にダメージを与える' },
  skill_life_steal: { id: 2039, slug: 'skill_life_steal', name: '命の収奪', effect_type: 'drain_vit', value: 2, description: '寿命(Vitality)を大きく奪い取る' },
  skill_berserk_rage: { id: 2040, slug: 'skill_berserk_rage', name: '狂暴化', effect_type: 'damage', value: 4, description: 'HP25%以下で発狂する超高威力攻撃' },
  skill_uriel_flame: { id: 3001, slug: 'skill_uriel_flame', name: '炎獄の裁き', effect_type: 'damage', value: 2.5, description: '炎攻撃+burn(3T)を付与する' },
  skill_raphael_chain: { id: 3002, slug: 'skill_raphael_chain', name: '慈悲の鎖', effect_type: 'damage_stun', value: 2, description: 'ダメージ+スタン(1T)+自己回復' },
  skill_gabriel_horn: { id: 3003, slug: 'skill_gabriel_horn', name: '啓示の角笛', effect_type: 'debuff_atk_down', value: 0, description: 'パーティ全体ATK DOWN(3T)' },
  skill_michael_blade: { id: 3004, slug: 'skill_michael_blade', name: '天軍の剣', effect_type: 'damage', value: 5, description: '防御貫通の大ダメージ' },
  skill_hades_gate: { id: 3005, slug: 'skill_hades_gate', name: '冥府の門', effect_type: 'drain_vit', value: 3, description: 'VIT吸収+DEF DOWN(2T)' },
  skill_ares_strike: { id: 3006, slug: 'skill_ares_strike', name: '戦神の剛撃', effect_type: 'damage', value: 4, description: '必中の高威力攻撃' },
  skill_artemis_hunt: { id: 3007, slug: 'skill_artemis_hunt', name: '月光の狩り', effect_type: 'damage', value: 1.5, description: '連続2Hit+bleed(2T)' },
  skill_zeus_thunder: { id: 3008, slug: 'skill_zeus_thunder', name: '雷霆', effect_type: 'damage_stun', value: 4, description: '大ダメージ+スタン(1T)' },
  skill_zeus_storm: { id: 3009, slug: 'skill_zeus_storm', name: '神罰の嵐', effect_type: 'debuff_def_down', value: 0, description: '全体DEF DOWN(3T) ※ゼウス強のみ' },
  skill_zeus_aegis: { id: 3010, slug: 'skill_zeus_aegis', name: 'イージスの盾', effect_type: 'buff_self_def', value: 300, description: 'HPを300回復し防御力を高める(DEF UP 5T) ※ゼウス強のみ' },

  // ─── 伝説級ボス固有スキル (4001-4021) ────────────────────────
  skill_baph_hellfire: { id: 4001, slug: 'skill_baph_hellfire', name: '地獄の業火', effect_type: 'damage', value: 3.5, description: '全体に灼熱の闇炎で高威力ダメージを与える' },
  skill_baph_corrupt: { id: 4002, slug: 'skill_baph_corrupt', name: '精神汚染', effect_type: 'debuff_atk_down', value: 0, description: '闇の精神攻撃でATK DOWN(3T)' },
  skill_baph_regen: { id: 4003, slug: 'skill_baph_regen', name: '暗黒再生', effect_type: 'heal', value: 250, description: '闇の力でHP250を回復する' },
  skill_angel_judge: { id: 4004, slug: 'skill_angel_judge', name: '裁きの光剣', effect_type: 'damage', value: 4, description: '防御貫通の大ダメージ' },
  skill_angel_purify: { id: 4005, slug: 'skill_angel_purify', name: '浄化の光', effect_type: 'damage_stun', value: 2.5, description: '光で焼き払いスタン(1T)' },
  skill_angel_aegis: { id: 4006, slug: 'skill_angel_aegis', name: '天光の護り', effect_type: 'buff_self_def', value: 200, description: 'HP200回復+DEF UP(3T)' },
  skill_dragon_nova: { id: 4007, slug: 'skill_dragon_nova', name: '砂漠灼熱砲', effect_type: 'damage', value: 5, description: '超高威力ブレス' },
  skill_dragon_wing: { id: 4008, slug: 'skill_dragon_wing', name: '翼撃', effect_type: 'damage_stun', value: 2, description: '翼で叩きつけスタン(1T)' },
  skill_dragon_roar_e: { id: 4009, slug: 'skill_dragon_roar_e', name: '威圧の咆哮', effect_type: 'debuff_def_down', value: 0, description: 'DEF DOWN(3T)' },
  skill_kirin_horn: { id: 4010, slug: 'skill_kirin_horn', name: '聖角一閃', effect_type: 'damage', value: 3.5, description: '聖なる一撃' },
  skill_kirin_purge: { id: 4011, slug: 'skill_kirin_purge', name: '浄化の波動', effect_type: 'damage_blind', value: 2, description: '目潰し(2T)' },
  skill_kirin_heal: { id: 4012, slug: 'skill_kirin_heal', name: '霊気充填', effect_type: 'heal', value: 300, description: 'HP300を大回復' },
  skill_golem_crush: { id: 4013, slug: 'skill_golem_crush', name: '鋼鉄の拳', effect_type: 'damage', value: 4, description: '防御無視の一撃' },
  skill_golem_quake: { id: 4014, slug: 'skill_golem_quake', name: '大地震動', effect_type: 'damage_stun', value: 2.5, description: '全体ダメ+スタン(1T)' },
  skill_golem_armor: { id: 4015, slug: 'skill_golem_armor', name: '装甲硬化', effect_type: 'buff_self_def', value: 150, description: 'HP150回復+DEF UP(3T)' },
  skill_kraken_tentacle: { id: 4016, slug: 'skill_kraken_tentacle', name: '触腕絞殺', effect_type: 'damage_bleed', value: 3, description: '出血(3T)付与' },
  skill_kraken_ink: { id: 4017, slug: 'skill_kraken_ink', name: '墨雲', effect_type: 'damage_blind', value: 1.5, description: '目潰し(3T)' },
  skill_kraken_vortex: { id: 4018, slug: 'skill_kraken_vortex', name: '大渦', effect_type: 'damage', value: 4.5, description: '超高威力全体ダメージ' },
  skill_mino_axe_e: { id: 4019, slug: 'skill_mino_axe_e', name: '覇王の大斧', effect_type: 'damage', value: 4.5, description: '防御無視の大ダメージ' },
  skill_mino_charge: { id: 4020, slug: 'skill_mino_charge', name: '突進', effect_type: 'damage_stun', value: 3, description: '大ダメ+スタン(1T)' },
  skill_mino_bellow: { id: 4021, slug: 'skill_mino_bellow', name: '迷宮の呪い', effect_type: 'debuff_atk_down', value: 0, description: 'ATK DOWN(3T)' },

  // ─── enemy_actions.csv にあるがスキル定義CSVにない（フォールバック用） ─
  skill_attack: { id: 9001, slug: 'skill_attack', name: '通常攻撃', effect_type: 'damage', value: 1, description: '基本的な物理攻撃' },
  skill_heavy_attack: { id: 9002, slug: 'skill_heavy_attack', name: '強攻撃', effect_type: 'damage', value: 1.5, description: '力を込めた攻撃' },
  skill_poision_attack: { id: 2006, slug: 'skill_poison_attack', name: '毒針', effect_type: 'damage_poison', value: 1, description: '毒を帯びた攻撃' },
};

/**
 * スキルslugからスキル定義を取得するヘルパー
 * 存在しないslugの場合はフォールバック（通常攻撃）を返す
 */
export function getEnemySkill(slug: string): EnemySkillMaster {
  return ENEMY_SKILL_MAP[slug] || ENEMY_SKILL_MAP['skill_attack'];
}
