
-- Fix Enemy Groups Slug Constraint for Upsert

-- 1. Ensure all existing groups have a slug
UPDATE enemy_groups SET slug = 'group_' || id WHERE slug IS NULL OR slug = '';

-- 2. Make slug NOT NULL
ALTER TABLE enemy_groups ALTER COLUMN slug SET NOT NULL;

-- 3. Add UNIQUE constraint if it doesn't exist
-- We use a DO block or just try adding it. Standard SQL doesn't have IF NOT EXISTS for constraints easily in one line without conflict.
-- But Supabase/Postgres specific:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enemy_groups_slug_key') THEN
        ALTER TABLE enemy_groups ADD CONSTRAINT enemy_groups_slug_key UNIQUE (slug);
    END IF;
END $$;
