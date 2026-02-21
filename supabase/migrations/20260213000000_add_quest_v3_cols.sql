-- Add Spec v3.1 columns to scenarios table
ALTER TABLE scenarios 
ADD COLUMN IF NOT EXISTS quest_type text DEFAULT 'normal', -- 'normal', 'special'
ADD COLUMN IF NOT EXISTS requirements jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS location_tags text[] DEFAULT '{}';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_scenarios_quest_type ON scenarios(quest_type);
CREATE INDEX IF NOT EXISTS idx_scenarios_location_tags ON scenarios USING GIN(location_tags);
