-- v2.6: ドロップ率とドロップアイテムのカラムを追加
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS drop_rate INT DEFAULT 0;
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS drop_item_slug TEXT;
