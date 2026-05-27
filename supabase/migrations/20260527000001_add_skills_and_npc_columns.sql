-- Migration: Add missing columns to skills and npcs tables to support separate skills and system mercenaries

-- 1. Add missing columns to skills table
ALTER TABLE skills ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS base_price INTEGER NOT NULL DEFAULT 0;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS deck_cost INTEGER NOT NULL DEFAULT 2;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS nation_tags TEXT[] DEFAULT '{}';
ALTER TABLE skills ADD COLUMN IF NOT EXISTS min_prosperity INTEGER DEFAULT 1;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_black_market BOOLEAN DEFAULT FALSE;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS description TEXT;

-- Ensure slug is unique if it exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'skills_slug_key'
    ) THEN
        ALTER TABLE skills ADD CONSTRAINT skills_slug_key UNIQUE (slug);
    END IF;
END $$;

-- 2. Add missing origin column to npcs table
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'system_mercenary';

-- 3. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
