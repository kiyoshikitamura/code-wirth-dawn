-- Migration: Update Dashboard Views for Colosseum
-- Redefine quest_activity_stats_view, daily_basic_stats_view, and daily_active_user_ids_view 
-- to integrate Colosseum activity logs into general quest aggregates, DAU, and MAU calculations.
-- Also add database indexes for load optimization and redefine get_colosseum_summary_stats to support season-reset cycles.

-- 1. Create performance optimization index for action-based dashboard & DAU queries
CREATE INDEX IF NOT EXISTS idx_colosseum_activity_logs_action_created 
ON public.colosseum_activity_logs (action, created_at);

-- 2. Redefine quest_activity_stats_view to union Colosseum activity logs (with all difficulties always shown)
DROP VIEW IF EXISTS public.quest_activity_stats_view CASCADE;
CREATE OR REPLACE VIEW public.quest_activity_stats_view AS
SELECT 
  s.id::text as scenario_id,
  s.title,
  s.quest_type,
  COALESCE(COUNT(log.id) FILTER (WHERE log.action = 'start'), 0)::integer as start_count,
  COALESCE(COUNT(log.id) FILTER (WHERE log.action = 'complete'), 0)::integer as complete_count,
  COALESCE(COUNT(log.id) FILTER (WHERE log.action = 'abandon'), 0)::integer as abandon_count
FROM public.scenarios s
LEFT JOIN public.quest_activity_logs log ON s.id::text = log.scenario_id
GROUP BY s.id, s.title, s.quest_type

UNION ALL

SELECT
  'colosseum_' || d.difficulty as scenario_id,
  CASE 
    WHEN d.difficulty = 'easy' THEN 'コロシアム (Easy)'
    WHEN d.difficulty = 'normal' THEN 'コロシアム (Normal)'
    WHEN d.difficulty = 'hard' THEN 'コロシアム (Hard)'
    ELSE 'コロシアム (' || d.difficulty || ')'
  END as title,
  'colosseum' as quest_type,
  COALESCE(COUNT(log.id) FILTER (WHERE log.action = 'start'), 0)::integer as start_count,
  COALESCE(COUNT(log.id) FILTER (WHERE log.action = 'complete'), 0)::integer as complete_count,
  COALESCE(COUNT(log.id) FILTER (WHERE log.action = 'abandon'), 0)::integer as abandon_count
FROM (
  SELECT 'easy' as difficulty
  UNION ALL
  SELECT 'normal'
  UNION ALL
  SELECT 'hard'
) d
LEFT JOIN public.colosseum_activity_logs log ON d.difficulty = log.difficulty
GROUP BY d.difficulty;


-- 3. Redefine daily_basic_stats_view to include Colosseum starts in active UU (DAU)
CREATE OR REPLACE VIEW public.daily_basic_stats_view AS
WITH date_series AS (
  SELECT ((NOW() AT TIME ZONE 'Asia/Tokyo')::date - i)::date as jst_date
  FROM generate_series(0, 365) as i
),
new_users AS (
  SELECT 
    (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date,
    COUNT(*)::integer as count
  FROM public.user_profiles
  GROUP BY jst_date
),
battles AS (
  SELECT 
    (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date,
    COUNT(*)::integer as total,
    COUNT(*) FILTER (WHERE status = 'victory')::integer as victory,
    COUNT(*) FILTER (WHERE status = 'defeat')::integer as defeat,
    COUNT(*) FILTER (WHERE status = 'fled')::integer as fled
  FROM public.battle_sessions
  GROUP BY jst_date
),
payments AS (
  SELECT 
    (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date,
    SUM(amount)::integer as revenue,
    COUNT(DISTINCT user_id)::integer as dpu
  FROM public.payment_logs
  GROUP BY jst_date
),
active_uu AS (
  SELECT 
    jst_date,
    COUNT(DISTINCT user_id)::integer as dau
  FROM (
    SELECT (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date, user_id FROM public.battle_sessions
    UNION
    SELECT (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date, user_id FROM public.quest_activity_logs WHERE action = 'start'
    UNION
    SELECT (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date, user_id FROM public.colosseum_activity_logs WHERE action = 'start'
  ) combined
  GROUP BY jst_date
)
SELECT 
  ds.jst_date::text as date,
  COALESCE(nu.count, 0) as new_users,
  COALESCE(b.total, 0) as total_battles,
  COALESCE(b.victory, 0) as victories,
  COALESCE(b.defeat, 0) as defeats,
  COALESCE(b.fled, 0) as fleds,
  COALESCE(p.revenue, 0) as revenue,
  COALESCE(p.dpu, 0) as dpu,
  COALESCE(a.dau, 0) as dau
FROM date_series ds
LEFT JOIN new_users nu ON ds.jst_date = nu.jst_date
LEFT JOIN battles b ON ds.jst_date = b.jst_date
LEFT JOIN payments p ON ds.jst_date = p.jst_date
LEFT JOIN active_uu a ON ds.jst_date = a.jst_date
ORDER BY ds.jst_date ASC;


-- 4. Redefine daily_active_user_ids_view to include Colosseum starts in active user list (MAU)
CREATE OR REPLACE VIEW public.daily_active_user_ids_view AS
SELECT 
  (created_at AT TIME ZONE 'Asia/Tokyo')::date::text as date,
  user_id
FROM (
  SELECT created_at, user_id FROM public.battle_sessions WHERE user_id IS NOT NULL
  UNION
  SELECT created_at, user_id FROM public.quest_activity_logs WHERE user_id IS NOT NULL AND action = 'start'
  UNION
  SELECT created_at, user_id FROM public.colosseum_activity_logs WHERE user_id IS NOT NULL AND action = 'start'
) combined
GROUP BY date, user_id;


-- 5. Redefine public.get_colosseum_summary_stats() to fetch cumulative metrics from logs
-- and current season (active 6h cycle) max streak from user stats table.
CREATE OR REPLACE FUNCTION public.get_colosseum_summary_stats()
RETURNS TABLE (
    total_players BIGINT,
    total_battles BIGINT, -- Maps to Challenges in frontend
    total_wins BIGINT,    -- Maps to Clears in frontend
    max_streak INTEGER,   -- Active season max streak
    total_gold_spent BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(DISTINCT user_id)::BIGINT FROM public.colosseum_activity_logs) as total_players,
        (SELECT COUNT(*)::BIGINT FROM public.colosseum_activity_logs WHERE action = 'start') as total_battles,
        (SELECT COUNT(*)::BIGINT FROM public.colosseum_activity_logs WHERE action = 'complete') as total_wins,
        COALESCE((SELECT MAX(s.max_streak) FROM public.colosseum_user_stats s), 0)::INTEGER as max_streak,
        COALESCE((SELECT SUM(gold_cost)::BIGINT FROM public.colosseum_activity_logs WHERE action = 'start'), 0)::BIGINT as total_gold_spent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
