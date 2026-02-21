
-- Add missing columns for Battle V3.5 features

-- Enemies table
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS vit_damage INTEGER DEFAULT 0;
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS traits TEXT[] DEFAULT '{}';
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS max_hp INTEGER DEFAULT 0;
UPDATE enemies SET max_hp = hp WHERE max_hp = 0;

-- Enemy Groups (name column)
ALTER TABLE enemy_groups ADD COLUMN IF NOT EXISTS name TEXT;

-- NPCs table (check if RLS blocks read)
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read npcs" ON npcs;
CREATE POLICY "Public read npcs" ON npcs FOR SELECT TO PUBLIC USING (true);
