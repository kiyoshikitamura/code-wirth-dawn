-- Add cost column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS cost INTEGER DEFAULT 0;

-- Add initial_hp column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS initial_hp INTEGER;

-- Update existing user_profiles to have initial_hp based on current max_hp (approximation if needed, or default)
-- For existing users, let's set initial_hp = 20 (old base) if max_hp is low, or calculate backwards if possible.
-- Simpler: Set default 20 for legacy users.
UPDATE user_profiles SET initial_hp = 20 WHERE initial_hp IS NULL;
