-- Migration: UGCエネミー作成機能に必要なカラムを enemies テーブルに追加
-- 仕様: spec_v12_ugc_system.md §3.2
-- 対象API: POST /api/ugc/asset/enemy

ALTER TABLE enemies ADD COLUMN IF NOT EXISTS is_ugc      BOOLEAN  DEFAULT FALSE;
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS creator_id  UUID     REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS asset_type  TEXT     DEFAULT 'enemy';   -- 'enemy' | 'npc_companion'
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS skills      TEXT[]   DEFAULT '{}';
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS flavor_text TEXT;
