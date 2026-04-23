-- ============================================================
-- v2.9.2: ドロップアイテム修正
-- 1. 新規アイテム4件の追加（欠落ドロップID対応）
-- 2. enemies.drop_item_slug の修正（スキル→消耗品 5件、新規 4件）
-- ============================================================

-- ■ 1. 新規アイテム追加（4件）

-- 天狗の羽団扇（からす天狗ドロップ）
INSERT INTO items (slug, name, type, base_price, min_prosperity, nation_tags, is_black_market, effect_data)
VALUES (
    'item_tengu_fan',
    '天狗の羽団扇',
    'consumable',
    300,
    1,
    NULL,
    false,
    '{"use_timing": "battle", "effect_id": "atk_up", "effect_duration": 2, "atk_bonus": 10, "description": "天狗が操る風の力を封じた団扇。使用するとATKが一時的に上昇する。"}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    base_price = EXCLUDED.base_price,
    effect_data = EXCLUDED.effect_data;

-- 盗賊の隠し財宝（盗賊団の頭領ドロップ）
INSERT INTO items (slug, name, type, base_price, min_prosperity, nation_tags, is_black_market, effect_data)
VALUES (
    'item_bandit_treasure',
    '盗賊の隠し財宝',
    'trade_good',
    500,
    1,
    NULL,
    false,
    '{"category": "trade_good", "description": "盗賊団が密かに蓄えていた金品の入った袋。"}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    base_price = EXCLUDED.base_price,
    effect_data = EXCLUDED.effect_data;

-- 魔人の宝珠（砂漠の魔人ドロップ）
INSERT INTO items (slug, name, type, base_price, min_prosperity, nation_tags, is_black_market, effect_data)
VALUES (
    'mat_djinn_orb',
    '魔人の宝珠',
    'material',
    800,
    1,
    NULL,
    false,
    '{"description": "砂漠の魔人の核から取り出した、魔力を帯びた神秘の宝珠。"}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    base_price = EXCLUDED.base_price,
    effect_data = EXCLUDED.effect_data;

-- 麒麟の鬣（麒麟ドロップ）
INSERT INTO items (slug, name, type, base_price, min_prosperity, nation_tags, is_black_market, effect_data)
VALUES (
    'mat_kirin_mane',
    '麒麟の鬣',
    'material',
    2000,
    1,
    NULL,
    false,
    '{"description": "伝説の霊獣・麒麟の鬣。雷の力が宿り、髪一筋でも莫大な価値がある。"}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    base_price = EXCLUDED.base_price,
    effect_data = EXCLUDED.effect_data;

-- ■ 2. enemies.drop_item_slug 更新（9件）

-- 2a. スキルドロップ → 消耗品に変更（5件）

-- レッドスライム: 奥義書:居合 → 傷薬
UPDATE enemies
SET drop_item_slug = 'item_potion_s'
WHERE slug = 'enemy_slime_red';

-- キマイラ: 教本:挑発 → 砥石
UPDATE enemies
SET drop_item_slug = 'item_whetstone'
WHERE slug = 'enemy_chimera';

-- デザートドラゴン: 教本:挑発 → 熱砂の香辛料
UPDATE enemies
SET drop_item_slug = 'item_desert_spice'
WHERE slug = 'enemy_markand_desert_dragon';

-- リッチ: 教本:瞑想 → 聖水
UPDATE enemies
SET drop_item_slug = 'item_holy_water'
WHERE slug = 'enemy_lich';

-- 赤鬼: 教本:狂戦士 → 毒塗りの粉
UPDATE enemies
SET drop_item_slug = 'item_yato_poison'
WHERE slug = 'enemy_yato_akaoni';

-- 2b. 欠落ドロップ → 新規アイテムに設定（4件）

-- からす天狗 → 天狗の羽団扇
UPDATE enemies
SET drop_item_slug = 'item_tengu_fan'
WHERE slug = 'enemy_yato_tengu';

-- 盗賊団の頭領 → 盗賊の隠し財宝
UPDATE enemies
SET drop_item_slug = 'item_bandit_treasure'
WHERE slug = 'enemy_bandit_boss';

-- 砂漠の魔人 → 魔人の宝珠
UPDATE enemies
SET drop_item_slug = 'mat_djinn_orb'
WHERE slug = 'enemy_markand_djinn';

-- 麒麟 → 麒麟の鬣
UPDATE enemies
SET drop_item_slug = 'mat_kirin_mane'
WHERE slug = 'enemy_karyu_kirin';

-- ■ 3. 確認クエリ
SELECT e.slug AS enemy_slug, e.name AS enemy_name, e.drop_item_slug,
       i.name AS item_name, i.type AS item_type
FROM enemies e
LEFT JOIN items i ON i.slug = e.drop_item_slug
WHERE e.drop_item_slug IS NOT NULL
ORDER BY e.id;
