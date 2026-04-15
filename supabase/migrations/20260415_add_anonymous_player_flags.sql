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

-- 2. 匿名ユーザーの id を一時テーブルへ収集
CREATE TEMP TABLE _anon_ids AS
  SELECT au.id
  FROM auth.users au
  WHERE au.is_anonymous = true;

-- 3. user_profiles に対する外部キーを持つ全テーブルを動的に DELETE
--    （どのテーブルが参照しているか不明でも一括対応）
DO $$
DECLARE
  r RECORD;
  sql_stmt TEXT;
BEGIN
  FOR r IN
    SELECT
      tc.table_name      AS child_table,
      kcu.column_name    AS child_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema   = kcu.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema   = rc.constraint_schema
    JOIN information_schema.key_column_usage rcu
      ON rc.unique_constraint_name = rcu.constraint_name
      AND rc.unique_constraint_schema = rcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema    = 'public'
      AND rcu.table_name     = 'user_profiles'
      AND rcu.column_name    = 'id'
  LOOP
    sql_stmt := format(
      'DELETE FROM %I WHERE %I IN (SELECT id FROM _anon_ids)',
      r.child_table,
      r.child_column
    );
    RAISE NOTICE 'Executing: %', sql_stmt;
    EXECUTE sql_stmt;
  END LOOP;
END $$;

-- 4. user_profiles 本体を削除（この時点で子テーブルはすべてクリア済み）
DELETE FROM user_profiles
WHERE id IN (SELECT id FROM _anon_ids);

-- 5. 一時テーブルを破棄
DROP TABLE IF EXISTS _anon_ids;

-- 6. 失効チェック用インデックス
CREATE INDEX IF NOT EXISTS idx_user_profiles_expires_at
  ON user_profiles (expires_at)
  WHERE expires_at IS NOT NULL;

-- 7. コメント
COMMENT ON COLUMN user_profiles.is_anonymous IS
  'true = 匿名（テストプレイ）ユーザー。expires_at を過ぎると cron で自動削除される。';

COMMENT ON COLUMN user_profiles.expires_at IS
  '匿名ユーザーのデータ失効日時（作成から7日後）。NULL = 永続（OAuthユーザー）。';
