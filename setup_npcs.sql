-- 1. NPCs Table (New)
-- Stores both hireable NPCs (in Pubs) and party members.
-- They exist persistently in the world.
CREATE TABLE npcs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  job_class TEXT NOT NULL, -- 'Warrior', 'Mage', 'Thief', 'Cleric'
  level INTEGER DEFAULT 1,
  
  -- Stats
  hp INTEGER DEFAULT 50,
  max_hp INTEGER DEFAULT 50,
  mp INTEGER DEFAULT 20,
  max_mp INTEGER DEFAULT 20,
  attack INTEGER DEFAULT 10,
  defense INTEGER DEFAULT 10,
  speed INTEGER DEFAULT 10,
  
  -- Location & State
  current_location_id uuid REFERENCES locations(id), -- Where they are loitering
  hired_by_user_id uuid REFERENCES user_profiles(id), -- NULL if free
  
  -- Personality & Logic
  -- nation_id: The nation this NPC feels affinity towards.
  -- Determines if they leave when world hegemony shifts or user attacks that nation.
  alignment_nation_id TEXT, -- 'Roland', 'Karyu' etc.
  
  -- Reputation requirement to hire this NPC
  required_rep_rank TEXT, -- 'Stranger', 'Famous', 'Hero', 'Criminal', 'Rogue' (Null = Any)
  
  -- Tactic Mode: Default behavior in battle
  tactic_mode TEXT DEFAULT 'Free', -- 'Free', 'FullAttack', 'Defense', 'Heal'
  
  personality_type TEXT DEFAULT 'Neutral', -- For flavor text variation
  
  -- Visuals
  avatar_url TEXT DEFAULT '/avatars/npc_default.jpg',
  
  -- Hiring
  is_hireable BOOLEAN DEFAULT true,
  hiring_price INTEGER DEFAULT 0, -- If 0, just profit share. If >0, upfront cost? User logic says "Split Reward", so likely 0 upfront.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_npcs_location ON npcs(current_location_id);
CREATE INDEX IF NOT EXISTS idx_npcs_hired_by ON npcs(hired_by_user_id);

-- 3. Initial Seed Data (Sample NPCs)
-- Note: In production, we should procedurally generate these.
-- Here are a few static ones for testing.

-- At Hub
INSERT INTO npcs (name, job_class, level, max_hp, hp, max_mp, mp, attack, defense, current_location_id, personality_type, alignment_nation_id, required_rep_rank)
SELECT 
  '放浪の剣士ガッツ', 'Warrior', 5, 120, 120, 0, 0, 25, 15, id, 'Brave', 'Roland', 'Stranger'
FROM locations WHERE name = '名もなき旅人の拠所' LIMIT 1;

INSERT INTO npcs (name, job_class, level, max_hp, hp, max_mp, mp, attack, defense, current_location_id, personality_type, alignment_nation_id, required_rep_rank)
SELECT 
  '見習い魔女ルナ', 'Mage', 3, 60, 60, 80, 80, 30, 5, id, 'Curious', 'Markand', 'Stranger'
FROM locations WHERE name = '名もなき旅人の拠所' LIMIT 1;

-- At Roland Capital
INSERT INTO npcs (name, job_class, level, max_hp, hp, max_mp, mp, attack, defense, current_location_id, personality_type, alignment_nation_id, required_rep_rank)
SELECT 
  '聖騎士カイン', 'Paladin', 15, 300, 300, 50, 50, 50, 60, id, 'Loyal', 'Roland', 'Famous'
FROM locations WHERE name = '王都アーカディア' LIMIT 1;

-- At Karyu Capital
INSERT INTO npcs (name, job_class, level, max_hp, hp, max_mp, mp, attack, defense, current_location_id, personality_type, alignment_nation_id, required_rep_rank)
SELECT 
  '暗殺者レイヴン', 'Thief', 12, 150, 150, 30, 30, 60, 20, id, 'Cold', 'Karyu', 'Criminal'
FROM locations WHERE name = '帝都カロン' LIMIT 1;
