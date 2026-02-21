
-- Add slug column to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create index for faster lookup by slug
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);
