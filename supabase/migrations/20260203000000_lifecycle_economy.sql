-- 1. Create historical_logs table (Spec v7)
CREATE TABLE IF NOT EXISTS historical_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES user_profiles(id),
    data JSONB NOT NULL, -- Snapshot of stats, items, deck
    death_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    legacy_points INTEGER DEFAULT 0,
    cause_of_death TEXT
);

-- 2. Create royalty_logs table (Spec v5, v7)
CREATE TABLE IF NOT EXISTS royalty_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    source_user_id uuid REFERENCES user_profiles(id), -- Recipient of royalty
    target_user_id uuid REFERENCES user_profiles(id), -- Payer (Hirer)
    amount INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create items table (Spec v6) - RECREATE if exists or just ensure it matches spec
DROP TABLE IF EXISTS items CASCADE;
CREATE TABLE items (
    id TEXT PRIMARY KEY, -- Manual ID like 'item_potion_mid'
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('consumable', 'skill', 'equipment')),
    base_price INTEGER NOT NULL,
    effect_data JSONB DEFAULT '{}'::jsonb,
    
    -- Availability Logic
    nation_tags TEXT[] DEFAULT ARRAY['loc_all'],
    min_prosperity INTEGER DEFAULT 1,
    required_alignment JSONB DEFAULT '{}'::jsonb,
    is_black_market BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Update user_profiles (Spec v7)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_alive BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_subscriber BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS legacy_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_royalty_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS signature_deck TEXT[] DEFAULT '{}';

-- 5. Update party_members (Spec v5)
ALTER TABLE party_members
ADD COLUMN IF NOT EXISTS source_user_id UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS origin_type TEXT DEFAULT 'system' CHECK (origin_type IN ('system', 'shadow_active', 'shadow_heroic', 'system_mercenary')),
ADD COLUMN IF NOT EXISTS snapshot_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS royalty_rate INTEGER DEFAULT 10;

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_historical_user_id ON historical_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_royalty_source_target ON royalty_logs(source_user_id, target_user_id);
CREATE INDEX IF NOT EXISTS idx_party_source_user ON party_members(source_user_id);

-- 7. RLS Policies
-- Enable RLS
ALTER TABLE historical_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Items: Readable by everyone, Writable by Service Role only (or admin)
DROP POLICY IF EXISTS "Public read items" ON items;
CREATE POLICY "Public read items" ON items FOR SELECT USING (true);

-- Historical Logs: Users can view their own history.
DROP POLICY IF EXISTS "Users can view own history" ON historical_logs;
CREATE POLICY "Users can view own history" ON historical_logs FOR SELECT USING (auth.uid() = user_id);
-- Service Role creates logs on death.

-- Royalty Logs: Users can view their own earnings.
DROP POLICY IF EXISTS "Users can view own royalties" ON royalty_logs;
CREATE POLICY "Users can view own royalties" ON royalty_logs FOR SELECT USING (auth.uid() = source_user_id);

-- Updates to User Profiles need to allow service role full access (default), 
-- but we might need specific policies if we do client-side logic (prefer server-side).
