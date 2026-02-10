-- Add UI-related columns to scenarios table
ALTER TABLE scenarios 
ADD COLUMN IF NOT EXISTS rec_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;

-- Add index for query performance
CREATE INDEX IF NOT EXISTS idx_scenarios_rec_level ON scenarios(rec_level);
