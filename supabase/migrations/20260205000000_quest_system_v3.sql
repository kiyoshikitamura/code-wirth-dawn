-- Migration: 20260205000000_quest_system_v3.sql
-- Update scenarios table for Quest System v3.0

-- 1. Add new columns if they don't exist
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS rec_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS days_success INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS days_failure INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trigger_condition TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rewards JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS impact JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS script_data JSONB DEFAULT '{}'::jsonb;

-- 2. Ensure types (in case they were created differently before)
-- Note: Changing ID type to BIGINT if it's not already might require more complex migration steps.
-- Assuming ID is effectively handled or already compatible for now.
-- If we need to force ID to be user-defined (not auto-increment), we might need to drop identity.
-- For now, let's focus on adding the missing columns.

-- 3. Comments for documentation
COMMENT ON COLUMN scenarios.rec_level IS 'Recommended Level';
COMMENT ON COLUMN scenarios.days_success IS 'Days passed on success';
COMMENT ON COLUMN scenarios.days_failure IS 'Days passed on failure/abort';
COMMENT ON COLUMN scenarios.is_urgent IS 'Urgency flag impacting score and display';
COMMENT ON COLUMN scenarios.trigger_condition IS 'Condition to make quest appear (e.g. prosp:2-, has_item:3001)';
COMMENT ON COLUMN scenarios.rewards IS 'Rewards definition including move_to';
COMMENT ON COLUMN scenarios.impact IS 'World Impact definition (e.g. { target: "loc_id", order: 1 })';
COMMENT ON COLUMN scenarios.script_data IS 'BYORK Scenario Script JSON (compiled from CSV)';
