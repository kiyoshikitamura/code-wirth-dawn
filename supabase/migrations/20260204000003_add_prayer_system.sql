-- 1. Create prayer_logs table
CREATE TABLE IF NOT EXISTS prayer_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) NOT NULL,
    location_id UUID REFERENCES locations(id) NOT NULL, -- Use UUID FK to locations
    target_attribute TEXT CHECK (target_attribute IN ('Order', 'Chaos', 'Justice', 'Evil')),
    gold_spent INTEGER NOT NULL,
    impact_value FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update world_states table
-- Add daily pools for aggregation
ALTER TABLE world_states
ADD COLUMN IF NOT EXISTS daily_order_pool FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_chaos_pool FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_justice_pool FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_evil_pool FLOAT DEFAULT 0;

-- 3. Enable RLS
ALTER TABLE prayer_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own prayer logs
CREATE POLICY "Users can view own prayer logs" ON prayer_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Everyone can read world_states (already presumably public, but reinforcing)
-- CREATE POLICY "Public read world_states" ON world_states FOR SELECT USING (true);
