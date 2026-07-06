-- Migration: Add world_elapsed_days to user_profiles and sync via trigger

-- 1. Add column to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS world_elapsed_days INTEGER DEFAULT 0;

-- 2. Initialize with current accumulated_days
UPDATE public.user_profiles SET world_elapsed_days = COALESCE(accumulated_days, 0) WHERE world_elapsed_days IS NULL OR world_elapsed_days = 0;

-- 3. Create sync trigger function
CREATE OR REPLACE FUNCTION public.sync_user_world_elapsed_days()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.world_elapsed_days := COALESCE(NEW.accumulated_days, 0);
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.accumulated_days >= COALESCE(OLD.accumulated_days, 0) THEN
            NEW.world_elapsed_days := COALESCE(OLD.world_elapsed_days, 0) + (NEW.accumulated_days - COALESCE(OLD.accumulated_days, 0));
        ELSE
            -- This is a reset / reincarnation (accumulated_days went down), keep the current world_elapsed_days
            NEW.world_elapsed_days := COALESCE(OLD.world_elapsed_days, 0);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger
DROP TRIGGER IF EXISTS trg_sync_user_world_elapsed_days ON public.user_profiles;
CREATE TRIGGER trg_sync_user_world_elapsed_days
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_world_elapsed_days();
