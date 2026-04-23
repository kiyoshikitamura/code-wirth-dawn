-- ============================================================
-- Migration: エネミー Level設定 & 報酬調整 (v2.9.3g)
-- 
-- Phase 2: 全エネミーに仕様書準拠のlevelを設定
-- Phase 3: 6000番台ボスのGold/EXPを適正値に減額
-- ============================================================

-- levelカラムがまだない場合を想定して追加
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- ============================================================
-- Phase 2: Level設定
-- ============================================================

-- ─── 基礎的な魔物 ───
UPDATE enemies SET level = 1  WHERE slug = 'enemy_slime_blue';
UPDATE enemies SET level = 3  WHERE slug = 'enemy_slime_red';
UPDATE enemies SET level = 8  WHERE slug = 'enemy_slime_king';
UPDATE enemies SET level = 2  WHERE slug = 'enemy_goblin';
UPDATE enemies SET level = 3  WHERE slug = 'enemy_goblin_archer';
UPDATE enemies SET level = 5  WHERE slug = 'enemy_goblin_shaman';
UPDATE enemies SET level = 10 WHERE slug = 'enemy_hobgoblin';
UPDATE enemies SET level = 3  WHERE slug = 'enemy_wild_dog';
UPDATE enemies SET level = 5  WHERE slug = 'enemy_killer_wolf';
UPDATE enemies SET level = 8  WHERE slug = 'enemy_giant_bear';
UPDATE enemies SET level = 15 WHERE slug = 'enemy_chimera';
UPDATE enemies SET level = 4  WHERE slug = 'enemy_skeleton';
UPDATE enemies SET level = 6  WHERE slug = 'enemy_zombie';
UPDATE enemies SET level = 10 WHERE slug = 'enemy_wraith';
UPDATE enemies SET level = 20 WHERE slug = 'enemy_lich';

-- ─── 人型の敵 ───
UPDATE enemies SET level = 2  WHERE slug = 'enemy_bandit_thug';
UPDATE enemies SET level = 4  WHERE slug = 'enemy_bandit_archer';
UPDATE enemies SET level = 6  WHERE slug = 'enemy_bandit_guard';
UPDATE enemies SET level = 12 WHERE slug = 'enemy_bandit_boss';
UPDATE enemies SET level = 5  WHERE slug = 'enemy_cultist';
UPDATE enemies SET level = 9  WHERE slug = 'enemy_cult_priest';
UPDATE enemies SET level = 14 WHERE slug = 'enemy_cult_exec';
UPDATE enemies SET level = 12 WHERE slug = 'enemy_succubus';
UPDATE enemies SET level = 8  WHERE slug = 'enemy_assassin_trainee';
UPDATE enemies SET level = 15 WHERE slug = 'enemy_assassin_master';
UPDATE enemies SET level = 22 WHERE slug = 'enemy_assassin_boss';

-- ─── 国家固有エネミー (ローラン) ───
UPDATE enemies SET level = 10 WHERE slug = 'enemy_roland_ghost_knight';
UPDATE enemies SET level = 12 WHERE slug = 'enemy_roland_gargoyle';
UPDATE enemies SET level = 15 WHERE slug = 'enemy_roland_witch';
UPDATE enemies SET level = 25 WHERE slug = 'enemy_roland_fallen_angel';

-- ─── 国家固有エネミー (マルカンド) ───
UPDATE enemies SET level = 8  WHERE slug = 'enemy_markand_scorpion';
UPDATE enemies SET level = 14 WHERE slug = 'enemy_markand_sand_worm';
UPDATE enemies SET level = 18 WHERE slug = 'enemy_markand_djinn';
UPDATE enemies SET level = 30 WHERE slug = 'enemy_markand_desert_dragon';

-- ─── 国家固有エネミー (夜刀) ───
UPDATE enemies SET level = 6  WHERE slug = 'enemy_yato_onibi';
UPDATE enemies SET level = 10 WHERE slug = 'enemy_yato_karakasa';
UPDATE enemies SET level = 16 WHERE slug = 'enemy_yato_tengu';
UPDATE enemies SET level = 24 WHERE slug = 'enemy_yato_akaoni';

-- ─── 国家固有エネミー (華龍) ───
UPDATE enemies SET level = 9  WHERE slug = 'enemy_karyu_jiangshi';
UPDATE enemies SET level = 15 WHERE slug = 'enemy_karyu_fox';
UPDATE enemies SET level = 18 WHERE slug = 'enemy_karyu_terracotta';
UPDATE enemies SET level = 28 WHERE slug = 'enemy_karyu_kirin';

-- ─── 賞金稼ぎ ───
UPDATE enemies SET level = 10 WHERE slug = 'enemy_bounty_hunter_new';
UPDATE enemies SET level = 12 WHERE slug = 'enemy_bounty_hunter_sword';
UPDATE enemies SET level = 9  WHERE slug = 'enemy_bounty_hunter_archer';
UPDATE enemies SET level = 25 WHERE slug = 'enemy_bounty_hunter_vet';
UPDATE enemies SET level = 20 WHERE slug = 'enemy_bounty_mage_hunter';
UPDATE enemies SET level = 40 WHERE slug = 'enemy_bounty_executioner';
UPDATE enemies SET level = 60 WHERE slug = 'enemy_bounty_royal_blade';
UPDATE enemies SET level = 90 WHERE slug = 'enemy_bounty_legend';
UPDATE enemies SET level = 75 WHERE slug = 'enemy_bounty_reaper';

-- ─── メインシナリオボス ───
UPDATE enemies SET level = 12 WHERE slug = 'enemy_boss_ep5_squad';
UPDATE enemies SET level = 25 WHERE slug = 'enemy_boss_ep10_dragon';
UPDATE enemies SET level = 50 WHERE slug = 'enemy_boss_ep20_god';

-- ─── 6000番台ボス Level設定 ───
UPDATE enemies SET level = 15 WHERE slug = 'boss_skeleton_king';
UPDATE enemies SET level = 18 WHERE slug = 'boss_queen_worm';
UPDATE enemies SET level = 16 WHERE slug = 'boss_red_ogre';
UPDATE enemies SET level = 20 WHERE slug = 'boss_thunder_beast';
UPDATE enemies SET level = 18 WHERE slug = 'boss_griffon_lord';
UPDATE enemies SET level = 15 WHERE slug = 'boss_treant_elder';
UPDATE enemies SET level = 22 WHERE slug = 'boss_fallen_bishop';
UPDATE enemies SET level = 24 WHERE slug = 'boss_corrupt_cardinal';
UPDATE enemies SET level = 20 WHERE slug = 'boss_mad_ronin';
UPDATE enemies SET level = 22 WHERE slug = 'boss_assassin_master';
UPDATE enemies SET level = 18 WHERE slug = 'boss_pirate_king';
UPDATE enemies SET level = 20 WHERE slug = 'boss_rebel_leader';
UPDATE enemies SET level = 25 WHERE slug = 'boss_gold_merchant';
UPDATE enemies SET level = 30 WHERE slug = 'boss_demon_baphomet';
UPDATE enemies SET level = 28 WHERE slug = 'boss_fallen_angel';
UPDATE enemies SET level = 32 WHERE slug = 'boss_desert_dragon';
UPDATE enemies SET level = 30 WHERE slug = 'boss_holy_kirin';
UPDATE enemies SET level = 28 WHERE slug = 'boss_omega_golem';
UPDATE enemies SET level = 26 WHERE slug = 'boss_kraken_prime';
UPDATE enemies SET level = 27 WHERE slug = 'boss_mino_king';

-- ============================================================
-- Phase 3: 6000番台ボス報酬減額
-- ============================================================

UPDATE enemies SET exp = 150, gold = 500  WHERE slug = 'boss_skeleton_king';
UPDATE enemies SET exp = 200, gold = 600  WHERE slug = 'boss_queen_worm';
UPDATE enemies SET exp = 180, gold = 500  WHERE slug = 'boss_red_ogre';
UPDATE enemies SET exp = 250, gold = 700  WHERE slug = 'boss_thunder_beast';
UPDATE enemies SET exp = 200, gold = 600  WHERE slug = 'boss_griffon_lord';
UPDATE enemies SET exp = 150, gold = 500  WHERE slug = 'boss_treant_elder';
UPDATE enemies SET exp = 300, gold = 1000 WHERE slug = 'boss_fallen_bishop';
UPDATE enemies SET exp = 350, gold = 1200 WHERE slug = 'boss_corrupt_cardinal';
UPDATE enemies SET exp = 250, gold = 800  WHERE slug = 'boss_mad_ronin';
UPDATE enemies SET exp = 300, gold = 900  WHERE slug = 'boss_assassin_master';
UPDATE enemies SET exp = 200, gold = 700  WHERE slug = 'boss_pirate_king';
UPDATE enemies SET exp = 250, gold = 800  WHERE slug = 'boss_rebel_leader';
UPDATE enemies SET exp = 400, gold = 1200 WHERE slug = 'boss_gold_merchant';
UPDATE enemies SET exp = 500, gold = 1500 WHERE slug = 'boss_demon_baphomet';
UPDATE enemies SET exp = 450, gold = 1500 WHERE slug = 'boss_fallen_angel';
UPDATE enemies SET exp = 600, gold = 2000 WHERE slug = 'boss_desert_dragon';
UPDATE enemies SET exp = 500, gold = 1500 WHERE slug = 'boss_holy_kirin';
UPDATE enemies SET exp = 450, gold = 1500 WHERE slug = 'boss_omega_golem';
UPDATE enemies SET exp = 400, gold = 1200 WHERE slug = 'boss_kraken_prime';
UPDATE enemies SET exp = 450, gold = 1200 WHERE slug = 'boss_mino_king';
