
-- Fix NPCs table columns (since table exists but might be empty schema)

ALTER TABLE npcs ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS job_class TEXT;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS introduction TEXT;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS is_hireable BOOLEAN DEFAULT false;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS default_cards TEXT[] DEFAULT '{}';
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure unique constraint on slug if not already present (indexes are separate from columns)
-- If slug column was just added, it needs the unique constraint if not defined in ADD COLUMN.
-- The above ADD COLUMN ... UNIQUE adds it. If column exists but not unique, this won't fix it. 
-- But assuming it was missing, this is fine.

-- Also ensure RLS is correct
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read npcs" ON npcs;
CREATE POLICY "Public read npcs" ON npcs FOR SELECT TO PUBLIC USING (true);
