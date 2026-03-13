-- Add share_text to scenarios table
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS share_text TEXT;

-- Create world_states_history table
CREATE TABLE IF NOT EXISTS world_states_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'prosperity_change' or 'alignment_change'
    old_value TEXT,
    new_value TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for quick fetching
CREATE INDEX IF NOT EXISTS world_states_history_created_at_idx ON world_states_history(created_at DESC);

-- Create user_world_views table to track what the user has seen
CREATE TABLE IF NOT EXISTS user_world_views (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_seen_history_id UUID REFERENCES world_states_history(id) ON DELETE SET NULL,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create retired_characters table to track graveyard history
CREATE TABLE IF NOT EXISTS retired_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age_days INTEGER NOT NULL DEFAULT 0,
    cause_of_death TEXT NOT NULL,
    final_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    completed_quests_count INTEGER NOT NULL DEFAULT 0,
    death_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Snapshot data if needed (stats, gold, etc)
    snapshot JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS retired_characters_user_id_idx ON retired_characters(user_id);

-- Enable RLS
ALTER TABLE world_states_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_world_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE retired_characters ENABLE ROW LEVEL SECURITY;

-- Policies for world_states_history (Read-Only for all users, insertions handled by service role/CRON)
CREATE POLICY "world_states_history_select_auth" ON world_states_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "world_states_history_select_anon" ON world_states_history FOR SELECT TO anon USING (true);

-- Policies for user_world_views (Users can manage their own records)
CREATE POLICY "user_world_views_select_auth" ON user_world_views FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_world_views_insert_auth" ON user_world_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_world_views_update_auth" ON user_world_views FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Policies for retired_characters (Users can read their own graveyard)
CREATE POLICY "retired_characters_select_auth" ON retired_characters FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "retired_characters_insert_auth" ON retired_characters FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
