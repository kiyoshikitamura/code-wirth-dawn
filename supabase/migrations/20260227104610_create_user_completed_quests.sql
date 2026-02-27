-- Create user_completed_quests table to store quest completion history

CREATE TABLE IF NOT EXISTS user_completed_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    scenario_id BIGINT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only have one completion record per quest
    CONSTRAINT unique_user_scenario_completion UNIQUE (user_id, scenario_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_completed_quests_user_id ON user_completed_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_completed_quests_scenario_id ON user_completed_quests(scenario_id);

-- Enable RLS
ALTER TABLE user_completed_quests ENABLE ROW LEVEL SECURITY;

-- Policy allowing public (or authenticated) read/write if needed, matching current MVP security style
CREATE POLICY "Public full access user_completed_quests" ON user_completed_quests FOR ALL USING (true) WITH CHECK (true);
