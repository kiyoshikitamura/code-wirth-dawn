-- Add birth_date to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Comment for documentation
COMMENT ON COLUMN user_profiles.birth_date IS 'Character birth date, used for age calculation and initial stats';
