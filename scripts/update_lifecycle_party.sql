
-- 1. Update user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 18,
ADD COLUMN IF NOT EXISTS vitality INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS max_vitality INTEGER DEFAULT 100;

-- 2. Create party_members table
CREATE TABLE IF NOT EXISTS party_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT DEFAULT 'Unknown',
  origin TEXT CHECK (origin IN ('system', 'ghost')),
  job_class TEXT,
  
  -- Stats
  durability INTEGER DEFAULT 100, -- HP
  max_durability INTEGER DEFAULT 100,
  loyalty INTEGER DEFAULT 50, -- 0-100
  cover_rate INTEGER DEFAULT 0, -- % chance to cover
  
  -- Deck Injection
  inject_cards TEXT[] DEFAULT '{}', -- Array of Card IDs
  
  -- State
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own party" 
ON party_members FOR ALL 
USING (auth.uid() = owner_id);
