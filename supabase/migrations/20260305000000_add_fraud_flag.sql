-- Migration: 不正検知フラグカラムの追加
-- 仕様: spec_v7_lifecycle_economy.md §5 経済セキュリティ
-- fraud-detect バッチが不正なゴールド増殖を検知した際に立てるフラグ

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_flagged    BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flagged_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS flag_reason   TEXT;

-- インデックス: 運営がフラグ立てアカウントを素早く抽出するために使用
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_flagged
  ON user_profiles (is_flagged)
  WHERE is_flagged = TRUE;
