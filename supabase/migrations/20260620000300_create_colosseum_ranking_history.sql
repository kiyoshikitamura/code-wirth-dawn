-- Migration: Create Colosseum Ranking History Table
-- This table stores historical colosseum ranking results for audit/support purposes.

CREATE TABLE IF NOT EXISTS public.colosseum_ranking_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cycle_end_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL,
    user_name TEXT,
    wins INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    rank_by_wins INTEGER,
    rank_by_streak INTEGER
);

-- RLS
ALTER TABLE public.colosseum_ranking_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read colosseum_ranking_history" ON public.colosseum_ranking_history;
CREATE POLICY "Public read colosseum_ranking_history" ON public.colosseum_ranking_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service write colosseum_ranking_history" ON public.colosseum_ranking_history;
CREATE POLICY "Service write colosseum_ranking_history" ON public.colosseum_ranking_history FOR ALL USING (true) WITH CHECK (true);

-- Index for fast cycle lookups
CREATE INDEX IF NOT EXISTS idx_colosseum_ranking_history_cycle ON public.colosseum_ranking_history (cycle_end_at);
