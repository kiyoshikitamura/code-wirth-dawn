-- Migration: Add increment_world_state_alignment RPC to prevent race conditions on world states alignment scores
-- Created At: 2026-06-21

CREATE OR REPLACE FUNCTION increment_world_state_alignment(
    p_location_name TEXT,
    p_column_name TEXT,
    p_amount INTEGER
) RETURNS VOID AS $$
BEGIN
    -- Only allow updates to valid alignment columns to prevent SQL injection or schema issues
    IF p_column_name IN ('order_score', 'chaos_score', 'justice_score', 'evil_score') THEN
        EXECUTE format(
            'UPDATE world_states SET %I = COALESCE(%I, 0) + %L, updated_at = NOW() WHERE location_name = %L',
            p_column_name, p_column_name, p_amount, p_location_name
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
