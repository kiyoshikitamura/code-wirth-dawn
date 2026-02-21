-- Migration: Add quest_type and requirements to scenarios
-- Spec: v3.1 Quest Structure

ALTER TABLE scenarios 
ADD COLUMN IF NOT EXISTS quest_type text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS requirements jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS location_tags text[] DEFAULT '{}';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_scenarios_quest_type ON scenarios(quest_type);

-- Comment
COMMENT ON COLUMN scenarios.quest_type IS 'normal or special';
COMMENT ON COLUMN scenarios.requirements IS 'JSONB criteria for special quests';
