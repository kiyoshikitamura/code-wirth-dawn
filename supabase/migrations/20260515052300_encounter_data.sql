-- ランダムエンカウント改善: 拠点固有エンカウント + 賞金稼ぎLv連動
-- spec_v16 §1 改善 (2026-05-15)

-- 1. 既存の goblin_squad (存在しないslug) データをクリア
DELETE FROM location_encounters;

-- 2. 賞金稼ぎグループをenemy_groups に追加 (CSV同期前の手動INSERT)
INSERT INTO enemy_groups (id, slug, members) VALUES
    (500, 'bounty_low', 'enemy_bounty_hunter_new|enemy_bounty_hunter_archer'),
    (501, 'bounty_mid', 'enemy_bounty_hunter_sword|enemy_bounty_hunter_sword'),
    (502, 'bounty_high', 'enemy_bounty_hunter_vet|enemy_bounty_mage_hunter'),
    (503, 'bounty_elite', 'enemy_bounty_executioner|enemy_bounty_hunter_vet'),
    (504, 'bounty_legend', 'enemy_bounty_royal_blade|enemy_bounty_legend|enemy_bounty_reaper')
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, members = EXCLUDED.members;

-- ========================================
-- 3. ランダムエンカウント (encounter_type = 'random')
-- ========================================

-- ■ ローランド聖王国
-- 国境の町 (loc_border_town)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'bandit_group', 1, 10, 3, 'random' FROM locations WHERE slug = 'loc_border_town';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'neutral_goblin_group', 1, 15, 2, 'random' FROM locations WHERE slug = 'loc_border_town';

-- 白亜の砦 (loc_white_fort)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'roland_undead_group', 5, 20, 2, 'random' FROM locations WHERE slug = 'loc_white_fort';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'roland_bandit_group', 5, 20, 2, 'random' FROM locations WHERE slug = 'loc_white_fort';

-- 鉄の鉱山村 (loc_iron_mine)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'neutral_wolf_group', 3, 15, 3, 'random' FROM locations WHERE slug = 'loc_iron_mine';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'neutral_goblin_group', 1, 10, 2, 'random' FROM locations WHERE slug = 'loc_iron_mine';

-- 港町 (loc_port_city)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'roland_bandit_group', 5, 20, 3, 'random' FROM locations WHERE slug = 'loc_port_city';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'roland_monster_group', 8, 25, 1, 'random' FROM locations WHERE slug = 'loc_port_city';

-- ■ 砂塵の王国マルカンド
-- 市場町 (loc_market_town)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'markand_desert_group', 5, 20, 3, 'random' FROM locations WHERE slug = 'loc_market_town';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'bandit_group', 1, 10, 1, 'random' FROM locations WHERE slug = 'loc_market_town';

-- オアシスの村 (loc_oasis)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'markand_desert_group', 5, 20, 2, 'random' FROM locations WHERE slug = 'loc_oasis';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'markand_worm_group', 10, 30, 2, 'random' FROM locations WHERE slug = 'loc_oasis';

-- 高原の村 (loc_highland)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'markand_desert_group', 5, 15, 2, 'random' FROM locations WHERE slug = 'loc_highland';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'neutral_wolf_group', 3, 15, 2, 'random' FROM locations WHERE slug = 'loc_highland';

-- 平原の都市 (loc_plains_city)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'roland_bandit_group', 5, 20, 2, 'random' FROM locations WHERE slug = 'loc_plains_city';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'markand_desert_group', 5, 20, 2, 'random' FROM locations WHERE slug = 'loc_plains_city';

-- ■ 夜刀神国
-- 門前町 (loc_temple_town)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'yato_yokai_group', 5, 15, 3, 'random' FROM locations WHERE slug = 'loc_temple_town';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'bandit_group', 1, 10, 1, 'random' FROM locations WHERE slug = 'loc_temple_town';

-- 谷間の集落 (loc_valley)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'yato_yokai_group', 5, 15, 2, 'random' FROM locations WHERE slug = 'loc_valley';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'yato_tengu_group', 10, 25, 2, 'random' FROM locations WHERE slug = 'loc_valley';

-- 最果ての村 (loc_frontier_village)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'yato_tengu_group', 10, 25, 3, 'random' FROM locations WHERE slug = 'loc_frontier_village';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'yato_yokai_group', 5, 15, 1, 'random' FROM locations WHERE slug = 'loc_frontier_village';

-- 保養地 (loc_resort)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'neutral_wolf_group', 3, 15, 2, 'random' FROM locations WHERE slug = 'loc_resort';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'yato_yokai_group', 5, 15, 2, 'random' FROM locations WHERE slug = 'loc_resort';

-- ■ 華龍神朝
-- 北の防衛砦 (loc_north_fort)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'karyu_spirit_group', 8, 20, 2, 'random' FROM locations WHERE slug = 'loc_north_fort';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'roland_bandit_group', 5, 20, 2, 'random' FROM locations WHERE slug = 'loc_north_fort';

-- 監視哨 (loc_monitor_post)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'karyu_spirit_group', 8, 20, 2, 'random' FROM locations WHERE slug = 'loc_monitor_post';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'karyu_terracotta_group', 12, 30, 2, 'random' FROM locations WHERE slug = 'loc_monitor_post';

-- 古代遺跡の町 (loc_ancient_ruins)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'karyu_terracotta_group', 12, 30, 3, 'random' FROM locations WHERE slug = 'loc_ancient_ruins';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'karyu_spirit_group', 8, 20, 1, 'random' FROM locations WHERE slug = 'loc_ancient_ruins';

-- 闘技都市 (loc_coliseum)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'karyu_spirit_group', 8, 20, 2, 'random' FROM locations WHERE slug = 'loc_coliseum';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'neutral_wolf_group', 3, 15, 2, 'random' FROM locations WHERE slug = 'loc_coliseum';

-- ■ 首都4都市（首都出発時もエンカウント発生）
-- 王都レガリア (loc_regalia)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'roland_bandit_group', 5, 20, 2, 'random' FROM locations WHERE slug = 'loc_regalia';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'roland_undead_group', 5, 20, 1, 'random' FROM locations WHERE slug = 'loc_regalia';

-- 黄金都市イスハーク (loc_meridia)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'markand_desert_group', 5, 20, 2, 'random' FROM locations WHERE slug = 'loc_meridia';

-- 神都「出雲」 (loc_yato)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'yato_yokai_group', 5, 15, 2, 'random' FROM locations WHERE slug = 'loc_yato';

-- 天極城「龍京」 (loc_charon)
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'karyu_spirit_group', 8, 20, 2, 'random' FROM locations WHERE slug = 'loc_charon';

-- ========================================
-- 4. 賞金稼ぎエンカウント (encounter_type = 'bounty_hunter')
--    全拠点にLv帯別5段階を登録
-- ========================================
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'bounty_low', 1, 5, 1, 'bounty_hunter' FROM locations WHERE slug != 'loc_hub';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'bounty_mid', 5, 15, 1, 'bounty_hunter' FROM locations WHERE slug != 'loc_hub';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'bounty_high', 10, 20, 1, 'bounty_hunter' FROM locations WHERE slug != 'loc_hub';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'bounty_elite', 15, 25, 1, 'bounty_hunter' FROM locations WHERE slug != 'loc_hub';
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT id, 'bounty_legend', 25, 99, 1, 'bounty_hunter' FROM locations WHERE slug != 'loc_hub';
