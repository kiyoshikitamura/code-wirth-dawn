-- Migration: add_last_name_change
-- ユーザー名変更の週1回制限を実装するためのカラム追加
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_name_change TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN user_profiles.last_name_change IS
  '最後にユーザー名を変更した日時。1週間に1回の変更制限に使用。';
