-- ============================================================
-- Migration: party_members slug UNIQUE制約修正 (v2.9.3i bugfix)
--
-- 問題: slug カラムにテーブル全体の UNIQUE 制約があるため、
--       同じNPCを複数ユーザーが雇用すると duplicate key エラーが発生。
-- 修正: テーブル全体のUNIQUE制約を削除し、
--       マスターテンプレート（owner_id IS NULL）のみに部分一意インデックスを作成。
-- ============================================================

-- 1. 既存の UNIQUE 制約を削除
ALTER TABLE party_members DROP CONSTRAINT IF EXISTS unique_slug_for_master;

-- 2. マスターテンプレート（owner_id IS NULL）のみの部分一意インデックスを作成
--    → owner_id が NULL のテンプレート行のみ slug の重複を防ぐ
CREATE UNIQUE INDEX IF NOT EXISTS idx_party_members_slug_master_only
    ON party_members (slug)
    WHERE owner_id IS NULL AND slug IS NOT NULL;
