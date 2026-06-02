-- Add is_tutorial_completed column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN is_tutorial_completed BOOLEAN DEFAULT FALSE NOT NULL;

-- Reload schema cache and grant permissions to make it visible
NOTIFY pgrst, 'reload schema';
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
