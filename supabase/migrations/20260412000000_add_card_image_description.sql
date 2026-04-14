-- v3.3: cards テーブルに image_url と description カラムを追加
-- これらはバトル画面のカード表示に使用される

ALTER TABLE cards ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS description TEXT;

-- ap_cost カラムが無い場合は追加
ALTER TABLE cards ADD COLUMN IF NOT EXISTS ap_cost INTEGER DEFAULT 1;

-- target_type カラムが無い場合は追加
ALTER TABLE cards ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'single_enemy';

-- effect_id カラムが無い場合は追加
ALTER TABLE cards ADD COLUMN IF NOT EXISTS effect_id TEXT;
