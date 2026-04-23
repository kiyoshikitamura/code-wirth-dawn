-- ============================================================
-- Migration: NPC ATK/DEF 上方修正 (v2.9.3f)
-- 
-- NPCは装備品を装着できないため、レベル帯に応じた
-- 「装備相当値」をATK/DEFに直接加算する。
--
-- 加算ルール (元提案の80%):
--   Lv 1-9  (Low)   : ATK+2, DEF+2
--   Lv 10-19 (Mid)  : ATK+4, DEF+3
--   Lv 20-29 (High) : ATK+6, DEF+5
--   Lv 30-50 (Elite): ATK+8, DEF+6
--
-- ヒーラー系はATK加算をさらに80% (端数切り捨て):
--   Lv 1-9  : ATK+2, DEF+2
--   Lv 10-19: ATK+3, DEF+2
--   Lv 20-29: ATK+5, DEF+4
--   Lv 30-50: ATK+6, DEF+5
--
-- 据え置き: メイド(DEF99特殊), 石像, ボブ(最弱), ゲストNPC全員
-- ============================================================

-- DEFカラムがまだない場合を想定して追加
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS defense INTEGER DEFAULT 0;

-- ============================================================
-- ローラン聖帝国
-- ============================================================

-- エレナ (Cleric, healer) Lv5 — ATK: 1→3, DEF: 0→2
UPDATE npcs SET attack = 3, defense = 2 WHERE slug = 'npc_roland_elena';

-- ハンス (Guard) Lv8 — ATK: 3→5, DEF: 0→2
UPDATE npcs SET attack = 5, defense = 2 WHERE slug = 'npc_roland_guard_rookie';

-- ガッド (Knight, tank) Lv15 — ATK: 3→7, DEF: 0→3
UPDATE npcs SET attack = 7, defense = 3 WHERE slug = 'npc_roland_knight_veteran';

-- アンナ (Priest, healer) Lv10 — ATK: 0→3, DEF: 0→2
UPDATE npcs SET attack = 3, defense = 2 WHERE slug = 'npc_roland_priest_anna';

-- レオ (Paladin, all-round) Lv20 — ATK: 4→10, DEF: 0→5
UPDATE npcs SET attack = 10, defense = 5 WHERE slug = 'npc_roland_paladin_leo';

-- サム (Hunter, attacker) Lv12 — ATK: 5→9, DEF: 0→3
UPDATE npcs SET attack = 9, defense = 3 WHERE slug = 'npc_roland_hunter_sam';

-- クロヴィス (Scholar, magic DPS) Lv15 — ATK: 2→6, DEF: 0→3
UPDATE npcs SET attack = 6, defense = 3 WHERE slug = 'npc_roland_scholar';

-- ============================================================
-- マルカンド
-- ============================================================

-- ラット (Thief, evasion) Lv5 — ATK: 3→5, DEF: 0→2
UPDATE npcs SET attack = 5, defense = 2 WHERE slug = 'npc_markand_thief_rat';

-- ギム (Merchant, support) Lv8 — ATK: 1→3, DEF: 0→2
UPDATE npcs SET attack = 3, defense = 2 WHERE slug = 'npc_markand_merchant_gim';

-- ライラ (Dancer, healer) Lv10 — ATK: 0→3, DEF: 0→2
UPDATE npcs SET attack = 3, defense = 2 WHERE slug = 'npc_markand_dancer_lila';

-- ゾーイ (Alchemist, debuffer) Lv12 — ATK: 3→7, DEF: 0→3
UPDATE npcs SET attack = 7, defense = 3 WHERE slug = 'npc_markand_alchemist_zoe';

-- バドル (Mercenary, attacker) Lv15 — ATK: 5→9, DEF: 0→3
UPDATE npcs SET attack = 9, defense = 3 WHERE slug = 'npc_markand_merc_scimitar';

-- K (Assassin, poison) Lv18 — ATK: 6→10, DEF: 0→3
UPDATE npcs SET attack = 10, defense = 3 WHERE slug = 'npc_markand_assassin_k';

-- カシム (Scout, balanced) Lv10 — ATK: 4→8, DEF: 0→3
UPDATE npcs SET attack = 8, defense = 3 WHERE slug = 'npc_markand_bedouin';

-- ハッサン (Summoner, magic) Lv20 — ATK: 2→8, DEF: 0→5
UPDATE npcs SET attack = 8, defense = 5 WHERE slug = 'npc_markand_genie_summoner';

-- ゴリアテ (Slave, tank) Lv15 — ATK: 5→9, DEF: 0→3
UPDATE npcs SET attack = 9, defense = 3 WHERE slug = 'npc_markand_slave_giant';

-- ジャック (Gambler, debuffer) Lv8 — ATK: 3→5, DEF: 0→2
UPDATE npcs SET attack = 5, defense = 2 WHERE slug = 'npc_markand_gambler';

-- ============================================================
-- 夜刀
-- ============================================================

-- ケンジ (Samurai, striker) Lv18 — ATK: 8→12, DEF: 0→3
UPDATE npcs SET attack = 12, defense = 3 WHERE slug = 'npc_yato_ronin_kenji';

-- サクラ (Miko, healer) Lv10 — ATK: 0→3, DEF: 0→2
UPDATE npcs SET attack = 3, defense = 2 WHERE slug = 'npc_yato_miko_sakura';

-- ハンゾウ (Ninja, debuffer) Lv15 — ATK: 4→8, DEF: 0→3
UPDATE npcs SET attack = 8, defense = 3 WHERE slug = 'npc_yato_ninja_hanzo';

-- ホウイチ (Monk, defense) Lv12 — ATK: 2→6, DEF: 0→3
UPDATE npcs SET attack = 6, defense = 3 WHERE slug = 'npc_yato_monk_hoichi';

-- ゴウ (Samurai, commander) Lv25 — ATK: 7→13, DEF: 0→5
UPDATE npcs SET attack = 13, defense = 5 WHERE slug = 'npc_yato_samurai_general';

-- 老人 (Hunter, attacker) Lv10 — ATK: 4→8, DEF: 0→3
UPDATE npcs SET attack = 8, defense = 3 WHERE slug = 'npc_yato_matagi';

-- アベ (Caster, stun) Lv15 — ATK: 2→6, DEF: 0→3
UPDATE npcs SET attack = 6, defense = 3 WHERE slug = 'npc_yato_onmyoji';

-- ゴンペイ (Soldier, front line) Lv8 — ATK: 4→6, DEF: 0→2
UPDATE npcs SET attack = 6, defense = 2 WHERE slug = 'npc_yato_ashigaru';

-- アヤメ (Ninja, poison) Lv15 — ATK: 5→9, DEF: 0→3
UPDATE npcs SET attack = 9, defense = 3 WHERE slug = 'npc_yato_kunoichi';

-- ヤスマサ (Priest, healer) Lv12 — ATK: 1→4, DEF: 0→2
UPDATE npcs SET attack = 4, defense = 2 WHERE slug = 'npc_yato_kannushi';

-- ============================================================
-- 華龍
-- ============================================================

-- リー (Monk, striker) Lv18 — ATK: 7→11, DEF: 0→3
UPDATE npcs SET attack = 11, defense = 3 WHERE slug = 'npc_karyu_fist_li';

-- ウェイ (Taoist, support) Lv12 — ATK: 2→6, DEF: 0→3
UPDATE npcs SET attack = 6, defense = 3 WHERE slug = 'npc_karyu_taoist';

-- リン (Lancer, piercer) Lv20 — ATK: 6→12, DEF: 0→5
UPDATE npcs SET attack = 12, defense = 5 WHERE slug = 'npc_karyu_spear_master';

-- キョンシー (Undead, wall) Lv10 — ATK: 4→8, DEF: 0→3
UPDATE npcs SET attack = 8, defense = 3 WHERE slug = 'npc_karyu_jiangshi';

-- ワン (Chef, hybrid) Lv12 — ATK: 3→7, DEF: 0→3
UPDATE npcs SET attack = 7, defense = 3 WHERE slug = 'npc_karyu_chef_wang';

-- メイ (Assassin, poison) Lv18 — ATK: 6→10, DEF: 0→3
UPDATE npcs SET attack = 10, defense = 3 WHERE slug = 'npc_karyu_assassin_mei';

-- ジン (Monk, tank) Lv15 — ATK: 5→9, DEF: 0→3
UPDATE npcs SET attack = 9, defense = 3 WHERE slug = 'npc_karyu_wuseng';

-- シュウ (Tactician, backline) Lv20 — ATK: 1→7, DEF: 0→5
UPDATE npcs SET attack = 7, defense = 5 WHERE slug = 'npc_karyu_strategist';

-- ソウ (Monk, evasion) Lv18 — ATK: 5→9, DEF: 0→3
UPDATE npcs SET attack = 9, defense = 3 WHERE slug = 'npc_karyu_drunk_master';

-- バオ (Bandit, power) Lv22 — ATK: 7→13, DEF: 0→5
UPDATE npcs SET attack = 13, defense = 5 WHERE slug = 'npc_karyu_bandit_boss';

-- ============================================================
-- Free (共通)
-- ============================================================

-- ガッツ (Mercenary, tank) Lv10 — ATK: 4→8, DEF: 10→10 (既存DEF据え置き)
UPDATE npcs SET attack = 8 WHERE slug = 'npc_free_guts';

-- トビー (Porter, cheap) Lv1 — ATK: 2→4, DEF: 0→2
UPDATE npcs SET attack = 4, defense = 2 WHERE slug = 'npc_free_porter';

-- 野犬 (Animal, cheapest) Lv1 — ATK: 3→5, DEF: 0→2
UPDATE npcs SET attack = 5, defense = 2 WHERE slug = 'npc_free_stray_dog';

-- アレン (Adventurer, standard) Lv5 — ATK: 3→5, DEF: 0→2
UPDATE npcs SET attack = 5, defense = 2 WHERE slug = 'npc_free_adventurer_a';

-- 猫 (healer) Lv1 — ATK: 0→2, DEF: 0→2
UPDATE npcs SET attack = 2, defense = 2 WHERE slug = 'npc_free_cat';

-- 熊 (Animal, wild) Lv10 — ATK: 8→12, DEF: 0→3
UPDATE npcs SET attack = 12, defense = 3 WHERE slug = 'npc_free_bear';

-- 自律人形 (Machine) Lv15 — ATK: 5→9, DEF: 0→3
UPDATE npcs SET attack = 9, defense = 3 WHERE slug = 'npc_free_automaton';

-- メイド (DEF99 特殊設計) → 据え置き
-- UPDATE npcs SET attack = 0, defense = 99 WHERE slug = 'npc_free_ghost_maid';

-- 鎧 (Armor, wall) Lv10 — ATK: 3→7, DEF: 0→3
UPDATE npcs SET attack = 7, defense = 3 WHERE slug = 'npc_free_cursed_armor';

-- エドワード (Bard, heal only) Lv8 — ATK: 0→2, DEF: 0→2
UPDATE npcs SET attack = 2, defense = 2 WHERE slug = 'npc_free_bard';

-- グリフォン (Monster, high cost) Lv20 — ATK: 6→12, DEF: 0→5
UPDATE npcs SET attack = 12, defense = 5 WHERE slug = 'npc_free_griffon';

-- 石像 (意図的設計) → 据え置き
-- UPDATE npcs SET attack = 0, defense = 0 WHERE slug = 'npc_free_hero_statue';

-- ボブ (意図的設計) → 据え置き
-- UPDATE npcs SET attack = 0, defense = 0 WHERE slug = 'npc_free_villager_mob';

-- ============================================================
-- ゲストNPC → 全員据え置き（後日バランス再修正予定）
-- ============================================================
-- UPDATE npcs SET attack = 10 WHERE slug = 'npc_guest_gawain';
-- UPDATE npcs SET attack = 20 WHERE slug = 'npc_guest_volg';
-- UPDATE npcs SET attack = 15 WHERE slug = 'npc_guest_shadow';
