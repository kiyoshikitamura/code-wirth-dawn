
-- Migration to add 'def' column for Physical Defense
-- Tables: user_profiles, party_members, enemies

-- 1. user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS def INTEGER DEFAULT 0;

-- 2. party_members
ALTER TABLE party_members
ADD COLUMN IF NOT EXISTS def INTEGER DEFAULT 0;

-- 3. enemies
ALTER TABLE enemies
ADD COLUMN IF NOT EXISTS def INTEGER DEFAULT 0;
