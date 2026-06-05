-- Add introduction column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS introduction TEXT;
