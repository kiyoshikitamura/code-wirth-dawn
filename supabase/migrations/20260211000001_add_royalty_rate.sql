-- Add royalty_rate column if it doesn't exist
ALTER TABLE party_members
ADD COLUMN IF NOT EXISTS royalty_rate INTEGER DEFAULT 10;
