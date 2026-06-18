-- Add avatar_url column to ranking_colosseum_cache
ALTER TABLE public.ranking_colosseum_cache ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update stored function (RPC) to aggregate rankings with avatar_url
CREATE OR REPLACE FUNCTION public.aggregate_colosseum_ranking()
RETURNS VOID 
AS $$
DECLARE
  lock_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- キャッシュを完全にクリア
  DELETE FROM public.ranking_colosseum_cache WHERE true;

  -- 勝利数・連勝数ランキングを最大500名構築してインサート
  INSERT INTO public.ranking_colosseum_cache (
    user_id,
    user_name,
    avatar_url,
    wins,
    max_streak,
    rank_by_wins,
    rank_by_streak,
    aggregated_at
  )
  SELECT
    p.id as user_id,
    COALESCE(p.name, '名もなき旅人') as user_name,
    p.avatar_url,
    s.wins,
    s.max_streak,
    ROW_NUMBER() OVER (ORDER BY s.wins DESC, s.max_streak DESC, p.created_at ASC) as rank_by_wins,
    ROW_NUMBER() OVER (ORDER BY s.max_streak DESC, s.wins DESC, p.created_at ASC) as rank_by_streak,
    lock_time as aggregated_at
  FROM public.colosseum_user_stats s
  JOIN public.user_profiles p ON p.id = s.user_id
  WHERE (s.wins + s.losses) > 0
  ORDER BY GREATEST(s.wins, s.max_streak) DESC
  LIMIT 500;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
