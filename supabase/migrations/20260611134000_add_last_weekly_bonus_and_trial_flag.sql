-- Add last_weekly_bonus_at and has_used_trial columns to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS last_weekly_bonus_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN NOT NULL DEFAULT false;
