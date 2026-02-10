-- Migration: 20260207000000_battle_system_v2_1.sql
-- Create Battle System v2.1 tables

-- 1. Enemy Skills
CREATE TABLE IF NOT EXISTS enemy_skills (
    id BIGINT PRIMARY KEY, -- CSV ID
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    effect_type TEXT CHECK (effect_type IN ('damage', 'drain_vit', 'inject', 'buff', 'debuff', 'other')),
    value INTEGER DEFAULT 0,
    inject_card_id TEXT DEFAULT NULL, -- Card ID if effect is inject
    description TEXT
);

-- 2. Enemies
CREATE TABLE IF NOT EXISTS enemies (
    id BIGINT PRIMARY KEY, -- CSV ID
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    hp INTEGER DEFAULT 100,
    exp INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 0,
    drop_item_id TEXT DEFAULT NULL,
    action_pattern JSONB DEFAULT '[]'::jsonb -- List of actions
);

-- 3. Enemy Groups
CREATE TABLE IF NOT EXISTS enemy_groups (
    id BIGINT PRIMARY KEY, -- CSV ID (or auto-gen if needed, but CSV ID preferred)
    slug TEXT UNIQUE NOT NULL,
    members JSONB DEFAULT '[]'::jsonb -- List of enemy slugs
);

-- Comments
COMMENT ON TABLE enemy_skills IS 'Master table for enemy skills effects';
COMMENT ON TABLE enemies IS 'Master table for enemy stats and AI patterns';
COMMENT ON TABLE enemy_groups IS 'Master table for enemy encounter groups';
