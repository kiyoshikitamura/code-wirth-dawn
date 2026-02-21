
-- Add formation column to enemy_groups
ALTER TABLE enemy_groups ADD COLUMN IF NOT EXISTS formation TEXT DEFAULT 'front_row';
