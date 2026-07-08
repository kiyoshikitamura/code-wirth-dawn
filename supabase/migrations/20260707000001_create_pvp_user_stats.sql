-- Create PVP User Stats Table for Arena Mode

CREATE TABLE IF NOT EXISTS public.pvp_user_stats (
    user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    rating INTEGER NOT NULL DEFAULT 1500, -- Arena point rating
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pvp_user_stats ENABLE ROW LEVEL SECURITY;

-- 1. Public read access
DROP POLICY IF EXISTS "Public read pvp_user_stats" ON public.pvp_user_stats;
CREATE POLICY "Public read pvp_user_stats" ON public.pvp_user_stats FOR SELECT TO PUBLIC USING (true);

-- 2. Service role / authenticated write access (managed by API)
DROP POLICY IF EXISTS "Service write pvp_user_stats" ON public.pvp_user_stats;
CREATE POLICY "Service write pvp_user_stats" ON public.pvp_user_stats FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
