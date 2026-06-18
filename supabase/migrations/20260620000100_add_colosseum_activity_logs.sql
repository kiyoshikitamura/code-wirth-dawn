-- Migration: Add Colosseum Activity Logs
-- Create a dedicated table to log Colosseum lifecycle events (start, complete, abandon) and index them for high performance.

-- 1. Create table public.colosseum_activity_logs
CREATE TABLE IF NOT EXISTS public.colosseum_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard')),
    action TEXT NOT NULL CHECK (action IN ('start', 'complete', 'abandon')),
    gold_cost INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for colosseum_activity_logs
ALTER TABLE public.colosseum_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read colosseum_activity_logs" ON public.colosseum_activity_logs;
CREATE POLICY "Public read colosseum_activity_logs" ON public.colosseum_activity_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service write colosseum_activity_logs" ON public.colosseum_activity_logs;
CREATE POLICY "Service write colosseum_activity_logs" ON public.colosseum_activity_logs FOR ALL USING (true) WITH CHECK (true);

-- 2. Create performance indexes
-- Composite index for fast filters/group-by on difficulty and action with time grouping
CREATE INDEX IF NOT EXISTS idx_colosseum_activity_logs_perf 
ON public.colosseum_activity_logs (difficulty, action, created_at);

-- Single indexes for specific filter ranges
CREATE INDEX IF NOT EXISTS idx_colosseum_activity_logs_created_at 
ON public.colosseum_activity_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_colosseum_activity_logs_user_id 
ON public.colosseum_activity_logs (user_id);

-- Speed up fetching of maximum win streak across all users
CREATE INDEX IF NOT EXISTS idx_colosseum_user_stats_max_streak 
ON public.colosseum_user_stats (max_streak DESC);

-- 3. Stored helper function (RPC) to fetch overall Colosseum summary stats
CREATE OR REPLACE FUNCTION public.get_colosseum_summary_stats()
RETURNS TABLE (
    total_players BIGINT,
    total_battles BIGINT,
    total_wins BIGINT,
    max_streak INTEGER,
    total_gold_spent BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT s.user_id)::BIGINT as total_players,
        COALESCE(SUM(s.wins + s.losses), 0)::BIGINT as total_battles,
        COALESCE(SUM(s.wins), 0)::BIGINT as total_wins,
        COALESCE(MAX(s.max_streak), 0)::INTEGER as max_streak,
        (SELECT COALESCE(SUM(gold_cost), 0)::BIGINT FROM public.colosseum_activity_logs WHERE action = 'start') as total_gold_spent
    FROM public.colosseum_user_stats s
    WHERE (s.wins + s.losses) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Stored helper function (RPC) to fetch daily Colosseum stats in Asia/Tokyo time
CREATE OR REPLACE FUNCTION public.get_colosseum_daily_stats(days_limit INTEGER)
RETURNS TABLE (
    date TEXT,
    difficulty TEXT,
    action TEXT,
    count BIGINT,
    gold_spent BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (l.created_at AT TIME ZONE 'Asia/Tokyo')::date::text as date,
        l.difficulty,
        l.action,
        COUNT(*)::BIGINT as count,
        COALESCE(SUM(l.gold_cost), 0)::BIGINT as gold_spent
    FROM public.colosseum_activity_logs l
    WHERE l.created_at >= NOW() - (days_limit || ' days')::INTERVAL
    GROUP BY date, l.difficulty, l.action
    ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
