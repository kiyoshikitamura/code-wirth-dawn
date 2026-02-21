-- Migration: World Expansion v3.4
-- Date: 2026-02-16

-- 1. Locations Table Expansion (Topology)
ALTER TABLE locations ADD COLUMN IF NOT EXISTS map_x INTEGER;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS map_y INTEGER;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS neighbors JSONB DEFAULT '{}'; 
ALTER TABLE locations ADD COLUMN IF NOT EXISTS prosperity_level INTEGER DEFAULT 3;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS ruling_nation_id TEXT;

-- 2. Items Table Expansion (Quest Context)
ALTER TABLE items ADD COLUMN IF NOT EXISTS quest_req_id TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS nation_tags TEXT[] DEFAULT '{}';
ALTER TABLE items ADD COLUMN IF NOT EXISTS min_prosperity INTEGER DEFAULT 1;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_black_market BOOLEAN DEFAULT FALSE;

-- 3. Party Members Expansion (Guest/Mercenary Context)
ALTER TABLE party_members ADD COLUMN IF NOT EXISTS quest_req_id TEXT;

-- 4. User Profiles Expansion (Resume Persistence)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_quest_state JSONB DEFAULT NULL;

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_items_quest_req_id ON items(quest_req_id);
