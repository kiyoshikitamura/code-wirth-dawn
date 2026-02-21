-- Add ap_cost column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS ap_cost INTEGER NOT NULL DEFAULT 1;

-- Add description for new column
COMMENT ON COLUMN items.ap_cost IS 'Battle Action Point cost (Default: 1)';

-- Update existing items with sensible defaults (optional, but good practice)
-- Weak/Basic items -> 1 AP
-- Strong items -> 2-3 AP
-- Ultimate items -> 5 AP
-- For now, default is 1. We can run specific updates later if needed.
