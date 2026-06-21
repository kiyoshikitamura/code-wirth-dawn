-- Migration: Add increment_world_days RPC to prevent race conditions on world states total days passed
-- Created At: 2026-06-21

CREATE OR REPLACE FUNCTION increment_world_days(
    p_location_name TEXT,
    p_days INTEGER
) RETURNS VOID AS $$
BEGIN
    INSERT INTO world_states (location_name, total_days_passed, status, prosperity_level, controlling_nation, updated_at)
    VALUES (p_location_name, p_days, '安定', 3, 'Neutral', NOW())
    ON CONFLICT (location_name)
    DO UPDATE SET 
        total_days_passed = COALESCE(world_states.total_days_passed, 0) + EXCLUDED.total_days_passed,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
