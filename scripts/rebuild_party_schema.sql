-- EMERGENCY REBUILD SCRIPT
-- Drops and Recreates party_members to fix any mismatch/corruption.
-- WARNING: Deletes all current party members.

DROP TABLE IF EXISTS party_members CASCADE;

CREATE TABLE party_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid, -- validation managed by app logic (allows Demo User '0000...')
  name TEXT NOT NULL,
  gender TEXT DEFAULT 'Unknown',
  origin TEXT CHECK (origin IN ('system', 'ghost')),
  job_class TEXT,
  
  -- Stats
  durability INTEGER DEFAULT 100,
  max_durability INTEGER DEFAULT 100,
  loyalty INTEGER DEFAULT 50,
  cover_rate INTEGER DEFAULT 0,
  
  -- Deck Injection
  inject_cards TEXT[] DEFAULT '{}',
  
  -- State
  passive_id TEXT,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  personality TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;

-- Allow Public Read (Fixes Visibility)
CREATE POLICY "Public Read" 
ON party_members FOR SELECT 
USING (true); 

-- Allow Insert (Fixes Generation)
CREATE POLICY "Public Insert" 
ON party_members FOR INSERT 
WITH CHECK (true);

-- Allow Update (Fixes Hiring)
CREATE POLICY "Public Update" 
ON party_members FOR UPDATE 
USING (true);

-- Manual Seed for instant visibility
INSERT INTO party_members (name, job_class, durability, cover_rate, inject_cards, is_active, owner_id)
VALUES 
('Iron Guard', 'Warrior', 120, 30, ARRAY['c1'], true, NULL),
('Mystic Sage', 'Mage', 80, 10, ARRAY['c2'], true, NULL),
('Hired Blade', 'Rogue', 90, 20, ARRAY['basic_attack'], true, NULL);
