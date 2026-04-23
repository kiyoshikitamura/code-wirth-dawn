-- Migration: Set provisional ATK values for all NPCs
-- ATK is added to card damage (damage = card.effect_val + npc.atk)
-- Values are provisional and will be finalized in the balance adjustment phase
--
-- Design rationale for provisional ATK values:
--   Striker/attacker NPCs: ATK 3-8 (higher cost → higher ATK)
--   Tank/guardian NPCs: ATK 2-5
--   Healer/support NPCs: ATK 0-2
--   Animals/objects: ATK 0-5 based on lore
--   Guest NPCs: ATK 10-20 (hero-tier)

-- ============================================================
-- ローラン聖帝国

-- エレナ (Cleric, healer) → ATK 1
UPDATE npcs SET attack = 1 WHERE slug = 'npc_roland_elena';

-- ハンス (Guard, balanced) → ATK 3
UPDATE npcs SET attack = 3 WHERE slug = 'npc_roland_guard_rookie';

-- ガッド (Knight, tank) → ATK 3
UPDATE npcs SET attack = 3 WHERE slug = 'npc_roland_knight_veteran';

-- アンナ (Priest, healer) → ATK 0
UPDATE npcs SET attack = 0 WHERE slug = 'npc_roland_priest_anna';

-- レオ (Paladin, all-rounder) → ATK 4
UPDATE npcs SET attack = 4 WHERE slug = 'npc_roland_paladin_leo';

-- サム (Hunter, attacker) → ATK 5
UPDATE npcs SET attack = 5 WHERE slug = 'npc_roland_hunter_sam';

-- クロヴィス (Scholar, magic dps) → ATK 2
UPDATE npcs SET attack = 2 WHERE slug = 'npc_roland_scholar';

-- ============================================================
-- マルカンド

-- ラット (Thief, evasion) → ATK 3
UPDATE npcs SET attack = 3 WHERE slug = 'npc_markand_thief_rat';

-- ギム (Merchant, support) → ATK 1
UPDATE npcs SET attack = 1 WHERE slug = 'npc_markand_merchant_gim';

-- ライラ (Dancer, healer) → ATK 0
UPDATE npcs SET attack = 0 WHERE slug = 'npc_markand_dancer_lila';

-- ゾーイ (Alchemist, debuffer) → ATK 3
UPDATE npcs SET attack = 3 WHERE slug = 'npc_markand_alchemist_zoe';

-- バドル (Mercenary, poison) → ATK 5
UPDATE npcs SET attack = 5 WHERE slug = 'npc_markand_merc_scimitar';

-- K (Assassin, poison) → ATK 6
UPDATE npcs SET attack = 6 WHERE slug = 'npc_markand_assassin_k';

-- カシム (Scout, balanced) → ATK 4
UPDATE npcs SET attack = 4 WHERE slug = 'npc_markand_bedouin';

-- ハッサン (Summoner, magic) → ATK 2
UPDATE npcs SET attack = 2 WHERE slug = 'npc_markand_genie_summoner';

-- ゴリアテ (Slave, tank) → ATK 5
UPDATE npcs SET attack = 5 WHERE slug = 'npc_markand_slave_giant';

-- ジャック (Gambler, debuffer) → ATK 3
UPDATE npcs SET attack = 3 WHERE slug = 'npc_markand_gambler';

-- ============================================================
-- 夜刀

-- ケンジ (Samurai, striker) → ATK 8
UPDATE npcs SET attack = 8 WHERE slug = 'npc_yato_ronin_kenji';

-- サクラ (Miko, healer) → ATK 0
UPDATE npcs SET attack = 0 WHERE slug = 'npc_yato_miko_sakura';

-- ハンゾウ (Ninja, debuffer) → ATK 4
UPDATE npcs SET attack = 4 WHERE slug = 'npc_yato_ninja_hanzo';

-- ホウイチ (Monk, defense only) → ATK 2
UPDATE npcs SET attack = 2 WHERE slug = 'npc_yato_monk_hoichi';

-- ゴウ (Samurai, commander) → ATK 7
UPDATE npcs SET attack = 7 WHERE slug = 'npc_yato_samurai_general';

-- 老人 (Hunter, basic attacker) → ATK 4
UPDATE npcs SET attack = 4 WHERE slug = 'npc_yato_matagi';

-- アベ (Caster, stun) → ATK 2
UPDATE npcs SET attack = 2 WHERE slug = 'npc_yato_onmyoji';

-- ゴンペイ (Soldier, front line) → ATK 4
UPDATE npcs SET attack = 4 WHERE slug = 'npc_yato_ashigaru';

-- アヤメ (Ninja, poison) → ATK 5
UPDATE npcs SET attack = 5 WHERE slug = 'npc_yato_kunoichi';

-- ヤスマサ (Priest, healer) → ATK 1
UPDATE npcs SET attack = 1 WHERE slug = 'npc_yato_kannushi';

-- ============================================================
-- 華龍

-- リー (Monk, striker) → ATK 7
UPDATE npcs SET attack = 7 WHERE slug = 'npc_karyu_fist_li';

-- ウェイ (Taoist, support) → ATK 2
UPDATE npcs SET attack = 2 WHERE slug = 'npc_karyu_taoist';

-- リン (Lancer, piercer) → ATK 6
UPDATE npcs SET attack = 6 WHERE slug = 'npc_karyu_spear_master';

-- キョンシー (Undead, wall) → ATK 4
UPDATE npcs SET attack = 4 WHERE slug = 'npc_karyu_jiangshi';

-- ワン (Chef, hybrid) → ATK 3
UPDATE npcs SET attack = 3 WHERE slug = 'npc_karyu_chef_wang';

-- メイ (Assassin, poison+combo) → ATK 6
UPDATE npcs SET attack = 6 WHERE slug = 'npc_karyu_assassin_mei';

-- ジン (Monk, tanky) → ATK 5
UPDATE npcs SET attack = 5 WHERE slug = 'npc_karyu_wuseng';

-- シュウ (Tactician, backline) → ATK 1
UPDATE npcs SET attack = 1 WHERE slug = 'npc_karyu_strategist';

-- ソウ (Monk, evasion) → ATK 5
UPDATE npcs SET attack = 5 WHERE slug = 'npc_karyu_drunk_master';

-- バオ (Bandit, power) → ATK 7
UPDATE npcs SET attack = 7 WHERE slug = 'npc_karyu_bandit_boss';

-- ============================================================
-- 共通 (Free)

-- ガッツ (Mercenary, tank) → ATK 4
UPDATE npcs SET attack = 4 WHERE slug = 'npc_free_guts';

-- トビー (Porter, cheap) → ATK 2
UPDATE npcs SET attack = 2 WHERE slug = 'npc_free_porter';

-- 野犬 (Animal, cheapest wall) → ATK 3
UPDATE npcs SET attack = 3 WHERE slug = 'npc_free_stray_dog';

-- アレン (Adventurer, standard) → ATK 3
UPDATE npcs SET attack = 3 WHERE slug = 'npc_free_adventurer_a';

-- 猫 (Animal, healer) → ATK 0
UPDATE npcs SET attack = 0 WHERE slug = 'npc_free_cat';

-- 熊 (Animal, wild threat) → ATK 8
UPDATE npcs SET attack = 8 WHERE slug = 'npc_free_bear';

-- 自律人形 (Machine, lost tech) → ATK 5
UPDATE npcs SET attack = 5 WHERE slug = 'npc_free_automaton';

-- メイド (Ghost, DEF99) → ATK 0
UPDATE npcs SET attack = 0 WHERE slug = 'npc_free_ghost_maid';

-- 鎧 (Armor, full wall) → ATK 3
UPDATE npcs SET attack = 3 WHERE slug = 'npc_free_cursed_armor';

-- エドワード (Bard, heal only) → ATK 0
UPDATE npcs SET attack = 0 WHERE slug = 'npc_free_bard';

-- グリフォン (Monster, high cost) → ATK 6
UPDATE npcs SET attack = 6 WHERE slug = 'npc_free_griffon';

-- 石像 (Object, immovable) → ATK 0
UPDATE npcs SET attack = 0 WHERE slug = 'npc_free_hero_statue';

-- ボブ (Villager, civilian) → ATK 0
UPDATE npcs SET attack = 0 WHERE slug = 'npc_free_villager_mob';

-- ============================================================
-- ゲストNPC

-- ガウェイン (Knight, guest) → ATK 10
UPDATE npcs SET attack = 10 WHERE slug = 'npc_guest_gawain';

-- ヴォルグ (Mercenary, guest king) → ATK 20
UPDATE npcs SET attack = 20 WHERE slug = 'npc_guest_volg';

-- 英霊 (Adventurer, guest spirit) → ATK 15
UPDATE npcs SET attack = 15 WHERE slug = 'npc_guest_shadow';
