-- Add prayer_count to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS prayer_count INTEGER DEFAULT 0;
