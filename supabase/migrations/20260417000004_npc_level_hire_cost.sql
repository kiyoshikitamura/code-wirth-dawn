-- Migration: NPC hire_cost カラム追加 & レベル・雇用費用の初期値設定
-- CSV管理移行: hire_costをnpcsテーブルに追加し、
-- shadowService.ts が npc.hire_cost を直接参照するように変更

-- ============================================================
-- 1. hire_cost カラム追加
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS hire_cost integer DEFAULT 0;

-- ============================================================
-- 2. レベル & hire_cost 設定
-- CSV (src/data/csv/npcs.csv) と完全同期

-- ローラン聖帝国
UPDATE npcs SET level = 3,  hire_cost = 300  WHERE slug = 'npc_roland_elena';
UPDATE npcs SET level = 3,  hire_cost = 400  WHERE slug = 'npc_roland_guard_rookie';
UPDATE npcs SET level = 12, hire_cost = 2000 WHERE slug = 'npc_roland_knight_veteran';
UPDATE npcs SET level = 5,  hire_cost = 500  WHERE slug = 'npc_roland_priest_anna';
UPDATE npcs SET level = 15, hire_cost = 3000 WHERE slug = 'npc_roland_paladin_leo';
UPDATE npcs SET level = 5,  hire_cost = 600  WHERE slug = 'npc_roland_hunter_sam';
UPDATE npcs SET level = 7,  hire_cost = 800  WHERE slug = 'npc_roland_scholar';

-- マルカンド
UPDATE npcs SET level = 2,  hire_cost = 200  WHERE slug = 'npc_markand_thief_rat';
UPDATE npcs SET level = 3,  hire_cost = 350  WHERE slug = 'npc_markand_merchant_gim';
UPDATE npcs SET level = 4,  hire_cost = 400  WHERE slug = 'npc_markand_dancer_lila';
UPDATE npcs SET level = 4,  hire_cost = 450  WHERE slug = 'npc_markand_alchemist_zoe';
UPDATE npcs SET level = 8,  hire_cost = 1000 WHERE slug = 'npc_markand_merc_scimitar';
UPDATE npcs SET level = 7,  hire_cost = 900  WHERE slug = 'npc_markand_assassin_k';
UPDATE npcs SET level = 5,  hire_cost = 500  WHERE slug = 'npc_markand_bedouin';
UPDATE npcs SET level = 6,  hire_cost = 700  WHERE slug = 'npc_markand_genie_summoner';
UPDATE npcs SET level = 10, hire_cost = 1500 WHERE slug = 'npc_markand_slave_giant';
UPDATE npcs SET level = 3,  hire_cost = 300  WHERE slug = 'npc_markand_gambler';

-- 夜刀
UPDATE npcs SET level = 12, hire_cost = 2500 WHERE slug = 'npc_yato_ronin_kenji';
UPDATE npcs SET level = 3,  hire_cost = 300  WHERE slug = 'npc_yato_miko_sakura';
UPDATE npcs SET level = 5,  hire_cost = 600  WHERE slug = 'npc_yato_ninja_hanzo';
UPDATE npcs SET level = 4,  hire_cost = 400  WHERE slug = 'npc_yato_monk_hoichi';
UPDATE npcs SET level = 14, hire_cost = 3000 WHERE slug = 'npc_yato_samurai_general';
UPDATE npcs SET level = 5,  hire_cost = 500  WHERE slug = 'npc_yato_matagi';
UPDATE npcs SET level = 6,  hire_cost = 700  WHERE slug = 'npc_yato_onmyoji';
UPDATE npcs SET level = 3,  hire_cost = 350  WHERE slug = 'npc_yato_ashigaru';
UPDATE npcs SET level = 6,  hire_cost = 700  WHERE slug = 'npc_yato_kunoichi';
UPDATE npcs SET level = 5,  hire_cost = 500  WHERE slug = 'npc_yato_kannushi';

-- 華龍
UPDATE npcs SET level = 10, hire_cost = 1500 WHERE slug = 'npc_karyu_fist_li';
UPDATE npcs SET level = 4,  hire_cost = 400  WHERE slug = 'npc_karyu_taoist';
UPDATE npcs SET level = 10, hire_cost = 1500 WHERE slug = 'npc_karyu_spear_master';
UPDATE npcs SET level = 6,  hire_cost = 800  WHERE slug = 'npc_karyu_jiangshi';
UPDATE npcs SET level = 5,  hire_cost = 500  WHERE slug = 'npc_karyu_chef_wang';
UPDATE npcs SET level = 7,  hire_cost = 900  WHERE slug = 'npc_karyu_assassin_mei';
UPDATE npcs SET level = 10, hire_cost = 1500 WHERE slug = 'npc_karyu_wuseng';
UPDATE npcs SET level = 5,  hire_cost = 500  WHERE slug = 'npc_karyu_strategist';
UPDATE npcs SET level = 8,  hire_cost = 1000 WHERE slug = 'npc_karyu_drunk_master';
UPDATE npcs SET level = 12, hire_cost = 2000 WHERE slug = 'npc_karyu_bandit_boss';

-- 共通 (Free)
UPDATE npcs SET level = 8,  hire_cost = 1200 WHERE slug = 'npc_free_guts';
UPDATE npcs SET level = 1,  hire_cost = 50   WHERE slug = 'npc_free_porter';
UPDATE npcs SET level = 1,  hire_cost = 30   WHERE slug = 'npc_free_stray_dog';
UPDATE npcs SET level = 2,  hire_cost = 200  WHERE slug = 'npc_free_adventurer_a';
UPDATE npcs SET level = 1,  hire_cost = 50   WHERE slug = 'npc_free_cat';
UPDATE npcs SET level = 12, hire_cost = 2000 WHERE slug = 'npc_free_bear';
UPDATE npcs SET level = 8,  hire_cost = 1200 WHERE slug = 'npc_free_automaton';
UPDATE npcs SET level = 5,  hire_cost = 500  WHERE slug = 'npc_free_ghost_maid';
UPDATE npcs SET level = 10, hire_cost = 1800 WHERE slug = 'npc_free_cursed_armor';
UPDATE npcs SET level = 3,  hire_cost = 300  WHERE slug = 'npc_free_bard';
UPDATE npcs SET level = 12, hire_cost = 2500 WHERE slug = 'npc_free_griffon';
UPDATE npcs SET level = 1,  hire_cost = 1000 WHERE slug = 'npc_free_hero_statue';
UPDATE npcs SET level = 1,  hire_cost = 10   WHERE slug = 'npc_free_villager_mob';

-- ゲストNPC (無料: ストーリー自動参加)
UPDATE npcs SET level = 30, hire_cost = 0 WHERE slug = 'npc_guest_gawain';
UPDATE npcs SET level = 50, hire_cost = 0 WHERE slug = 'npc_guest_volg';
UPDATE npcs SET level = 40, hire_cost = 0 WHERE slug = 'npc_guest_shadow';
