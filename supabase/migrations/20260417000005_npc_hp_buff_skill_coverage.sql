-- Migration: NPC HP上方修正 + スキルカバレッジ改善
-- v2.9.1: HP ×1.25〜1.43 補正（39体）+ 未使用スキル13種の配置（12体）
-- CSV (src/data/csv/npcs.csv) と完全同期

-- ============================================================
-- 1. HP上方修正（39体）
-- ============================================================

-- ローラン聖帝国
UPDATE npcs SET max_hp = 80  WHERE slug = 'npc_roland_elena';           -- 60→80
UPDATE npcs SET max_hp = 110 WHERE slug = 'npc_roland_guard_rookie';    -- 80→110
UPDATE npcs SET max_hp = 250 WHERE slug = 'npc_roland_knight_veteran';  -- 200→250
UPDATE npcs SET max_hp = 100 WHERE slug = 'npc_roland_priest_anna';     -- 70→100
UPDATE npcs SET max_hp = 300 WHERE slug = 'npc_roland_paladin_leo';     -- 240→300
UPDATE npcs SET max_hp = 120 WHERE slug = 'npc_roland_hunter_sam';      -- 90→120
UPDATE npcs SET max_hp = 70  WHERE slug = 'npc_roland_scholar';         -- 50→70

-- マルカンド
UPDATE npcs SET max_hp = 80  WHERE slug = 'npc_markand_thief_rat';      -- 60→80
UPDATE npcs SET max_hp = 110 WHERE slug = 'npc_markand_merchant_gim';   -- 80→110
UPDATE npcs SET max_hp = 100 WHERE slug = 'npc_markand_dancer_lila';    -- 70→100
UPDATE npcs SET max_hp = 80  WHERE slug = 'npc_markand_alchemist_zoe';  -- 60→80
UPDATE npcs SET max_hp = 160 WHERE slug = 'npc_markand_merc_scimitar';  -- 120→160
UPDATE npcs SET max_hp = 100 WHERE slug = 'npc_markand_assassin_k';     -- 80→100
UPDATE npcs SET max_hp = 130 WHERE slug = 'npc_markand_bedouin';        -- 100→130
UPDATE npcs SET max_hp = 70  WHERE slug = 'npc_markand_genie_summoner'; -- 50→70
UPDATE npcs SET max_hp = 100 WHERE slug = 'npc_markand_gambler';        -- 70→100

-- 夜刀
UPDATE npcs SET max_hp = 180 WHERE slug = 'npc_yato_ronin_kenji';       -- 140→180
UPDATE npcs SET max_hp = 80  WHERE slug = 'npc_yato_miko_sakura';       -- 60→80
UPDATE npcs SET max_hp = 110 WHERE slug = 'npc_yato_ninja_hanzo';       -- 80→110
UPDATE npcs SET max_hp = 110 WHERE slug = 'npc_yato_monk_hoichi';       -- 80→110
UPDATE npcs SET max_hp = 230 WHERE slug = 'npc_yato_samurai_general';   -- 180→230
UPDATE npcs SET max_hp = 130 WHERE slug = 'npc_yato_matagi';            -- 100→130
UPDATE npcs SET max_hp = 100 WHERE slug = 'npc_yato_onmyoji';           -- 70→100
UPDATE npcs SET max_hp = 120 WHERE slug = 'npc_yato_ashigaru';          -- 90→120
UPDATE npcs SET max_hp = 100 WHERE slug = 'npc_yato_kunoichi';          -- 70→100
UPDATE npcs SET max_hp = 110 WHERE slug = 'npc_yato_kannushi';          -- 80→110

-- 華龍
UPDATE npcs SET max_hp = 160 WHERE slug = 'npc_karyu_fist_li';          -- 120→160
UPDATE npcs SET max_hp = 100 WHERE slug = 'npc_karyu_taoist';           -- 70→100
UPDATE npcs SET max_hp = 200 WHERE slug = 'npc_karyu_spear_master';     -- 150→200
UPDATE npcs SET max_hp = 260 WHERE slug = 'npc_karyu_jiangshi';         -- 200→260
UPDATE npcs SET max_hp = 130 WHERE slug = 'npc_karyu_chef_wang';        -- 100→130
UPDATE npcs SET max_hp = 100 WHERE slug = 'npc_karyu_assassin_mei';     -- 80→100
UPDATE npcs SET max_hp = 210 WHERE slug = 'npc_karyu_wuseng';           -- 160→210
UPDATE npcs SET max_hp = 80  WHERE slug = 'npc_karyu_strategist';       -- 60→80
UPDATE npcs SET max_hp = 150 WHERE slug = 'npc_karyu_drunk_master';     -- 110→150
UPDATE npcs SET max_hp = 230 WHERE slug = 'npc_karyu_bandit_boss';      -- 180→230

-- 共通
UPDATE npcs SET max_hp = 200 WHERE slug = 'npc_free_guts';              -- 160→200
UPDATE npcs SET max_hp = 130 WHERE slug = 'npc_free_adventurer_a';      -- 100→130
UPDATE npcs SET max_hp = 160 WHERE slug = 'npc_free_automaton';         -- 120→160
UPDATE npcs SET max_hp = 80  WHERE slug = 'npc_free_bard';              -- 60→80
UPDATE npcs SET max_hp = 260 WHERE slug = 'npc_free_griffon';           -- 200→260

-- ============================================================
-- 2. スキルカバレッジ改善（12体のスキル入れ替え）
-- ============================================================

-- ガッド: 斬撃(2)→シールドバッシュ(6)  [騎士の盾攻撃]
UPDATE npcs SET inject_cards = ARRAY[6, 4] WHERE slug = 'npc_roland_knight_veteran';

-- アンナ: 防御(4)→祈り(13)  [神官の全体回復]
UPDATE npcs SET inject_cards = ARRAY[14, 13] WHERE slug = 'npc_roland_priest_anna';

-- レオ: 強打(1)→聖剣(11), 防御(4)→聖壁(15)  [万能パラディン]
UPDATE npcs SET inject_cards = ARRAY[11, 15, 14] WHERE slug = 'npc_roland_paladin_leo';

-- ギム: 強打(1)→オアシスの水(20)  [商人の回復水]
UPDATE npcs SET inject_cards = ARRAY[20, 7] WHERE slug = 'npc_markand_merchant_gim';

-- カシム: 石投げ(10)→砂の罠(16)  [斥候の罠]
UPDATE npcs SET inject_cards = ARRAY[1, 16] WHERE slug = 'npc_markand_bedouin';

-- ハッサン: 石投げ(10)→蜃気楼(19)  [ランプの幻影]
UPDATE npcs SET inject_cards = ARRAY[19, 56] WHERE slug = 'npc_markand_genie_summoner';

-- ジャック: 石投げ(10)→砂塵の目眩まし(17)  [トリックスター]
UPDATE npcs SET inject_cards = ARRAY[1, 17] WHERE slug = 'npc_markand_gambler';

-- 老人: 突き(3)→ツバメ返し(21)  [古強者の秘技]
UPDATE npcs SET inject_cards = ARRAY[1, 21] WHERE slug = 'npc_yato_matagi';

-- ヤスマサ: 防御(4)→清め(24)  [神主の浄化]
UPDATE npcs SET inject_cards = ARRAY[14, 24] WHERE slug = 'npc_yato_kannushi';

-- ウェイ: 石投げ(10)→飛刀(30)  [道士の暗器]
UPDATE npcs SET inject_cards = ARRAY[30, 4] WHERE slug = 'npc_karyu_taoist';

-- ワン: 治癒(14)→氣の癒やし(26)  [華龍の気功回復]
UPDATE npcs SET inject_cards = ARRAY[1, 26] WHERE slug = 'npc_karyu_chef_wang';

-- バオ: 強打(1)の1つ→龍の咆哮(27)  [山賊王の威圧]
UPDATE npcs SET inject_cards = ARRAY[1, 27] WHERE slug = 'npc_karyu_bandit_boss';
