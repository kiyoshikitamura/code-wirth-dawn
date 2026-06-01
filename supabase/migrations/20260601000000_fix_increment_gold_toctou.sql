-- Migration: Fix increment_gold RPC to prevent TOCTOU (double-spend) exploit
-- Date: 2026-06-01
-- Issue: increment_gold had no negative balance guard (RAISE EXCEPTION was commented out).
--        Combined with no CHECK constraint on gold, concurrent requests could
--        drive gold negative, enabling free purchases.

-- 1. Replace increment_gold with atomic guard using UPDATE ... RETURNING
CREATE OR REPLACE FUNCTION increment_gold(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_gold INTEGER;
BEGIN
  UPDATE user_profiles
  SET 
    gold = gold + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING gold INTO v_new_gold;

  -- Atomic negative balance check (evaluated AFTER the UPDATE within the same row lock)
  IF v_new_gold < 0 THEN
    RAISE EXCEPTION 'Insufficient gold: result would be %', v_new_gold
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

-- 2. Add CHECK constraint as defense-in-depth (catches any direct UPDATE bypassing RPC)
-- Use NOT VALID to avoid scanning existing rows (in case any are already negative)
ALTER TABLE user_profiles
  ADD CONSTRAINT gold_non_negative CHECK (gold >= 0) NOT VALID;

-- Then validate to enforce for future operations
ALTER TABLE user_profiles
  VALIDATE CONSTRAINT gold_non_negative;
