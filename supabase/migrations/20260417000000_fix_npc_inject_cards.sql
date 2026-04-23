-- Migration: Fix NPC inject_cards from old 4-digit format to new card IDs
-- Old format (e.g. '1010', '2005') → New format (e.g. '1', '9') matching cards.id
-- Source of truth: npcs.csv inject_card_ids column
-- Column type: text[] (PostgreSQL text array)

-- ============================================================
-- ガッツ (npc_free_guts): ['1010', '2005'] → ['1', '9'] (強打, 挑発)
UPDATE npcs SET inject_cards = ARRAY['1', '9'], default_cards = ARRAY['1', '9']
WHERE slug = 'npc_free_guts';

-- エレナ (npc_roland_elena): → ['14', '1'] (治癒, 強打)
UPDATE npcs SET inject_cards = ARRAY['14', '1'], default_cards = ARRAY['14', '1']
WHERE slug = 'npc_roland_elena';

-- トビー (npc_free_porter): → ['8', '1'] (クイックステップ, 強打)
UPDATE npcs SET inject_cards = ARRAY['8', '1'], default_cards = ARRAY['8', '1']
WHERE slug = 'npc_free_porter';

-- 野犬 (npc_free_stray_dog): → ['1'] (強打)
UPDATE npcs SET inject_cards = ARRAY['1'], default_cards = ARRAY['1']
WHERE slug = 'npc_free_stray_dog';

-- ハンス (npc_roland_guard_rookie): → ['2', '9'] (斬撃, 挑発)
UPDATE npcs SET inject_cards = ARRAY['2', '9'], default_cards = ARRAY['2', '9']
WHERE slug = 'npc_roland_guard_rookie';

-- ガッド (npc_roland_knight_veteran): → ['2', '4'] (斬撃, 防御)
UPDATE npcs SET inject_cards = ARRAY['2', '4'], default_cards = ARRAY['2', '4']
WHERE slug = 'npc_roland_knight_veteran';

-- アンナ (npc_roland_priest_anna): → ['14', '4'] (治癒, 防御)
UPDATE npcs SET inject_cards = ARRAY['14', '4'], default_cards = ARRAY['14', '4']
WHERE slug = 'npc_roland_priest_anna';

-- レオ (npc_roland_paladin_leo): → ['1', '4', '14'] (強打, 防御, 治癒)
UPDATE npcs SET inject_cards = ARRAY['1', '4', '14'], default_cards = ARRAY['1', '4', '14']
WHERE slug = 'npc_roland_paladin_leo';

-- サム (npc_roland_hunter_sam): → ['1', '3'] (強打, 突き)
UPDATE npcs SET inject_cards = ARRAY['1', '3'], default_cards = ARRAY['1', '3']
WHERE slug = 'npc_roland_hunter_sam';

-- クロヴィス (npc_roland_scholar): → ['12'] (裁き)
UPDATE npcs SET inject_cards = ARRAY['12'], default_cards = ARRAY['12']
WHERE slug = 'npc_roland_scholar';

-- ============================================================
-- マルカンド

-- ラット (npc_markand_thief_rat): → ['1', '8'] (強打, クイックステップ)
UPDATE npcs SET inject_cards = ARRAY['1', '8'], default_cards = ARRAY['1', '8']
WHERE slug = 'npc_markand_thief_rat';

-- ギム (npc_markand_merchant_gim): → ['1', '7'] (強打, 集中)
UPDATE npcs SET inject_cards = ARRAY['1', '7'], default_cards = ARRAY['1', '7']
WHERE slug = 'npc_markand_merchant_gim';

-- ライラ (npc_markand_dancer_lila): → ['14'] (治癒)
UPDATE npcs SET inject_cards = ARRAY['14'], default_cards = ARRAY['14']
WHERE slug = 'npc_markand_dancer_lila';

-- ゾーイ (npc_markand_alchemist_zoe): → ['10', '18'] (石投げ, 毒刃)
UPDATE npcs SET inject_cards = ARRAY['10', '18'], default_cards = ARRAY['10', '18']
WHERE slug = 'npc_markand_alchemist_zoe';

-- バドル (npc_markand_merc_scimitar): → ['18', '18'] (毒刃×2)
UPDATE npcs SET inject_cards = ARRAY['18', '18'], default_cards = ARRAY['18', '18']
WHERE slug = 'npc_markand_merc_scimitar';

-- K (npc_markand_assassin_k): → ['18', '1'] (毒刃, 強打)
UPDATE npcs SET inject_cards = ARRAY['18', '1'], default_cards = ARRAY['18', '1']
WHERE slug = 'npc_markand_assassin_k';

-- カシム (npc_markand_bedouin): → ['1', '10'] (強打, 石投げ)
UPDATE npcs SET inject_cards = ARRAY['1', '10'], default_cards = ARRAY['1', '10']
WHERE slug = 'npc_markand_bedouin';

-- ハッサン (npc_markand_genie_summoner): → ['10', '56'] (石投げ, 吸血)
UPDATE npcs SET inject_cards = ARRAY['10', '56'], default_cards = ARRAY['10', '56']
WHERE slug = 'npc_markand_genie_summoner';

-- ゴリアテ (npc_markand_slave_giant): → ['1'] (強打)
UPDATE npcs SET inject_cards = ARRAY['1'], default_cards = ARRAY['1']
WHERE slug = 'npc_markand_slave_giant';

-- ジャック (npc_markand_gambler): → ['1', '10'] (強打, 石投げ)
UPDATE npcs SET inject_cards = ARRAY['1', '10'], default_cards = ARRAY['1', '10']
WHERE slug = 'npc_markand_gambler';

-- ============================================================
-- 夜刀

-- ケンジ (npc_yato_ronin_kenji): → ['25', '25'] (居合切り×2)
UPDATE npcs SET inject_cards = ARRAY['25', '25'], default_cards = ARRAY['25', '25']
WHERE slug = 'npc_yato_ronin_kenji';

-- サクラ (npc_yato_miko_sakura): → ['4', '14'] (防御, 治癒)
UPDATE npcs SET inject_cards = ARRAY['4', '14'], default_cards = ARRAY['4', '14']
WHERE slug = 'npc_yato_miko_sakura';

-- ハンゾウ (npc_yato_ninja_hanzo): → ['22', '10'] (クナイ投げ, 石投げ)
UPDATE npcs SET inject_cards = ARRAY['22', '10'], default_cards = ARRAY['22', '10']
WHERE slug = 'npc_yato_ninja_hanzo';

-- ホウイチ (npc_yato_monk_hoichi): → ['4'] (防御)
UPDATE npcs SET inject_cards = ARRAY['4'], default_cards = ARRAY['4']
WHERE slug = 'npc_yato_monk_hoichi';

-- ゴウ (npc_yato_samurai_general): → ['25', '9'] (居合切り, 挑発)
UPDATE npcs SET inject_cards = ARRAY['25', '9'], default_cards = ARRAY['25', '9']
WHERE slug = 'npc_yato_samurai_general';

-- 老人 (npc_yato_matagi): → ['1', '3'] (強打, 突き)
UPDATE npcs SET inject_cards = ARRAY['1', '3'], default_cards = ARRAY['1', '3']
WHERE slug = 'npc_yato_matagi';

-- アベ (npc_yato_onmyoji): → ['23', '4'] (影縫い, 防御)
UPDATE npcs SET inject_cards = ARRAY['23', '4'], default_cards = ARRAY['23', '4']
WHERE slug = 'npc_yato_onmyoji';

-- ゴンペイ (npc_yato_ashigaru): → ['2'] (斬撃)
UPDATE npcs SET inject_cards = ARRAY['2'], default_cards = ARRAY['2']
WHERE slug = 'npc_yato_ashigaru';

-- アヤメ (npc_yato_kunoichi): → ['18', '1'] (毒刃, 強打)
UPDATE npcs SET inject_cards = ARRAY['18', '1'], default_cards = ARRAY['18', '1']
WHERE slug = 'npc_yato_kunoichi';

-- ヤスマサ (npc_yato_kannushi): → ['14', '4'] (治癒, 防御)
UPDATE npcs SET inject_cards = ARRAY['14', '4'], default_cards = ARRAY['14', '4']
WHERE slug = 'npc_yato_kannushi';

-- ============================================================
-- 華龍

-- リー (npc_karyu_fist_li): → ['29', '29'] (連撃×2)
UPDATE npcs SET inject_cards = ARRAY['29', '29'], default_cards = ARRAY['29', '29']
WHERE slug = 'npc_karyu_fist_li';

-- ウェイ (npc_karyu_taoist): → ['10', '4'] (石投げ, 防御)
UPDATE npcs SET inject_cards = ARRAY['10', '4'], default_cards = ARRAY['10', '4']
WHERE slug = 'npc_karyu_taoist';

-- リン (npc_karyu_spear_master): → ['3', '3'] (突き×2)
UPDATE npcs SET inject_cards = ARRAY['3', '3'], default_cards = ARRAY['3', '3']
WHERE slug = 'npc_karyu_spear_master';

-- キョンシー (npc_karyu_jiangshi): → ['29'] (連撃)
UPDATE npcs SET inject_cards = ARRAY['29'], default_cards = ARRAY['29']
WHERE slug = 'npc_karyu_jiangshi';

-- ワン (npc_karyu_chef_wang): → ['1', '14'] (強打, 治癒)
UPDATE npcs SET inject_cards = ARRAY['1', '14'], default_cards = ARRAY['1', '14']
WHERE slug = 'npc_karyu_chef_wang';

-- メイ (npc_karyu_assassin_mei): → ['18', '29'] (毒刃, 連撃)
UPDATE npcs SET inject_cards = ARRAY['18', '29'], default_cards = ARRAY['18', '29']
WHERE slug = 'npc_karyu_assassin_mei';

-- ジン (npc_karyu_wuseng): → ['29', '9'] (連撃, 挑発)
UPDATE npcs SET inject_cards = ARRAY['29', '9'], default_cards = ARRAY['29', '9']
WHERE slug = 'npc_karyu_wuseng';

-- シュウ (npc_karyu_strategist): → ['10', '4'] (石投げ, 防御)
UPDATE npcs SET inject_cards = ARRAY['10', '4'], default_cards = ARRAY['10', '4']
WHERE slug = 'npc_karyu_strategist';

-- ソウ (npc_karyu_drunk_master): → ['29', '8'] (連撃, クイックステップ)
UPDATE npcs SET inject_cards = ARRAY['29', '8'], default_cards = ARRAY['29', '8']
WHERE slug = 'npc_karyu_drunk_master';

-- バオ (npc_karyu_bandit_boss): → ['1', '1'] (強打×2)
UPDATE npcs SET inject_cards = ARRAY['1', '1'], default_cards = ARRAY['1', '1']
WHERE slug = 'npc_karyu_bandit_boss';

-- ============================================================
-- 共通 (Free)

-- アレン (npc_free_adventurer_a): → ['2'] (斬撃)
UPDATE npcs SET inject_cards = ARRAY['2'], default_cards = ARRAY['2']
WHERE slug = 'npc_free_adventurer_a';

-- 猫 (npc_free_cat): → ['5'] (応急手当)
UPDATE npcs SET inject_cards = ARRAY['5'], default_cards = ARRAY['5']
WHERE slug = 'npc_free_cat';

-- 熊 (npc_free_bear): → ['29', '29'] (連撃×2)
UPDATE npcs SET inject_cards = ARRAY['29', '29'], default_cards = ARRAY['29', '29']
WHERE slug = 'npc_free_bear';

-- 自律人形 (npc_free_automaton): → ['2', '10'] (斬撃, 石投げ)
UPDATE npcs SET inject_cards = ARRAY['2', '10'], default_cards = ARRAY['2', '10']
WHERE slug = 'npc_free_automaton';

-- メイド (npc_free_ghost_maid): → ['14', '4'] (治癒, 防御)
UPDATE npcs SET inject_cards = ARRAY['14', '4'], default_cards = ARRAY['14', '4']
WHERE slug = 'npc_free_ghost_maid';

-- 鎧 (npc_free_cursed_armor): → ['42'] (血の怒り)
UPDATE npcs SET inject_cards = ARRAY['42'], default_cards = ARRAY['42']
WHERE slug = 'npc_free_cursed_armor';

-- エドワード (npc_free_bard): → ['14'] (治癒)
UPDATE npcs SET inject_cards = ARRAY['14'], default_cards = ARRAY['14']
WHERE slug = 'npc_free_bard';

-- グリフォン (npc_free_griffon): → ['29', '1'] (連撃, 強打)
UPDATE npcs SET inject_cards = ARRAY['29', '1'], default_cards = ARRAY['29', '1']
WHERE slug = 'npc_free_griffon';

-- 石像 (npc_free_hero_statue): → ['8'] (クイックステップ)
UPDATE npcs SET inject_cards = ARRAY['8'], default_cards = ARRAY['8']
WHERE slug = 'npc_free_hero_statue';

-- ボブ (npc_free_villager_mob): → ['8'] (クイックステップ)
UPDATE npcs SET inject_cards = ARRAY['8'], default_cards = ARRAY['8']
WHERE slug = 'npc_free_villager_mob';

-- ============================================================
-- ゲストNPC

-- ガウェイン (npc_guest_gawain): → ['4', '9'] (防御, 挑発)
UPDATE npcs SET inject_cards = ARRAY['4', '9'], default_cards = ARRAY['4', '9']
WHERE slug = 'npc_guest_gawain';

-- ヴォルグ (npc_guest_volg): → ['1', '29', '28'] (強打, 連撃, 鉄布衫)
UPDATE npcs SET inject_cards = ARRAY['1', '29', '28'], default_cards = ARRAY['1', '29', '28']
WHERE slug = 'npc_guest_volg';

-- 英霊 (npc_guest_shadow): → ['2', '1', '4'] (斬撃, 強打, 防御)
UPDATE npcs SET inject_cards = ARRAY['2', '1', '4'], default_cards = ARRAY['2', '1', '4']
WHERE slug = 'npc_guest_shadow';
