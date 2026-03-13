-- Migration to safely drop legacy `is_subscriber` column 
-- after successfully migrating to `subscription_tier` enum.
-- Part of Core Systems Cleanup (Phase 3.2.3)

ALTER TABLE user_profiles
DROP COLUMN IF EXISTS is_subscriber;
