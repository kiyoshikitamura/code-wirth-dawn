-- Migration: add_atk_to_party_members
-- Spec: spec_v6_shadow_system.md §3.2 (v12.1 update)
-- Purpose: Add atk column to party_members to allow NPC/Shadow basic ATK in battle
-- Date: 2026-04-10

-- Add atk column with default 0
ALTER TABLE party_members
    ADD COLUMN IF NOT EXISTS atk INT DEFAULT 0;

-- Comment for documentation
COMMENT ON COLUMN party_members.atk IS
    'v8.1: 基礎攻撃力 (0-15). 傭兵・残影のバトル中にカード威力へ加算される。英霊登録時に引退キャラのatk値をコピーする。';
