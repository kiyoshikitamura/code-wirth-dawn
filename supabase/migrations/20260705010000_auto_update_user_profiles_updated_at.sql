-- Migration: Automatically update user_profiles updated_at column on update
-- Purpose: Enable accurate concurrent user (DAU/online-count) tracking during quest progression

-- 1. Create or replace trigger function specifically for user_profiles
CREATE OR REPLACE FUNCTION public.handle_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Bind trigger to user_profiles table BEFORE UPDATE
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_profiles_updated_at();
