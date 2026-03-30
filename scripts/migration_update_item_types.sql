-- items テーブルの type / sub_type を正しく修正する UPDATE 文
-- (CSVのIDとDBのIDが一致している前提でslugベースで更新)

-- 装備品: consumable → equipment
UPDATE items SET type = 'equipment' WHERE slug IN ('item_white_robe', 'item_thief_blade', 'item_pirate_hat', 'item_mino_axe');

-- 素材: consumable → material + sub_type カラムシフト修正
UPDATE items SET type = 'material', sub_type = NULL WHERE slug IN (
  'item_relic_bone', 'item_desert_worm_meat', 'item_red_ogre_horn',
  'item_thunder_fur', 'item_griffon_feather', 'item_treant_core',
  'item_demon_heart', 'item_angel_record',
  'item_kirin_horn', 'item_omega_part', 'item_kraken_proof', 'item_maze_seal'
);

-- キーアイテム: consumable → key_item
UPDATE items SET type = 'key_item' WHERE slug IN (
  'item_debris_clear',
  'item_pass_roland', 'item_pass_karyu', 'item_pass_yato', 'item_pass_markand'
);

-- 交易品: consumable → trade_good
UPDATE items SET type = 'trade_good' WHERE slug IN (
  'item_trade_iron', 'item_trade_silk', 'item_trade_gem',
  'item_trade_dragon', 'item_trade_mithril', 'item_dark_matter'
);

-- sub_type カラムシフト修正: 素材アイテムの base_price が sub_type に入っていた問題
-- (base_price を正しい値に、sub_type を NULL に)
UPDATE items SET base_price = 500, sub_type = NULL WHERE slug = 'item_relic_bone' AND (sub_type = '500' OR base_price IS NULL);
UPDATE items SET base_price = 800, sub_type = NULL WHERE slug = 'item_desert_worm_meat' AND (sub_type = '800' OR base_price IS NULL);
UPDATE items SET base_price = 600, sub_type = NULL WHERE slug = 'item_red_ogre_horn' AND (sub_type = '600' OR base_price IS NULL);
UPDATE items SET base_price = 1000, sub_type = NULL WHERE slug = 'item_thunder_fur' AND (sub_type = '1000' OR base_price IS NULL);
UPDATE items SET base_price = 900, sub_type = NULL WHERE slug = 'item_griffon_feather' AND (sub_type = '900' OR base_price IS NULL);
UPDATE items SET base_price = 700, sub_type = NULL WHERE slug = 'item_treant_core' AND (sub_type = '700' OR base_price IS NULL);
UPDATE items SET base_price = 3000, sub_type = NULL WHERE slug = 'item_demon_heart' AND (sub_type = '3000' OR base_price IS NULL);
UPDATE items SET base_price = 3000, sub_type = NULL WHERE slug = 'item_angel_record' AND (sub_type = '3000' OR base_price IS NULL);
UPDATE items SET base_price = 5000, sub_type = NULL WHERE slug = 'item_kirin_horn' AND (sub_type = '5000' OR base_price IS NULL);
UPDATE items SET base_price = 4000, sub_type = NULL WHERE slug = 'item_omega_part' AND (sub_type = '4000' OR base_price IS NULL);
UPDATE items SET base_price = 5000, sub_type = NULL WHERE slug = 'item_kraken_proof' AND (sub_type = '5000' OR base_price IS NULL);
UPDATE items SET base_price = 2000, sub_type = NULL WHERE slug = 'item_maze_seal' AND (sub_type = '2000' OR base_price IS NULL);

-- 装備品の sub_type 確認 (既に正しいはずだが念のため)
UPDATE items SET sub_type = 'armor' WHERE slug = 'item_white_robe';
UPDATE items SET sub_type = 'weapon' WHERE slug = 'item_thief_blade';
UPDATE items SET sub_type = 'accessory' WHERE slug = 'item_pirate_hat';
UPDATE items SET sub_type = 'weapon' WHERE slug = 'item_mino_axe';
