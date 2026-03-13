-- Migration: Add increment_gold RPC to prevent race conditions
-- Date: 2026-03-12

CREATE OR REPLACE FUNCTION increment_gold(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles
  SET 
    gold = gold + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Ensure gold doesn't go negative if that's a requirement
  -- Depending on the game design, we might want to check this:
  -- IF (SELECT gold FROM user_profiles WHERE id = p_user_id) < 0 THEN
  --   RAISE EXCEPTION 'Not enough gold';
  -- END IF;
END;
$$;
