-- Migration: Create Academy Pack Logs Table and Indexes
-- This table tracks the purchase activities at the Magic Academy (booster packs) for business intelligence.

-- 1. Create table public.academy_pack_logs
CREATE TABLE IF NOT EXISTS public.academy_pack_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    pack_series TEXT NOT NULL, -- e.g. 'chaos_and_rebellion'
    gold_spent INTEGER NOT NULL, -- Net cost after cashback refunds
    refund_gold INTEGER NOT NULL DEFAULT 0, -- Cashback amount from duplicates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies for academy_pack_logs
ALTER TABLE public.academy_pack_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read academy_pack_logs" ON public.academy_pack_logs;
CREATE POLICY "Public read academy_pack_logs" ON public.academy_pack_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service write academy_pack_logs" ON public.academy_pack_logs;
CREATE POLICY "Service write academy_pack_logs" ON public.academy_pack_logs FOR ALL USING (true) WITH CHECK (true);

-- 2. Create load-prevention indexes
-- Index for quick aggregation of time series by series (Optimizes Index Only Scan for dashboard)
CREATE INDEX IF NOT EXISTS idx_academy_pack_logs_series_created 
ON public.academy_pack_logs (pack_series, created_at);

-- Single indexes for specific constraints/lookups
CREATE INDEX IF NOT EXISTS idx_academy_pack_logs_user 
ON public.academy_pack_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_academy_pack_logs_created 
ON public.academy_pack_logs (created_at);

-- 3. Stored helper function (RPC) to fetch overall Magic Academy summary stats
CREATE OR REPLACE FUNCTION public.get_academy_summary_stats()
RETURNS TABLE (
    total_players BIGINT,
    total_packs BIGINT,
    total_gold_spent BIGINT,
    total_refund_gold BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT user_id)::BIGINT as total_players,
        COUNT(*)::BIGINT as total_packs,
        COALESCE(SUM(gold_spent), 0)::BIGINT as total_gold_spent,
        COALESCE(SUM(refund_gold), 0)::BIGINT as total_refund_gold
    FROM public.academy_pack_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Stored helper function (RPC) to fetch daily Magic Academy stats in Asia/Tokyo time
CREATE OR REPLACE FUNCTION public.get_academy_daily_stats(days_limit INTEGER)
RETURNS TABLE (
    date TEXT,
    pack_series TEXT,
    pack_count BIGINT,
    gold_spent BIGINT,
    refund_gold BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (created_at AT TIME ZONE 'Asia/Tokyo')::date::text as date,
        l.pack_series,
        COUNT(*)::BIGINT as pack_count,
        COALESCE(SUM(l.gold_spent), 0)::BIGINT as gold_spent,
        COALESCE(SUM(l.refund_gold), 0)::BIGINT as refund_gold
    FROM public.academy_pack_logs l
    WHERE l.created_at >= NOW() - (days_limit || ' days')::INTERVAL
    GROUP BY date, l.pack_series
    ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
