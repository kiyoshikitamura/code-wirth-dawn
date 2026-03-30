-- ============================================================
-- items テーブルの type 一括更新スクリプト
-- CSV (items.csv) の正しい type 定義に基づいてDBを修正
-- 
-- 実行方法: Supabase SQL Editor にペーストして実行
-- ============================================================

-- 1. 装備品 (equipment)
UPDATE items SET type = 'equipment', sub_type = 'armor'
WHERE slug = 'item_white_robe';

UPDATE items SET type = 'equipment', sub_type = 'weapon'
WHERE slug = 'item_thief_blade';

UPDATE items SET type = 'equipment', sub_type = 'accessory'
WHERE slug = 'item_pirate_hat';

UPDATE items SET type = 'equipment', sub_type = 'weapon'
WHERE slug = 'item_mino_axe';

-- 2. キーアイテム (key_item)
UPDATE items SET type = 'key_item'
WHERE slug IN (
    'item_debris_clear',
    'item_pass_roland',
    'item_pass_karyu',
    'item_pass_yato',
    'item_pass_markand'
);

-- 3. 素材 (material)
UPDATE items SET type = 'material'
WHERE slug IN (
    'item_relic_bone',
    'item_desert_worm_meat',
    'item_red_ogre_horn',
    'item_thunder_fur',
    'item_griffon_feather',
    'item_treant_core',
    'item_demon_heart',
    'item_angel_record',
    'item_kirin_horn',
    'item_omega_part',
    'item_kraken_proof',
    'item_maze_seal'
);

-- 4. 交易品 (trade_good)
UPDATE items SET type = 'trade_good'
WHERE slug IN (
    'item_trade_iron',
    'item_trade_silk',
    'item_trade_gem',
    'item_trade_dragon',
    'item_trade_mithril',
    'item_dark_matter'
);

-- 5. 確認クエリ: type 別カウント
SELECT type, count(*) as count FROM items GROUP BY type ORDER BY type;
