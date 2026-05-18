-- Ranking Feature: ranking_reputation_cache, ranking_alignment_cache, alignment_baseline
-- For spec_v19_hub_collection_system.md §4

-- 名声ランキングキャッシュ（6時間ごとに再集計）
CREATE TABLE IF NOT EXISTS public.ranking_reputation_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name TEXT,
    total_reputation INT NOT NULL DEFAULT 0,
    rank_asc INT,
    rank_desc INT,
    aggregated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ranking_rep_desc ON public.ranking_reputation_cache(total_reputation DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_rep_asc ON public.ranking_reputation_cache(total_reputation ASC);

-- アライメントランキングキャッシュ（15分ごとに再集計）
CREATE TABLE IF NOT EXISTS public.ranking_alignment_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name TEXT,
    order_gained INT NOT NULL DEFAULT 0,
    chaos_gained INT NOT NULL DEFAULT 0,
    justice_gained INT NOT NULL DEFAULT 0,
    evil_gained INT NOT NULL DEFAULT 0,
    total_gained INT NOT NULL DEFAULT 0,
    rank INT,
    aggregated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cycle_started_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ranking_align_total ON public.ranking_alignment_cache(total_gained DESC);

-- アライメントベースライン（6時間サイクル開始時のスナップショット）
CREATE TABLE IF NOT EXISTS public.alignment_baseline (
    user_id UUID PRIMARY KEY,
    order_pts INT NOT NULL DEFAULT 0,
    chaos_pts INT NOT NULL DEFAULT 0,
    justice_pts INT NOT NULL DEFAULT 0,
    evil_pts INT NOT NULL DEFAULT 0,
    cycle_started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.ranking_reputation_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reputation ranking" ON public.ranking_reputation_cache FOR SELECT USING (true);
CREATE POLICY "Service can manage reputation ranking" ON public.ranking_reputation_cache FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.ranking_alignment_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read alignment ranking" ON public.ranking_alignment_cache FOR SELECT USING (true);
CREATE POLICY "Service can manage alignment ranking" ON public.ranking_alignment_cache FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.alignment_baseline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read alignment baseline" ON public.alignment_baseline FOR SELECT USING (true);
CREATE POLICY "Service can manage alignment baseline" ON public.alignment_baseline FOR ALL USING (true) WITH CHECK (true);
