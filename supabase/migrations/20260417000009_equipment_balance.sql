-- ============================================================
-- v2.9.3: 装備品バランス調整
-- 1. 既存装備10件のステータス修正
-- 2. 新規武器5種の追加
-- 3. 新規防具12種の追加
-- 装備総数: 37 → 54種
-- ============================================================

-- ■ 1. 既存装備ステータス修正（10件）

-- #1 商人の鞄: HP+5 → HP+15, ATK+2
UPDATE items SET effect_data = '{"hp_bonus":15,"atk_bonus":2,"description":"お金が増えると言われる魔法の鞄。"}'::jsonb
WHERE slug = 'item_merchant_bag';

-- #2 幸運のコイン: ATK+2 → ATK+4, HP+5
UPDATE items SET effect_data = '{"atk_bonus":4,"hp_bonus":5,"description":"会心の一撃が連発する不思議な硬貨。"}'::jsonb
WHERE slug = 'item_lucky_coin';

-- #3 黄金のサイコロ: ATK+3 → ATK+5, DEF+2
UPDATE items SET effect_data = '{"atk_bonus":5,"def_bonus":2,"description":"戦場の結果を運否天賦に任せる純金のサイコロ。"}'::jsonb
WHERE slug = 'item_golden_dice';

-- #4 商人のそろばん: ATK+3 → ATK+7
UPDATE items SET effect_data = '{"atk_bonus":7,"description":"所持金に応じたダメージを与える商人のそろばん。"}'::jsonb
WHERE slug = 'gear_merchant_abacus';

-- #5 呪いの仮面: ATK+8 → ATK+8, DEF-3
UPDATE items SET effect_data = '{"atk_bonus":8,"def_bonus":-3,"description":"圧倒的な力と引き換えに正気を削り取る仮面。"}'::jsonb
WHERE slug = 'gear_cursed_mask';

-- #6 盗賊の七つ道具: ステなし → DEF+1
UPDATE items SET effect_data = '{"def_bonus":1,"description":"宝箱の解錠成功率を上げる盗賊の道具。"}'::jsonb
WHERE slug = 'tool_lockpick';

-- #7 茶器セット: DEF+2 → DEF+3, HP+3
UPDATE items SET effect_data = '{"def_bonus":3,"hp_bonus":3,"description":"お茶で精神を統一し乱れた魔力を回復させる茶器。"}'::jsonb
WHERE slug = 'item_tea_set';

-- #9 青龍偃月刀: ATK+14 → ATK+12 (ナーフ)
UPDATE items SET effect_data = '{"atk_bonus":12,"description":"大薙刀で敵全体を薙ぎ払う。"}'::jsonb
WHERE slug = 'gear_dragon_spear';

-- #10 大賢者の杖: ATK+12 → ATK+12, HP+10
UPDATE items SET effect_data = '{"atk_bonus":12,"hp_bonus":10,"description":"装備すると魔法攻撃の威力が大幅に上がる。"}'::jsonb
WHERE slug = 'gear_archmage_staff';

-- ■ 2. 新規武器（5種）

-- 汎用武器 3種
INSERT INTO items (slug, name, type, sub_type, base_price, min_prosperity, nation_tags, is_black_market, effect_data)
VALUES
('gear_short_sword', 'ショートソード', 'equipment', 'weapon', 300, 1, NULL, false,
 '{"atk_bonus":3,"description":"軽量で扱いやすい短剣。冒険者の最初の一振りに最適。"}'::jsonb),
('gear_broadsword', '鉄の剣', 'equipment', 'weapon', 800, 2, NULL, false,
 '{"atk_bonus":6,"description":"鍛冶師が鍛えた標準的な鉄の剣。バランスの良い一振り。"}'::jsonb),
('gear_bastard_sword', 'バスタードソード', 'equipment', 'weapon', 1500, 3, NULL, false,
 '{"atk_bonus":9,"description":"片手でも両手でも扱える大型の剣。熟練者向けの重量級武器。"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, sub_type = EXCLUDED.sub_type,
    base_price = EXCLUDED.base_price, effect_data = EXCLUDED.effect_data;

-- マルカンド武器 2種
INSERT INTO items (slug, name, type, sub_type, base_price, min_prosperity, nation_tags, is_black_market, effect_data)
VALUES
('gear_scimitar', 'シミター', 'equipment', 'weapon', 1000, 2, ARRAY['loc_marcund'], false,
 '{"atk_bonus":6,"description":"砂漠の戦士が愛用する反りの深い曲刀。素早い斬撃に適する。"}'::jsonb),
('gear_djinn_blade', '魔人の曲刃', 'equipment', 'weapon', 2500, 4, ARRAY['loc_marcund'], false,
 '{"atk_bonus":11,"description":"砂漠の魔人が鍛えたとされる妖しく輝く曲刃。"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, sub_type = EXCLUDED.sub_type,
    base_price = EXCLUDED.base_price, nation_tags = EXCLUDED.nation_tags, effect_data = EXCLUDED.effect_data;

-- ■ 3. 新規防具（12種）

-- 汎用防具 3種
INSERT INTO items (slug, name, type, sub_type, base_price, min_prosperity, nation_tags, is_black_market, effect_data)
VALUES
('gear_leather_armor', '革鎧', 'equipment', 'armor', 200, 1, NULL, false,
 '{"def_bonus":2,"description":"なめし革を縫い合わせた基本的な防具。ないよりはマシ。"}'::jsonb),
('gear_chain_mail', '鎖帷子', 'equipment', 'armor', 600, 2, NULL, false,
 '{"def_bonus":5,"description":"金属の輪を編み込んだ鎖帷子。斬撃をよく防ぐ。"}'::jsonb),
('gear_plate_armor', '板金鎧', 'equipment', 'armor', 1200, 3, NULL, false,
 '{"def_bonus":8,"description":"厚い鉄板で要所を覆う実戦的な鎧。重いが頼りになる。"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, sub_type = EXCLUDED.sub_type,
    base_price = EXCLUDED.base_price, effect_data = EXCLUDED.effect_data;

-- ローラン防具 2種
INSERT INTO items (slug, name, type, sub_type, base_price, min_prosperity, nation_tags, is_black_market, effect_data)
VALUES
('gear_holy_vestment', '聖職者の祭服', 'equipment', 'armor', 800, 3, ARRAY['loc_holy_empire'], false,
 '{"def_bonus":5,"hp_bonus":5,"description":"聖職者が身に纏う祝福された祭服。治癒の力が宿る。"}'::jsonb),
('gear_paladin_plate', '聖騎士の全身鎧', 'equipment', 'armor', 3000, 5, ARRAY['loc_holy_empire'], false,
 '{"def_bonus":14,"description":"帝国最精鋭の聖騎士にのみ許される白銀の全身鎧。"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, sub_type = EXCLUDED.sub_type,
    base_price = EXCLUDED.base_price, nation_tags = EXCLUDED.nation_tags, effect_data = EXCLUDED.effect_data;

-- マルカンド防具 2種
INSERT INTO items (slug, name, type, sub_type, base_price, min_prosperity, nation_tags, is_black_market, effect_data)
VALUES
('gear_sand_guard', '砂防の革甲', 'equipment', 'armor', 500, 2, ARRAY['loc_marcund'], false,
 '{"def_bonus":3,"hp_bonus":5,"description":"砂漠の過酷な環境に耐えるために設計された軽量な革甲。"}'::jsonb),
('gear_sultan_robe', '王宮の絹衣', 'equipment', 'armor', 2000, 4, ARRAY['loc_marcund'], false,
 '{"def_bonus":7,"hp_bonus":8,"description":"マルカンド王宮に仕える者だけが着用を許される絹の衣。"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, sub_type = EXCLUDED.sub_type,
    base_price = EXCLUDED.base_price, nation_tags = EXCLUDED.nation_tags, effect_data = EXCLUDED.effect_data;

-- 夜刀防具 2種
INSERT INTO items (slug, name, type, sub_type, base_price, min_prosperity, nation_tags, is_black_market, effect_data)
VALUES
('gear_shinobi_garb', '忍装束', 'equipment', 'armor', 600, 2, ARRAY['loc_yatoshin'], false,
 '{"def_bonus":3,"description":"音を立てず身を隠すための黒い装束。軽量で動きやすい。"}'::jsonb),
('gear_oni_yoroi', '鬼武者の鎧', 'equipment', 'armor', 3000, 5, ARRAY['loc_yatoshin'], false,
 '{"def_bonus":13,"description":"鬼の力が宿ると伝えられる古の武者鎧。圧倒的な重厚感。"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, sub_type = EXCLUDED.sub_type,
    base_price = EXCLUDED.base_price, nation_tags = EXCLUDED.nation_tags, effect_data = EXCLUDED.effect_data;

-- 華龍防具 3種（道着含む）
INSERT INTO items (slug, name, type, sub_type, base_price, min_prosperity, nation_tags, is_black_market, effect_data)
VALUES
('gear_monk_robe', '僧衣', 'equipment', 'armor', 500, 2, ARRAY['loc_haryu'], false,
 '{"def_bonus":3,"description":"少林寺の僧侶が纏う質素な衣。修行の証。"}'::jsonb),
('gear_karyu_vest', '道着', 'equipment', 'armor', 1200, 3, ARRAY['loc_haryu'], false,
 '{"def_bonus":6,"description":"拳法家が鍛錬時に着用する丈夫な道着。動きを妨げない。"}'::jsonb),
('gear_dragon_scale', '龍鱗の鎧', 'equipment', 'armor', 2800, 4, ARRAY['loc_haryu'], false,
 '{"def_bonus":11,"description":"龍の鱗を編み込んで作られた伝説の鎧。炎にも刃にも強い。"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type, sub_type = EXCLUDED.sub_type,
    base_price = EXCLUDED.base_price, nation_tags = EXCLUDED.nation_tags, effect_data = EXCLUDED.effect_data;

-- ■ 4. 確認クエリ
SELECT slug, name, sub_type, base_price,
       effect_data->>'atk_bonus' AS atk,
       effect_data->>'def_bonus' AS def,
       effect_data->>'hp_bonus' AS hp
FROM items
WHERE type = 'equipment'
ORDER BY sub_type, base_price;
