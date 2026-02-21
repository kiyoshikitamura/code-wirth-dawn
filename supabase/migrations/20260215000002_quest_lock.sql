-- v3.3: クエストロック用カラム追加
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_quest_id TEXT DEFAULT NULL;
