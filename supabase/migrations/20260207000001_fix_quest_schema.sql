-- Migration: 20260207000001_fix_quest_schema.sql
-- Add missing columns to scenarios table that were skipped in previous migration edit

ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS trigger_condition TEXT DEFAULT NULL;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS rewards JSONB DEFAULT '{}'::jsonb;

-- Re-apply strictly required columns just in case (safe with IF NOT EXISTS)
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS impact JSONB DEFAULT '{}'::jsonb;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS script_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS rec_level INTEGER DEFAULT 1;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS days_success INTEGER DEFAULT 1;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS days_failure INTEGER DEFAULT 1;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN scenarios.trigger_condition IS 'Condition to make quest appear (e.g. prosp:2-, has_item:3001)';
COMMENT ON COLUMN scenarios.rewards IS 'Rewards definition including move_to';
