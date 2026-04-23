-- ============================================================
-- メインシナリオ関連データ同期SQL (修正版)
-- 実行日: 2026-04-22
-- 対象: Supabase (PostgreSQL)
-- ============================================================

-- ============================================================
-- 1. 新規ボスエネミー (7体: ID 2104-2110)
-- ============================================================
INSERT INTO enemies (id, slug, name, level, hp, atk, def, exp, gold, spawn_type)
VALUES
    (2104, 'enemy_boss_mercenary_king', '不死の傭兵王', 25, 2000, 75, 15, 0, 0, 'quest_only'),
    (2105, 'enemy_boss_ruin_guardian', '遺跡の守護者', 35, 3000, 90, 20, 0, 0, 'quest_only'),
    (2106, 'enemy_boss_gate_keeper', '天門の番人', 45, 4000, 110, 22, 0, 0, 'quest_only'),
    (2107, 'enemy_angel_soldier', '天使兵', 40, 800, 80, 18, 0, 0, 'quest_only'),
    (2108, 'enemy_boss_archangel', '大天使', 48, 3500, 100, 20, 0, 0, 'quest_only'),
    (2109, 'enemy_boss_system_guard', 'システムの守護者', 55, 6000, 130, 25, 0, 0, 'quest_only'),
    (2110, 'enemy_boss_god_dragon', '神竜', 58, 8000, 145, 28, 0, 0, 'quest_only')
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    hp = EXCLUDED.hp,
    atk = EXCLUDED.atk,
    def = EXCLUDED.def,
    exp = EXCLUDED.exp,
    gold = EXCLUDED.gold,
    spawn_type = EXCLUDED.spawn_type;

-- ============================================================
-- 2. 旧enemy_groups (ID 1-6) 削除
-- ============================================================
DELETE FROM enemy_groups WHERE id IN (1, 2, 3, 4, 5, 6);

-- ============================================================
-- 3. 新規ストーリー敵グループ (ID 200-222)
--    members は JSON配列形式 (["slug1","slug2"])
-- ============================================================
INSERT INTO enemy_groups (id, slug, members)
VALUES
    (200, 'main_bandit_squad', '["enemy_bandit_thug","enemy_bandit_thug"]'),
    (201, 'main_markand_spy', '["enemy_bandit_guard","enemy_markand_scorpion"]'),
    (202, 'main_empire_clash', '["enemy_bandit_guard","enemy_bandit_guard"]'),
    (203, 'main_empire_elite', '["enemy_boss_ep5_squad"]'),
    (204, 'main_yato_pursuit', '["enemy_yato_onibi","enemy_yato_karakasa"]'),
    (205, 'main_samurai_trial', '["enemy_yato_tengu","enemy_yato_tengu"]'),
    (206, 'main_assassin_night', '["enemy_assassin_trainee","enemy_assassin_trainee"]'),
    (207, 'main_assassin_boss', '["enemy_assassin_master"]'),
    (208, 'main_escort_ambush', '["enemy_yato_tengu","enemy_yato_onibi"]'),
    (209, 'main_guardian_dragon', '["enemy_boss_ep10_dragon"]'),
    (210, 'main_karyu_wall', '["enemy_karyu_terracotta","enemy_karyu_terracotta"]'),
    (211, 'main_river_defense', '["enemy_karyu_jiangshi","enemy_karyu_terracotta"]'),
    (212, 'main_river_boss', '["enemy_karyu_fox","enemy_karyu_fox"]'),
    (213, 'main_mercenary_king', '["enemy_boss_mercenary_king"]'),
    (214, 'main_castle_siege', '["enemy_karyu_terracotta","enemy_karyu_jiangshi","enemy_karyu_terracotta"]'),
    (215, 'main_ruin_guardian', '["enemy_boss_ruin_guardian"]'),
    (216, 'main_reunion_test', '["enemy_bandit_guard","enemy_bandit_guard"]'),
    (217, 'main_gate_keeper', '["enemy_boss_gate_keeper"]'),
    (218, 'main_angel_army_a', '["enemy_angel_soldier","enemy_angel_soldier"]'),
    (219, 'main_angel_army_b', '["enemy_angel_soldier","enemy_boss_archangel"]'),
    (220, 'main_system_guard', '["enemy_boss_system_guard"]'),
    (221, 'main_god_dragon', '["enemy_boss_god_dragon"]'),
    (222, 'main_god_core', '["enemy_boss_ep20_god"]')
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    members = EXCLUDED.members;

-- ============================================================
-- 4. ストーリー限定装備 (4アイテム: ID 501-504)
-- ============================================================
INSERT INTO items (id, slug, name, type, sub_type, base_price, nation_tags, min_prosperity, is_black_market, effect_data)
VALUES
    (501, 'story_gawain_gauntlet', 'ガウェインの小手', 'equipment', 'armor', 0, NULL, 1, false,
     '{"def_bonus":7,"hp_bonus":5,"description":"「生き残れ」——名もなき辺境で散った老騎士の最後の言葉と共に遺された小手。無数の戦場で主人を守り抜いた鉄の温もりが、今も微かに残っている。"}'),
    (502, 'story_dragon_fang', '竜牙の剣', 'equipment', 'weapon', 0, NULL, 1, false,
     '{"atk_bonus":12,"def_bonus":2,"description":"神代の守護竜の牙から鍛えた剣。刀身には天界の紋様が浮かび上がり、「神に弓引く者」の証として、持ち主に叛逆の力を宿す。"}'),
    (503, 'story_heroic_mail', '英霊の鎖帷子', 'equipment', 'armor', 0, NULL, 1, false,
     '{"def_bonus":14,"hp_bonus":10,"description":"神々に抗った古代の英雄たちの残留魔力が編み込まれた鎖帷子。纏う者の傷を癒し、折れかけた心を奮い立たせる不思議な温もりがある。"}'),
    (504, 'story_dawn_blade', '蒼暁の剣', 'equipment', 'weapon', 0, NULL, 1, false,
     '{"atk_bonus":25,"hp_bonus":15,"description":"主神を打ち砕いた光が凝縮した、蒼く輝く剣。全ての戦場で流された血と涙が、この一振りに「自由」という名の意味を刻んだ。ゲームクリアの証。"}')
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    sub_type = EXCLUDED.sub_type,
    base_price = EXCLUDED.base_price,
    nation_tags = EXCLUDED.nation_tags,
    min_prosperity = EXCLUDED.min_prosperity,
    is_black_market = EXCLUDED.is_black_market,
    effect_data = EXCLUDED.effect_data;

-- ============================================================
-- 5. 確認クエリ
-- ============================================================
SELECT id, slug, name, level, hp FROM enemies WHERE id BETWEEN 2104 AND 2110 ORDER BY id;
SELECT id, slug FROM enemy_groups WHERE id <= 6;
SELECT id, slug, members FROM enemy_groups WHERE id BETWEEN 200 AND 222 ORDER BY id;
SELECT id, slug, name, type, sub_type FROM items WHERE id BETWEEN 501 AND 504 ORDER BY id;
