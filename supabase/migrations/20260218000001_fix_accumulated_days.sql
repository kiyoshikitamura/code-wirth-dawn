
-- Set default accumulated_days to 1 for existing users with 0
UPDATE user_profiles SET accumulated_days = 1 WHERE accumulated_days = 0;

-- Alter table to set DEFAULT 1 for accumulated_days
ALTER TABLE user_profiles ALTER COLUMN accumulated_days SET DEFAULT 1;
