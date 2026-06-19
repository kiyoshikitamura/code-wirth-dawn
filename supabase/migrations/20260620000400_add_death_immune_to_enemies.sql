-- Migration: Add death_immune column to enemies table and set boss resistances
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS death_immune BOOLEAN DEFAULT FALSE;

-- Configure instant death resistance for all boss-level enemies
UPDATE enemies SET death_immune = TRUE 
WHERE slug LIKE 'boss_%' 
   OR slug LIKE 'enemy_boss_%' 
   OR slug LIKE 'enemy_spot_%' 
   OR slug LIKE 'enemy_god_%' 
   OR slug LIKE 'enemy_bounty_%';
