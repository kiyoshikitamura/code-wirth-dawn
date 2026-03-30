-- アイテムtype分類修正: check制約を拡張し、新しいtype値を許容する
-- 既存の制約を削除して再作成
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check;

-- 新しいtype値（equipment, consumable, key_item, trade_good, material）を許容
ALTER TABLE items ADD CONSTRAINT items_type_check
  CHECK (type IN ('consumable', 'equipment', 'skill', 'skill_card', 'key_item', 'trade_good', 'material'));
