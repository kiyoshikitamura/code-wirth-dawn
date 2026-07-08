-- Create PVP Defense Parties Table for Async PvP (Arena Mode)

CREATE TABLE IF NOT EXISTS public.pvp_defense_parties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    avatar_url TEXT,
    
    -- Battle power score and matchmaking rank class
    battle_score INTEGER NOT NULL DEFAULT 0,
    defense_rank TEXT NOT NULL DEFAULT 'C' CHECK (defense_rank IN ('C', 'B', 'A', 'S')),
    
    -- Snapshots
    player_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    party_members_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    equipped_items_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    skill_deck_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index for 1 defense deck per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_pvp_defense_parties_user_id ON public.pvp_defense_parties(user_id);

-- Matchmaking lookup index
CREATE INDEX IF NOT EXISTS idx_pvp_defense_parties_rank ON public.pvp_defense_parties(defense_rank);

-- Enable Row Level Security (RLS)
ALTER TABLE public.pvp_defense_parties ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can read defense parties (required for fetching opponents list)
DROP POLICY IF EXISTS "Public read pvp_defense_parties" ON public.pvp_defense_parties;
CREATE POLICY "Public read pvp_defense_parties" ON public.pvp_defense_parties FOR SELECT TO PUBLIC USING (true);

-- 2. Users can insert their own defense party
DROP POLICY IF EXISTS "Users can insert own pvp_defense_party" ON public.pvp_defense_parties;
CREATE POLICY "Users can insert own pvp_defense_party" ON public.pvp_defense_parties FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own defense party
DROP POLICY IF EXISTS "Users can update own pvp_defense_party" ON public.pvp_defense_parties;
CREATE POLICY "Users can update own pvp_defense_party" ON public.pvp_defense_parties FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own defense party (for completeness)
DROP POLICY IF EXISTS "Users can delete own pvp_defense_party" ON public.pvp_defense_parties;
CREATE POLICY "Users can delete own pvp_defense_party" ON public.pvp_defense_parties FOR DELETE USING (auth.uid() = user_id);
