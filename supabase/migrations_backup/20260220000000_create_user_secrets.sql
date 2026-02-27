
-- Create user_secrets table for password recovery
CREATE TABLE IF NOT EXISTS user_secrets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_secrets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own secret
CREATE POLICY "Users can insert their own secret" ON user_secrets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can select their own secret (to verify if set)
CREATE POLICY "Users can select their own secret" ON user_secrets
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own secret
CREATE POLICY "Users can update their own secret" ON user_secrets
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Service role can do anything (for admin reset)
-- (Implicitly true for service_role, but good to know)
