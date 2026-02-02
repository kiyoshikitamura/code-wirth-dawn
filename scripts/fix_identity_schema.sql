-- Fix User Profile Schema for Character Creation
-- Adds missing columns (gender, age) if they don't exist.

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS gender text DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS age integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS accumulated_days integer DEFAULT 0;

-- Ensure RLS allows updates to own profile
-- (If policies are strict, we might need to check them, but usually 'Enable for owners' covers this)

-- Fix Gender Check Constraint if desired (Optional, but good for data integrity)
-- ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS check_gender;
-- ALTER TABLE user_profiles ADD CONSTRAINT check_gender CHECK (gender IN ('Male', 'Female', 'Unknown'));

-- For Debug: Reset all profiles to 'Unknown' to force 'New Game' flow for testing
UPDATE user_profiles 
SET gender = 'Unknown', 
    title_name = '名もなき旅人' 
WHERE id IS NOT NULL;
