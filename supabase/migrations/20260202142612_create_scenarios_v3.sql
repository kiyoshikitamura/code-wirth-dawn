-- Migration: Update scenarios table for Quest System v3
-- Generated on: 20260202142612

-- 1. Add new columns for Quest System v3
ALTER TABLE scenarios 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Subjugation',
ADD COLUMN IF NOT EXISTS time_cost INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS ruling_nation_id TEXT,
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id),
ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS rewards JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS flow_nodes JSONB DEFAULT '[]'::jsonb;

-- 2. Add indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_scenarios_location_id ON scenarios(location_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_ruling_nation_id ON scenarios(ruling_nation_id);

-- 3. Add comments for schema documentation
COMMENT ON COLUMN scenarios.conditions IS 'Filtering logic: { locations: string[], min_level: number, required_tags: string[], alignment_filter: { order: number } }';
COMMENT ON COLUMN scenarios.rewards IS 'Rewards: { gold: int, items: string[], alignment_shift: { order: int }, reputation_diff: { loc_id: int }, world_impact: { target_loc: string, attribute: string, value: int } }';
COMMENT ON COLUMN scenarios.flow_nodes IS 'BYORK Scenario Graph: Array of { id: string, text: string, choices: [] }';

-- 4. Insert sample data (optional, for testing)
-- This ensures the system has at least one valid V3 scenario
INSERT INTO scenarios (
    title, 
    description, 
    type, 
    time_cost, 
    client_name, 
    conditions, 
    rewards, 
    flow_nodes
) VALUES (
    'スライムの異常発生',
    '村の近くでスライムが大量発生している。討伐してほしい。',
    'Subjugation',
    1,
    '村長',
    '{"min_level": 1}'::jsonb,
    '{"gold": 150, "reputation_diff": {"loc_start_town": 10}, "alignment_shift": {"order": 2}}'::jsonb,
    '[
        {
            "id": "start",
            "text": "村の外れにスライムの群れが見える。",
            "choices": [
                { "label": "戦う", "next_node": "battle" },
                { "label": "様子を見る", "next_node": "observe" }
            ]
        },
        {
            "id": "battle",
            "text": "スライムたちが襲い掛かってきた！",
            "choices": [
                { "label": "勝利！", "next_node": "win" }
            ]
        },
        {
            "id": "win",
            "text": "スライムを全て倒した。",
            "choices": []
        }
    ]'::jsonb
);
