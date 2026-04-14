-- このスクリプトをSupabaseダッシュボードのSQL Editorで実行するか
-- npx tsx scripts/apply_migration_cards.ts で適用してください

-- v3.3: cards テーブルに image_url と description カラムを追加
ALTER TABLE cards ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS ap_cost INTEGER DEFAULT 1;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'single_enemy';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS effect_id TEXT;
