-- ============================================================
-- Migration: エネミースキル拡張 & アクションパターン更新 (v2.9.3h)
-- 
-- 1. enemies テーブルに def カラム追加
-- 2. enemy_skills テーブルの CHECK制約を更新（新effect_type対応）
-- 3. enemy_skills テーブルに新スキルを INSERT
-- 4. skill_poison_attack の effect_type を damage_poison に修正
-- 5. skill_heavy_blow / skill_heavy_attack の value を 1.5 に修正
-- 6. 全エネミーの action_pattern を最新CSV準拠に更新
-- 7. 全エネミーの def 値を設定
-- ============================================================

-- ─── 1. def カラム追加 ───
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS def INTEGER DEFAULT 0;

-- ─── 2. enemy_skills CHECK制約を緩和（新effect_typeに対応） ───
ALTER TABLE enemy_skills DROP CONSTRAINT IF EXISTS enemy_skills_effect_type_check;
ALTER TABLE enemy_skills ADD CONSTRAINT enemy_skills_effect_type_check
  CHECK (effect_type IN (
    'damage', 'drain_vit', 'heal', 'status_effect',
    'damage_poison', 'damage_blind', 'damage_bleed', 'damage_stun',
    'buff_self_atk', 'debuff_atk_down', 'debuff_def_down',
    'inject', 'buff', 'debuff', 'other'
  ));

-- value を NUMERIC 型に変更（1.5 等の小数値に対応）
ALTER TABLE enemy_skills ALTER COLUMN value TYPE NUMERIC USING value::NUMERIC;

-- ─── 3. 既存スキルの修正 ───
UPDATE enemy_skills SET effect_type = 'damage_poison' WHERE slug = 'skill_poison_attack';
UPDATE enemy_skills SET value = 1.5 WHERE slug = 'skill_heavy_blow';

-- ─── 4. 新規スキル INSERT (ON CONFLICT で重複回避) ───
INSERT INTO enemy_skills (id, slug, name, effect_type, value, description) VALUES
  (2020, 'skill_poison_breath',  '毒の息',       'damage_poison', 1, '毒の塊を吐き出しダメージと毒(3T)を付与する'),
  (2021, 'skill_thunder_strike', '雷撃',         'damage_stun',   2, '雷を落とし大ダメージとスタン(1T)を与える'),
  (2022, 'skill_sand_blind',     '砂塵',         'damage_blind',  1, '砂を巻き上げダメージと目潰し(2T)を付与する'),
  (2023, 'skill_claw_rend',      '裂傷の爪',     'damage_bleed',  1, '鋭い爪で引き裂きダメージと出血(2T)を付与する'),
  (2024, 'skill_charm',          '魅惑の歌',     'damage_stun',   1, '妖艶な歌で魅了しスタン(1T)を与える'),
  (2025, 'skill_petrify_gaze',   '石化の視線',   'damage_stun',   2, '石化の視線でダメージとスタン(1T)を与える'),
  (2026, 'skill_soul_drain',     '魂抜き',       'drain_vit',     1, '魂を引き抜き寿命を奪う'),
  (2027, 'skill_regenerate',     '強力再生',     'heal',         100, '強力な再生能力でHPを大きく回復する'),
  (2030, 'skill_war_cry',        '雄叫び',       'buff_self_atk', 0, '雄叫びを上げて攻撃力を高める(ATK UP 3T)'),
  (2031, 'skill_curse',          '呪詛',         'debuff_atk_down', 0, '呪いの言葉で攻撃力を奪う(ATK DOWN 2T)'),
  (2032, 'skill_armor_break',    '鎧砕き',       'debuff_def_down', 0, '防具を叩き壊し防御力を下げる(DEF DOWN 2T)'),
  -- フォールバック用
  (9001, 'skill_attack',         '通常攻撃',     'damage',        1, '基本的な物理攻撃'),
  (9002, 'skill_heavy_attack',   '強攻撃',       'damage',      1.5, '力を込めた攻撃')
ON CONFLICT (slug) DO UPDATE SET
  effect_type = EXCLUDED.effect_type,
  value = EXCLUDED.value,
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ─── 5. ボスヒール/ヌーク/スタンも確実にUPSERT ───
INSERT INTO enemy_skills (id, slug, name, effect_type, value, description) VALUES
  (501, 'skill_boss_heal', '暗黒の癒し', 'heal', 200, '5ターンに一度自身を大きく回復する'),
  (502, 'skill_boss_nuke', '終焉の息吹', 'damage', 50, '防御を貫通しうる強烈な全体ダメージ'),
  (503, 'skill_boss_stun', '咆哮',       'status_effect', 1, '1ターンの間スタンさせる')
ON CONFLICT (slug) DO UPDATE SET
  effect_type = EXCLUDED.effect_type,
  value = EXCLUDED.value;

-- ─── 6. 全エネミーの def 値を設定 ───
UPDATE enemies SET def = 1  WHERE slug = 'enemy_slime_blue';
UPDATE enemies SET def = 2  WHERE slug = 'enemy_slime_red';
UPDATE enemies SET def = 5  WHERE slug = 'enemy_slime_king';
UPDATE enemies SET def = 2  WHERE slug = 'enemy_goblin';
UPDATE enemies SET def = 1  WHERE slug = 'enemy_goblin_archer';
UPDATE enemies SET def = 2  WHERE slug = 'enemy_goblin_shaman';
UPDATE enemies SET def = 8  WHERE slug = 'enemy_hobgoblin';
UPDATE enemies SET def = 1  WHERE slug = 'enemy_wild_dog';
UPDATE enemies SET def = 3  WHERE slug = 'enemy_killer_wolf';
UPDATE enemies SET def = 5  WHERE slug = 'enemy_giant_bear';
UPDATE enemies SET def = 15 WHERE slug = 'enemy_chimera';
UPDATE enemies SET def = 3  WHERE slug = 'enemy_skeleton';
UPDATE enemies SET def = 2  WHERE slug = 'enemy_zombie';
UPDATE enemies SET def = 15 WHERE slug = 'enemy_wraith';
UPDATE enemies SET def = 10 WHERE slug = 'enemy_lich';
UPDATE enemies SET def = 2  WHERE slug = 'enemy_bandit_thug';
UPDATE enemies SET def = 1  WHERE slug = 'enemy_bandit_archer';
UPDATE enemies SET def = 5  WHERE slug = 'enemy_bandit_guard';
UPDATE enemies SET def = 8  WHERE slug = 'enemy_bandit_boss';
UPDATE enemies SET def = 2  WHERE slug = 'enemy_cultist';
UPDATE enemies SET def = 3  WHERE slug = 'enemy_cult_priest';
UPDATE enemies SET def = 10 WHERE slug = 'enemy_cult_exec';
UPDATE enemies SET def = 5  WHERE slug = 'enemy_succubus';
UPDATE enemies SET def = 2  WHERE slug = 'enemy_assassin_trainee';
UPDATE enemies SET def = 5  WHERE slug = 'enemy_assassin_master';
UPDATE enemies SET def = 12 WHERE slug = 'enemy_assassin_boss';
UPDATE enemies SET def = 10 WHERE slug = 'enemy_roland_ghost_knight';
UPDATE enemies SET def = 25 WHERE slug = 'enemy_roland_gargoyle';
UPDATE enemies SET def = 5  WHERE slug = 'enemy_roland_witch';
UPDATE enemies SET def = 20 WHERE slug = 'enemy_roland_fallen_angel';
UPDATE enemies SET def = 15 WHERE slug = 'enemy_markand_scorpion';
UPDATE enemies SET def = 5  WHERE slug = 'enemy_markand_sand_worm';
UPDATE enemies SET def = 10 WHERE slug = 'enemy_markand_djinn';
UPDATE enemies SET def = 30 WHERE slug = 'enemy_markand_desert_dragon';
UPDATE enemies SET def = 1  WHERE slug = 'enemy_yato_onibi';
UPDATE enemies SET def = 3  WHERE slug = 'enemy_yato_karakasa';
UPDATE enemies SET def = 8  WHERE slug = 'enemy_yato_tengu';
UPDATE enemies SET def = 15 WHERE slug = 'enemy_yato_akaoni';
UPDATE enemies SET def = 8  WHERE slug = 'enemy_karyu_jiangshi';
UPDATE enemies SET def = 5  WHERE slug = 'enemy_karyu_fox';
UPDATE enemies SET def = 20 WHERE slug = 'enemy_karyu_terracotta';
UPDATE enemies SET def = 25 WHERE slug = 'enemy_karyu_kirin';
UPDATE enemies SET def = 5  WHERE slug = 'enemy_bounty_hunter_new';
UPDATE enemies SET def = 8  WHERE slug = 'enemy_bounty_hunter_sword';
UPDATE enemies SET def = 3  WHERE slug = 'enemy_bounty_hunter_archer';
UPDATE enemies SET def = 15 WHERE slug = 'enemy_bounty_hunter_vet';
UPDATE enemies SET def = 10 WHERE slug = 'enemy_bounty_mage_hunter';
UPDATE enemies SET def = 25 WHERE slug = 'enemy_bounty_executioner';
UPDATE enemies SET def = 20 WHERE slug = 'enemy_bounty_royal_blade';
UPDATE enemies SET def = 30 WHERE slug = 'enemy_bounty_legend';
UPDATE enemies SET def = 15 WHERE slug = 'enemy_bounty_reaper';
UPDATE enemies SET def = 10 WHERE slug = 'enemy_boss_ep5_squad';
UPDATE enemies SET def = 18 WHERE slug = 'enemy_boss_ep10_dragon';
UPDATE enemies SET def = 25 WHERE slug = 'enemy_boss_ep20_god';
-- 6000番台ボス
UPDATE enemies SET def = 10 WHERE slug = 'boss_skeleton_king';
UPDATE enemies SET def = 8  WHERE slug = 'boss_queen_worm';
UPDATE enemies SET def = 5  WHERE slug = 'boss_red_ogre';
UPDATE enemies SET def = 5  WHERE slug = 'boss_thunder_beast';
UPDATE enemies SET def = 10 WHERE slug = 'boss_griffon_lord';
UPDATE enemies SET def = 15 WHERE slug = 'boss_treant_elder';
UPDATE enemies SET def = 12 WHERE slug = 'boss_fallen_bishop';
UPDATE enemies SET def = 15 WHERE slug = 'boss_corrupt_cardinal';
UPDATE enemies SET def = 5  WHERE slug = 'boss_mad_ronin';
UPDATE enemies SET def = 3  WHERE slug = 'boss_assassin_master';
UPDATE enemies SET def = 10 WHERE slug = 'boss_pirate_king';
UPDATE enemies SET def = 12 WHERE slug = 'boss_rebel_leader';
UPDATE enemies SET def = 15 WHERE slug = 'boss_gold_merchant';
UPDATE enemies SET def = 18 WHERE slug = 'boss_demon_baphomet';
UPDATE enemies SET def = 20 WHERE slug = 'boss_fallen_angel';
UPDATE enemies SET def = 25 WHERE slug = 'boss_desert_dragon';
UPDATE enemies SET def = 20 WHERE slug = 'boss_holy_kirin';
UPDATE enemies SET def = 30 WHERE slug = 'boss_omega_golem';
UPDATE enemies SET def = 15 WHERE slug = 'boss_kraken_prime';
UPDATE enemies SET def = 18 WHERE slug = 'boss_mino_king';

-- ─── 7. 全エネミーの action_pattern をCSV準拠に更新 ───

-- 基礎的な魔物
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":100}]'::jsonb WHERE slug = 'enemy_slime_blue';
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":80},{"skill":"skill_heavy_blow","prob":20}]'::jsonb WHERE slug = 'enemy_slime_red';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":60},{"skill":"skill_roar","prob":40},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_slime_king';
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":80},{"skill":"skill_claw_rend","prob":20}]'::jsonb WHERE slug = 'enemy_goblin';
UPDATE enemies SET action_pattern = '[{"skill":"skill_arrow","prob":80},{"skill":"skill_sand_blind","prob":20}]'::jsonb WHERE slug = 'enemy_goblin_archer';
UPDATE enemies SET action_pattern = '[{"skill":"skill_fireball","prob":60},{"skill":"skill_heal_minor","prob":30,"condition":"turn_mod:3"},{"skill":"skill_curse","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_goblin_shaman';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":60},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:3"},{"skill":"skill_roar","prob":30}]'::jsonb WHERE slug = 'enemy_hobgoblin';
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":70},{"skill":"skill_claw_rend","prob":30}]'::jsonb WHERE slug = 'enemy_wild_dog';
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":50},{"skill":"skill_claw_rend","prob":30},{"skill":"skill_heavy_blow","prob":20}]'::jsonb WHERE slug = 'enemy_killer_wolf';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":70},{"skill":"skill_claw_rend","prob":20},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_giant_bear';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":40},{"skill":"skill_fireball","prob":25},{"skill":"skill_claw_rend","prob":15},{"skill":"skill_roar","prob":20}]'::jsonb WHERE slug = 'enemy_chimera';
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":70},{"skill":"skill_heavy_blow","prob":30}]'::jsonb WHERE slug = 'enemy_skeleton';
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":60},{"skill":"skill_poison_breath","prob":20},{"skill":"skill_heal_minor","prob":20,"condition":"turn_mod:3"}]'::jsonb WHERE slug = 'enemy_zombie';
UPDATE enemies SET action_pattern = '[{"skill":"skill_dark_flare","prob":60},{"skill":"skill_drain_vit","prob":20,"condition":"turn_mod:3"},{"skill":"skill_curse","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_wraith';
UPDATE enemies SET action_pattern = '[{"skill":"skill_dark_flare","prob":50},{"skill":"skill_soul_drain","prob":10,"condition":"turn_mod:3"},{"skill":"skill_heal_self","prob":30,"condition":"turn_mod:4"},{"skill":"skill_curse","prob":100,"condition":"turn_mod:5"}]'::jsonb WHERE slug = 'enemy_lich';

-- 人型の敵
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":80},{"skill":"skill_claw_rend","prob":20}]'::jsonb WHERE slug = 'enemy_bandit_thug';
UPDATE enemies SET action_pattern = '[{"skill":"skill_arrow","prob":80},{"skill":"skill_sand_blind","prob":20}]'::jsonb WHERE slug = 'enemy_bandit_archer';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":70},{"skill":"skill_armor_break","prob":30}]'::jsonb WHERE slug = 'enemy_bandit_guard';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":50},{"skill":"skill_roar","prob":20},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:3"},{"skill":"skill_armor_break","prob":30}]'::jsonb WHERE slug = 'enemy_bandit_boss';
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":50},{"skill":"skill_fireball","prob":40},{"skill":"skill_curse","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_cultist';
UPDATE enemies SET action_pattern = '[{"skill":"skill_dark_flare","prob":60},{"skill":"skill_curse","prob":20},{"skill":"skill_heal_minor","prob":20,"condition":"turn_mod:3"}]'::jsonb WHERE slug = 'enemy_cult_priest';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":60},{"skill":"skill_dark_flare","prob":20},{"skill":"skill_armor_break","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_cult_exec';
UPDATE enemies SET action_pattern = '[{"skill":"skill_charm","prob":30},{"skill":"skill_fireball","prob":30},{"skill":"skill_dark_flare","prob":40}]'::jsonb WHERE slug = 'enemy_succubus';
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":50},{"skill":"skill_poison_attack","prob":30},{"skill":"skill_claw_rend","prob":20}]'::jsonb WHERE slug = 'enemy_assassin_trainee';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":40},{"skill":"skill_poison_attack","prob":40},{"skill":"skill_armor_break","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_assassin_master';
UPDATE enemies SET action_pattern = '[{"skill":"skill_assassinate","prob":30},{"skill":"skill_poison_attack","prob":40},{"skill":"skill_armor_break","prob":100,"condition":"turn_mod:3"},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:5"}]'::jsonb WHERE slug = 'enemy_assassin_boss';

-- ローラン国エネミー
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":60},{"skill":"skill_holy_ray","prob":20},{"skill":"skill_curse","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_roland_ghost_knight';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":60},{"skill":"skill_petrify_gaze","prob":20,"condition":"turn_mod:3"},{"skill":"skill_armor_break","prob":20}]'::jsonb WHERE slug = 'enemy_roland_gargoyle';
UPDATE enemies SET action_pattern = '[{"skill":"skill_dark_flare","prob":60},{"skill":"skill_drain_vit","prob":20,"condition":"turn_mod:3"},{"skill":"skill_curse","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_roland_witch';
UPDATE enemies SET action_pattern = '[{"skill":"skill_holy_ray","prob":40},{"skill":"skill_dark_flare","prob":40},{"skill":"skill_heal_self","prob":100,"condition":"turn_mod:5"},{"skill":"skill_war_cry","prob":100,"condition":"hp_under:50"}]'::jsonb WHERE slug = 'enemy_roland_fallen_angel';

-- マルカンド国エネミー
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":40},{"skill":"skill_poison_attack","prob":40},{"skill":"skill_sand_blind","prob":20}]'::jsonb WHERE slug = 'enemy_markand_scorpion';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":50},{"skill":"skill_sand_breath","prob":20},{"skill":"skill_poison_breath","prob":30}]'::jsonb WHERE slug = 'enemy_markand_sand_worm';
UPDATE enemies SET action_pattern = '[{"skill":"skill_fireball","prob":50},{"skill":"skill_sand_blind","prob":30},{"skill":"skill_curse","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_markand_djinn';
UPDATE enemies SET action_pattern = '[{"skill":"skill_dragon_breath","prob":10},{"skill":"skill_heavy_blow","prob":50},{"skill":"skill_sand_blind","prob":20},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:4"},{"skill":"skill_heal_self","prob":100,"condition":"hp_under:30"}]'::jsonb WHERE slug = 'enemy_markand_desert_dragon';

-- 夜刀国エネミー
UPDATE enemies SET action_pattern = '[{"skill":"skill_fireball","prob":70},{"skill":"skill_sand_blind","prob":30}]'::jsonb WHERE slug = 'enemy_yato_onibi';
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":60},{"skill":"skill_sand_blind","prob":30},{"skill":"skill_curse","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_yato_karakasa';
UPDATE enemies SET action_pattern = '[{"skill":"skill_arrow","prob":40},{"skill":"skill_katana_slash","prob":40},{"skill":"skill_claw_rend","prob":20}]'::jsonb WHERE slug = 'enemy_yato_tengu';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":60},{"skill":"skill_roar","prob":20},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:3"},{"skill":"skill_armor_break","prob":100,"condition":"turn_mod:5"}]'::jsonb WHERE slug = 'enemy_yato_akaoni';

-- 華龍国エネミー
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":60},{"skill":"skill_soul_drain","prob":20,"condition":"turn_mod:3"},{"skill":"skill_poison_attack","prob":20}]'::jsonb WHERE slug = 'enemy_karyu_jiangshi';
UPDATE enemies SET action_pattern = '[{"skill":"skill_fireball","prob":40},{"skill":"skill_dark_flare","prob":30},{"skill":"skill_charm","prob":30}]'::jsonb WHERE slug = 'enemy_karyu_fox';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":70},{"skill":"skill_armor_break","prob":30}]'::jsonb WHERE slug = 'enemy_karyu_terracotta';
UPDATE enemies SET action_pattern = '[{"skill":"skill_thunder_strike","prob":40},{"skill":"skill_holy_ray","prob":40},{"skill":"skill_heal_self","prob":20,"condition":"turn_mod:5"}]'::jsonb WHERE slug = 'enemy_karyu_kirin';

-- 賞金稼ぎ
UPDATE enemies SET action_pattern = '[{"skill":"skill_tackle","prob":70},{"skill":"skill_claw_rend","prob":30}]'::jsonb WHERE slug = 'enemy_bounty_hunter_new';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":60},{"skill":"skill_bounty_hunt","prob":20},{"skill":"skill_armor_break","prob":20}]'::jsonb WHERE slug = 'enemy_bounty_hunter_sword';
UPDATE enemies SET action_pattern = '[{"skill":"skill_arrow","prob":70},{"skill":"skill_sand_blind","prob":30}]'::jsonb WHERE slug = 'enemy_bounty_hunter_archer';
UPDATE enemies SET action_pattern = '[{"skill":"skill_bounty_combo","prob":40},{"skill":"skill_heavy_blow","prob":40},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:3"}]'::jsonb WHERE slug = 'enemy_bounty_hunter_vet';
UPDATE enemies SET action_pattern = '[{"skill":"skill_dark_flare","prob":60},{"skill":"skill_drain_vit","prob":20,"condition":"turn_mod:3"},{"skill":"skill_curse","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_bounty_mage_hunter';
UPDATE enemies SET action_pattern = '[{"skill":"skill_bounty_strike","prob":40},{"skill":"skill_heavy_blow","prob":30},{"skill":"skill_armor_break","prob":30}]'::jsonb WHERE slug = 'enemy_bounty_executioner';
UPDATE enemies SET action_pattern = '[{"skill":"skill_bounty_combo","prob":50},{"skill":"skill_bounty_strike","prob":30},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:3"}]'::jsonb WHERE slug = 'enemy_bounty_royal_blade';
UPDATE enemies SET action_pattern = '[{"skill":"skill_bounty_combo","prob":40},{"skill":"skill_bounty_strike","prob":40},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:3"},{"skill":"skill_armor_break","prob":100,"condition":"turn_mod:5"}]'::jsonb WHERE slug = 'enemy_bounty_legend';
UPDATE enemies SET action_pattern = '[{"skill":"skill_assassinate","prob":30},{"skill":"skill_bounty_strike","prob":40},{"skill":"skill_poison_attack","prob":30}]'::jsonb WHERE slug = 'enemy_bounty_reaper';

-- メインシナリオボス
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":70},{"skill":"skill_defense_pierce","prob":100,"condition":"turn_mod:3"},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_boss_ep5_squad';
UPDATE enemies SET action_pattern = '[{"skill":"skill_dragon_breath","prob":50},{"skill":"skill_thunder_strike","prob":20},{"skill":"skill_holy_ray","prob":80,"condition":"hp_under:50"},{"skill":"skill_heal_self","prob":100,"condition":"hp_under:30"}]'::jsonb WHERE slug = 'enemy_boss_ep10_dragon';
UPDATE enemies SET action_pattern = '[{"skill":"skill_holy_ray","prob":40},{"skill":"skill_god_purge","prob":100,"condition":"turn_mod:5"},{"skill":"skill_god_enrage","prob":100,"condition":"hp_under:20"},{"skill":"skill_armor_break","prob":100,"condition":"turn_mod:4"}]'::jsonb WHERE slug = 'enemy_boss_ep20_god';

-- 6000番台ボス
UPDATE enemies SET action_pattern = '[{"skill":"skill_boss_nuke","prob":20,"condition":"turn_mod:4"},{"skill":"skill_heavy_attack","prob":50},{"skill":"skill_curse","prob":100,"condition":"turn_mod:3"},{"skill":"skill_attack","prob":100}]'::jsonb WHERE slug = 'boss_skeleton_king';
UPDATE enemies SET action_pattern = '[{"skill":"skill_boss_heal","prob":100,"condition":"hp_under:500"},{"skill":"skill_boss_nuke","prob":30,"condition":"turn_mod:3"},{"skill":"skill_boss_stun","prob":40,"condition":"turn_mod:5"},{"skill":"skill_heavy_attack","prob":100}]'::jsonb WHERE slug = 'boss_desert_dragon';
UPDATE enemies SET action_pattern = '[{"skill":"skill_boss_heal","prob":100,"condition":"turn_mod:5"},{"skill":"skill_boss_nuke","prob":50,"condition":"hp_under:400"},{"skill":"skill_curse","prob":100,"condition":"turn_mod:4"},{"skill":"skill_heavy_attack","prob":100}]'::jsonb WHERE slug = 'boss_fallen_angel';
UPDATE enemies SET action_pattern = '[{"skill":"skill_boss_nuke","prob":100,"condition":"turn_mod:4"},{"skill":"skill_boss_heal","prob":80,"condition":"hp_under:450"},{"skill":"skill_armor_break","prob":100,"condition":"turn_mod:3"},{"skill":"skill_attack","prob":100}]'::jsonb WHERE slug = 'boss_demon_baphomet';
UPDATE enemies SET action_pattern = '[{"skill":"skill_poison_breath","prob":40},{"skill":"skill_heavy_blow","prob":60},{"skill":"skill_boss_nuke","prob":100,"condition":"turn_mod:4"},{"skill":"skill_boss_heal","prob":100,"condition":"hp_under:300"}]'::jsonb WHERE slug = 'boss_queen_worm';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":60},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:3"},{"skill":"skill_boss_nuke","prob":100,"condition":"turn_mod:5"},{"skill":"skill_armor_break","prob":30}]'::jsonb WHERE slug = 'boss_red_ogre';
UPDATE enemies SET action_pattern = '[{"skill":"skill_thunder_strike","prob":30},{"skill":"skill_heavy_blow","prob":70},{"skill":"skill_boss_nuke","prob":100,"condition":"turn_mod:5"},{"skill":"skill_boss_stun","prob":100,"condition":"hp_under:200"}]'::jsonb WHERE slug = 'boss_thunder_beast';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":50},{"skill":"skill_claw_rend","prob":40},{"skill":"skill_boss_nuke","prob":100,"condition":"turn_mod:4"},{"skill":"skill_boss_heal","prob":100,"condition":"hp_under:250"}]'::jsonb WHERE slug = 'boss_griffon_lord';
UPDATE enemies SET action_pattern = '[{"skill":"skill_attack","prob":60},{"skill":"skill_regenerate","prob":100,"condition":"turn_mod:3"},{"skill":"skill_poison_breath","prob":30},{"skill":"skill_boss_heal","prob":100,"condition":"hp_under:400"}]'::jsonb WHERE slug = 'boss_treant_elder';
UPDATE enemies SET action_pattern = '[{"skill":"skill_dark_flare","prob":60},{"skill":"skill_curse","prob":100,"condition":"turn_mod:3"},{"skill":"skill_boss_heal","prob":100,"condition":"turn_mod:5"},{"skill":"skill_boss_nuke","prob":100,"condition":"hp_under:200"}]'::jsonb WHERE slug = 'boss_fallen_bishop';
UPDATE enemies SET action_pattern = '[{"skill":"skill_dark_flare","prob":50},{"skill":"skill_curse","prob":100,"condition":"turn_mod:3"},{"skill":"skill_armor_break","prob":100,"condition":"turn_mod:4"},{"skill":"skill_boss_heal","prob":100,"condition":"hp_under:250"}]'::jsonb WHERE slug = 'boss_corrupt_cardinal';
UPDATE enemies SET action_pattern = '[{"skill":"skill_katana_slash","prob":50},{"skill":"skill_heavy_blow","prob":50},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:3"},{"skill":"skill_boss_nuke","prob":100,"condition":"hp_under:150"}]'::jsonb WHERE slug = 'boss_mad_ronin';
UPDATE enemies SET action_pattern = '[{"skill":"skill_assassinate","prob":30},{"skill":"skill_poison_attack","prob":40},{"skill":"skill_heavy_blow","prob":30},{"skill":"skill_boss_nuke","prob":100,"condition":"hp_under:150"}]'::jsonb WHERE slug = 'boss_assassin_master';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":60},{"skill":"skill_claw_rend","prob":30},{"skill":"skill_armor_break","prob":100,"condition":"turn_mod:4"},{"skill":"skill_boss_heal","prob":100,"condition":"hp_under:200"}]'::jsonb WHERE slug = 'boss_pirate_king';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":50},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:3"},{"skill":"skill_armor_break","prob":100,"condition":"turn_mod:5"},{"skill":"skill_boss_nuke","prob":100,"condition":"hp_under:250"}]'::jsonb WHERE slug = 'boss_rebel_leader';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":40},{"skill":"skill_armor_break","prob":30},{"skill":"skill_boss_heal","prob":100,"condition":"turn_mod:4"},{"skill":"skill_boss_nuke","prob":100,"condition":"hp_under:350"}]'::jsonb WHERE slug = 'boss_gold_merchant';
UPDATE enemies SET action_pattern = '[{"skill":"skill_thunder_strike","prob":40},{"skill":"skill_holy_ray","prob":60},{"skill":"skill_boss_heal","prob":100,"condition":"turn_mod:5"},{"skill":"skill_boss_nuke","prob":100,"condition":"hp_under:400"}]'::jsonb WHERE slug = 'boss_holy_kirin';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":60},{"skill":"skill_armor_break","prob":30},{"skill":"skill_regenerate","prob":100,"condition":"turn_mod:4"},{"skill":"skill_boss_nuke","prob":100,"condition":"hp_under:500"}]'::jsonb WHERE slug = 'boss_omega_golem';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":50},{"skill":"skill_poison_breath","prob":30},{"skill":"skill_boss_stun","prob":100,"condition":"turn_mod:4"},{"skill":"skill_boss_heal","prob":100,"condition":"hp_under:400"}]'::jsonb WHERE slug = 'boss_kraken_prime';
UPDATE enemies SET action_pattern = '[{"skill":"skill_heavy_blow","prob":60},{"skill":"skill_war_cry","prob":100,"condition":"turn_mod:3"},{"skill":"skill_boss_nuke","prob":100,"condition":"turn_mod:5"},{"skill":"skill_armor_break","prob":30}]'::jsonb WHERE slug = 'boss_mino_king';
