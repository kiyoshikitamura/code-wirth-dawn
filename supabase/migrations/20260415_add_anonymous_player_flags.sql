-- =============================================================
-- Migration: add_anonymous_player_flags
-- 目的:
--   1. user_profiles に is_anonymous / expires_at カラムを追加
--   2. 既存の匿名ユーザーデータを一括削除（リセット）
--   3. 失効チェック用インデックスを追加
-- =============================================================

-- 1. カラム追加
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. 既存匿名データのリセット（関連テーブルも含めてカスケード削除）

-- 2-1. party_members（匿名オーナーのパーティ）
DELETE FROM party_members
WHERE owner_id IN (
  SELECT up.id
  FROM user_profiles up
  INNER JOIN auth.users au ON au.id = up.id
  WHERE au.is_anonymous = true
);

-- 2-2. party_members（匿名ユーザーが source_user_id として参照されている）
DELETE FROM party_members
WHERE source_user_id IN (
  SELECT au.id FROM auth.users au WHERE au.is_anonymous = true
);

-- 2-3. user_skills
DELETE FROM user_skills
WHERE user_id IN (
  SELECT au.id FROM auth.users au WHERE au.is_anonymous = true
);

-- 2-4. inventory
DELETE FROM inventory
WHERE user_id IN (
  SELECT au.id FROM auth.users au WHERE au.is_anonymous = true
);

-- 2-5. reputations
DELETE FROM reputations
WHERE user_id IN (
  SELECT au.id FROM auth.users au WHERE au.is_anonymous = true
);

-- 2-6. royalty_daily_log（テーブルが存在する場合のみ）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'royalty_daily_log'
  ) THEN
    DELETE FROM royalty_daily_log
    WHERE user_id IN (
      SELECT au.id FROM auth.users au WHERE au.is_anonymous = true
    );
  END IF;
END $$;

-- 2-7. user_profiles（本体）
DELETE FROM user_profiles
WHERE id IN (
  SELECT au.id FROM auth.users au WHERE au.is_anonymous = true
);

-- 3. 失効チェック用インデックス
CREATE INDEX IF NOT EXISTS idx_user_profiles_expires_at
  ON user_profiles (expires_at)
  WHERE expires_at IS NOT NULL;

-- 4. コメント
COMMENT ON COLUMN user_profiles.is_anonymous IS
  'true = 匿名（テストプレイ）ユーザー。expires_at を過ぎると cron で自動削除される。';

COMMENT ON COLUMN user_profiles.expires_at IS
  '匿名ユーザーのデータ失効日時（作成から7日後）。NULL = 永続（OAuthユーザー）。';
