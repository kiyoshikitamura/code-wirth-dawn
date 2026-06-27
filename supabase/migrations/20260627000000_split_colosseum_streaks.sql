-- ALTER TABLES to add difficulty-based streak columns
ALTER TABLE public.colosseum_user_stats 
ADD COLUMN IF NOT EXISTS current_streak_easy INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak_easy INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak_normal INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak_normal INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak_hard INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak_hard INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.ranking_colosseum_cache 
ADD COLUMN IF NOT EXISTS max_streak_easy INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak_normal INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak_hard INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank_by_streak_easy INTEGER,
ADD COLUMN IF NOT EXISTS rank_by_streak_normal INTEGER,
ADD COLUMN IF NOT EXISTS rank_by_streak_hard INTEGER;

ALTER TABLE public.colosseum_ranking_history 
ADD COLUMN IF NOT EXISTS max_streak_easy INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak_normal INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak_hard INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank_by_streak_easy INTEGER,
ADD COLUMN IF NOT EXISTS rank_by_streak_normal INTEGER,
ADD COLUMN IF NOT EXISTS rank_by_streak_hard INTEGER;

-- Recreate aggregate_colosseum_ranking function
CREATE OR REPLACE FUNCTION public.aggregate_colosseum_ranking()
RETURNS VOID 
AS $$
DECLARE
  lock_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- キャッシュを完全にクリア
  DELETE FROM public.ranking_colosseum_cache WHERE user_id IS DISTINCT FROM '00000000-0000-0000-0000-000000000000';

  -- 勝利数・各種連勝数ランキングを最大500名構築してインサート
  INSERT INTO public.ranking_colosseum_cache (
    user_id,
    user_name,
    avatar_url,
    wins,
    max_streak_easy,
    max_streak_normal,
    max_streak_hard,
    rank_by_wins,
    rank_by_streak_easy,
    rank_by_streak_normal,
    rank_by_streak_hard,
    aggregated_at
  )
  SELECT
    p.id as user_id,
    COALESCE(p.name, '名もなき旅人') as user_name,
    p.avatar_url,
    s.wins,
    s.max_streak_easy,
    s.max_streak_normal,
    s.max_streak_hard,
    ROW_NUMBER() OVER (ORDER BY s.wins DESC, GREATEST(s.max_streak_easy, s.max_streak_normal, s.max_streak_hard) DESC, p.created_at ASC) as rank_by_wins,
    ROW_NUMBER() OVER (ORDER BY s.max_streak_easy DESC, s.wins DESC, p.created_at ASC) as rank_by_streak_easy,
    ROW_NUMBER() OVER (ORDER BY s.max_streak_normal DESC, s.wins DESC, p.created_at ASC) as rank_by_streak_normal,
    ROW_NUMBER() OVER (ORDER BY s.max_streak_hard DESC, s.wins DESC, p.created_at ASC) as rank_by_streak_hard,
    lock_time as aggregated_at
  FROM public.colosseum_user_stats s
  JOIN public.user_profiles p ON p.id = s.user_id
  WHERE (s.wins + s.losses) > 0
  ORDER BY GREATEST(s.wins, s.max_streak_easy, s.max_streak_normal, s.max_streak_hard) DESC
  LIMIT 500;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
