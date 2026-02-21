
-- Re-create NPCs table if it doesn't exist or is missing columns
CREATE TABLE IF NOT EXISTS npcs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  job_class TEXT,
  introduction TEXT,
  is_hireable BOOLEAN DEFAULT false,
  default_cards TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS is enabled and public read allowed
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read npcs" ON npcs;
CREATE POLICY "Public read npcs" ON npcs FOR SELECT TO PUBLIC USING (true);


-- Ensure Enemy Groups has Name column
ALTER TABLE enemy_groups ADD COLUMN IF NOT EXISTS name TEXT;

-- Ensure Enemies has V3.5 columns
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS vit_damage INTEGER DEFAULT 0;
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS traits TEXT[] DEFAULT '{}';
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS max_hp INTEGER DEFAULT 0;
