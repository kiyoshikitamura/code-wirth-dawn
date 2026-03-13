-- Add short_description, full_description, status to scenarios
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS full_description TEXT;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';

-- Add image_url to enemies
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add icon_url and image_url to party_members
ALTER TABLE party_members ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE party_members ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url to items
ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url to cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS image_url TEXT;
