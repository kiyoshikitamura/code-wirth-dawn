-- Migration: Optimize Dashboard Daily Basic Stats View and add JST expression indexes
-- Limit generated series to 95 days (max displayed in dashboard is 90 days)
-- Add expression indexes to avoid full table scans and timezone computation overhead.

DROP VIEW IF EXISTS public.daily_basic_stats_view CASCADE;

CREATE VIEW public.daily_basic_stats_view AS
WITH date_series AS (
  SELECT ((NOW() AT TIME ZONE 'Asia/Tokyo')::date - i)::date as jst_date
  FROM generate_series(0, 95) as i
),
new_users AS MATERIALIZED (
  SELECT 
    (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date,
    COUNT(*)::integer as count,
    COUNT(*) FILTER (WHERE is_anonymous = false)::integer as registered_count,
    COUNT(*) FILTER (WHERE is_anonymous = true)::integer as guest_count
  FROM public.user_profiles
  WHERE created_at >= NOW() - INTERVAL '100 days'
  GROUP BY jst_date
),
battles AS MATERIALIZED (
  SELECT 
    (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date,
    COUNT(*)::integer as total,
    COUNT(*) FILTER (WHERE status = 'victory')::integer as victory,
    COUNT(*) FILTER (WHERE status = 'defeat')::integer as defeat,
    COUNT(*) FILTER (WHERE status = 'fled')::integer as fled
  FROM public.battle_sessions
  WHERE created_at >= NOW() - INTERVAL '100 days'
  GROUP BY jst_date
),
payments AS MATERIALIZED (
  SELECT 
    (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date,
    SUM(amount)::integer as revenue,
    COUNT(DISTINCT user_id)::integer as dpu
  FROM public.payment_logs
  WHERE created_at >= NOW() - INTERVAL '100 days'
  GROUP BY jst_date
),
active_uu AS MATERIALIZED (
  SELECT 
    jst_date,
    COUNT(DISTINCT user_id)::integer as dau
  FROM (
    SELECT (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date, user_id 
    FROM public.battle_sessions 
    WHERE created_at >= NOW() - INTERVAL '100 days' AND user_id IS NOT NULL
    UNION
    SELECT (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date, user_id 
    FROM public.quest_activity_logs 
    WHERE created_at >= NOW() - INTERVAL '100 days' AND user_id IS NOT NULL AND action = 'start'
  ) combined
  GROUP BY jst_date
)
SELECT 
  ds.jst_date::text as date,
  COALESCE(nu.count, 0) as new_users,
  COALESCE(nu.registered_count, 0) as new_users_registered,
  COALESCE(nu.guest_count, 0) as new_users_guest,
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

-- Create functional/expression indexes to optimize JST timezone conversion queries
CREATE INDEX IF NOT EXISTS idx_battle_sessions_jst_date 
ON public.battle_sessions ((((created_at AT TIME ZONE 'Asia/Tokyo')::date)));

CREATE INDEX IF NOT EXISTS idx_user_chronicles_jst_date 
ON public.user_chronicles ((((created_at AT TIME ZONE 'Asia/Tokyo')::date)))
WHERE event_type = 'quest_start';

CREATE INDEX IF NOT EXISTS idx_user_profiles_jst_date 
ON public.user_profiles ((((created_at AT TIME ZONE 'Asia/Tokyo')::date)));
