
-- 1. Update user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS max_vitality INTEGER DEFAULT 100;

-- Optional: Update default age to 18 if you want strict adherence, but existing rows won't change unless updated.
-- ALTER TABLE user_profiles ALTER COLUMN age SET DEFAULT 18;

-- 2. Create party_members table
CREATE TABLE IF NOT EXISTS party_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT DEFAULT 'Unknown',
  origin TEXT CHECK (origin IN ('system', 'ghost')),
  nation_id TEXT, -- e.g. 'loc_holy_empire'
  alignment JSONB DEFAULT '{"order": 0, "chaos": 0, "justice": 0, "evil": 0}'::jsonb,
  loyalty INTEGER DEFAULT 50, -- 0-100
  contract_cost INTEGER DEFAULT 0,
  condition TEXT DEFAULT 'healthy', -- healthy, injured, fear
  durability INTEGER DEFAULT 100, -- HP
  inject_cards TEXT[] DEFAULT '{}',
  passive_skill TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for party_members if needed (generic example)
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own party members" 
ON party_members FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own party members" 
ON party_members FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own party members" 
ON party_members FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own party members" 
ON party_members FOR DELETE 
USING (auth.uid() = owner_id);
