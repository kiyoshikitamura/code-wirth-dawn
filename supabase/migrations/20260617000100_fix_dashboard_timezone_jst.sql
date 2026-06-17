-- Migration: Fix Dashboard Timezone JST
-- Redefine views to fix timezone mapping bug where double conversion shifted date backwards.

-- 1. Redefine daily_basic_stats_view with correct timezone conversion and series generator
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
  -- Active UU: distinct users performing battles or starting quests on that day
  SELECT 
    jst_date,
    COUNT(DISTINCT user_id)::integer as dau
  FROM (
    SELECT (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date, user_id FROM public.battle_sessions
    UNION
    SELECT (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date, user_id FROM public.quest_activity_logs WHERE action = 'start'
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


-- 2. Redefine daily_active_user_ids_view
CREATE OR REPLACE VIEW public.daily_active_user_ids_view AS
SELECT 
  (created_at AT TIME ZONE 'Asia/Tokyo')::date::text as date,
  user_id
FROM (
  SELECT created_at, user_id FROM public.battle_sessions WHERE user_id IS NOT NULL
  UNION
  SELECT created_at, user_id FROM public.quest_activity_logs WHERE user_id IS NOT NULL AND action = 'start'
) combined
GROUP BY date, user_id;


-- 3. Redefine daily_paying_user_ids_view
CREATE OR REPLACE VIEW public.daily_paying_user_ids_view AS
SELECT 
  (created_at AT TIME ZONE 'Asia/Tokyo')::date::text as date,
  user_id
FROM public.payment_logs
WHERE user_id IS NOT NULL
GROUP BY date, user_id;
