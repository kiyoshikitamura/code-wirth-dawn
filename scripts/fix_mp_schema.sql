-- Fix MP Schema
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS mp INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS max_mp INTEGER DEFAULT 50;

-- Ensure Update
UPDATE user_profiles SET mp = 50, max_mp = 50 WHERE mp IS NULL;
