-- Migration: Dashboard Performance Optimization v2
-- Redefine user_profile_summary_view and daily_basic_stats_view to include anonymous/registered metrics.
-- Add monthly_kpi_view to perform monthly KPI aggregations inside the database.
-- Create get_daily_active_user_ids and get_daily_paying_user_ids functions to query recent days with index support.

-- 0. Set lock timeout to 10 seconds to avoid hanging indefinitely
SET lock_timeout = '10000';

-- 0. Terminate any active sessions holding locks on the views we are about to drop
SELECT pg_terminate_backend(pid)
FROM pg_locks l
JOIN pg_class c ON l.relation = c.oid
WHERE c.relname IN (
  'user_profile_summary_view',
  'daily_basic_stats_view',
  'monthly_kpi_view',
  'user_level_distribution_view'
)
AND pid <> pg_backend_pid();

-- 1. Redefine user_profile_summary_view to include anon/auth counts
DROP VIEW IF EXISTS public.user_profile_summary_view CASCADE;
CREATE OR REPLACE VIEW public.user_profile_summary_view AS
SELECT
  COUNT(*)::integer as total_users,
  COUNT(*) FILTER (WHERE is_anonymous = true)::integer as anon_users,
  COUNT(*) FILTER (WHERE is_anonymous = false)::integer as auth_users,
  COALESCE(SUM(gold), 0)::bigint as total_gold,
  COALESCE(MAX(gold), 0)::integer as max_gold,
  COALESCE(AVG(gold), 0)::numeric as avg_gold,
  COALESCE(AVG(level), 1)::numeric as avg_level
FROM public.user_profiles;

-- 2. Redefine daily_basic_stats_view to include registered/guest new user counts
DROP VIEW IF EXISTS public.daily_basic_stats_view CASCADE;
CREATE OR REPLACE VIEW public.daily_basic_stats_view AS
WITH date_series AS (
  SELECT ((NOW() AT TIME ZONE 'Asia/Tokyo')::date - i)::date as jst_date
  FROM generate_series(0, 365) as i
),
new_users AS (
  SELECT 
    (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date,
    COUNT(*)::integer as count,
    COUNT(*) FILTER (WHERE is_anonymous = false)::integer as registered,
    COUNT(*) FILTER (WHERE is_anonymous = true)::integer as guest
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
  COALESCE(nu.registered, 0) as new_users_registered,
  COALESCE(nu.guest, 0) as new_users_guest,
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

-- 3. Create monthly_kpi_view for database-side calendar month aggregation
DROP VIEW IF EXISTS public.monthly_kpi_view CASCADE;
CREATE OR REPLACE VIEW public.monthly_kpi_view AS
WITH month_series AS (
  SELECT to_char(((NOW() AT TIME ZONE 'Asia/Tokyo')::date - (i || ' month')::interval), 'YYYY/MM') as month
  FROM generate_series(0, 11) as i
),
monthly_active AS (
  SELECT 
    to_char(created_at AT TIME ZONE 'Asia/Tokyo', 'YYYY/MM') as month,
    COUNT(DISTINCT user_id)::integer as mau
  FROM (
    SELECT created_at, user_id FROM public.battle_sessions WHERE user_id IS NOT NULL
    UNION ALL
    SELECT created_at, user_id FROM public.quest_activity_logs WHERE user_id IS NOT NULL AND action = 'start'
    UNION ALL
    SELECT created_at, user_id FROM public.colosseum_activity_logs WHERE user_id IS NOT NULL AND action = 'start'
  ) combined
  WHERE created_at >= NOW() - INTERVAL '366 days'
  GROUP BY month
),
monthly_paying AS (
  SELECT 
    to_char(created_at AT TIME ZONE 'Asia/Tokyo', 'YYYY/MM') as month,
    COUNT(DISTINCT user_id)::integer as mpu,
    SUM(amount)::integer as revenue
  FROM public.payment_logs
  WHERE user_id IS NOT NULL AND created_at >= NOW() - INTERVAL '366 days'
  GROUP BY month
),
monthly_new_users AS (
  SELECT 
    to_char(created_at AT TIME ZONE 'Asia/Tokyo', 'YYYY/MM') as month,
    COUNT(*) FILTER (WHERE is_anonymous = false)::integer as registered,
    COUNT(*) FILTER (WHERE is_anonymous = true)::integer as guest
  FROM public.user_profiles
  WHERE created_at >= NOW() - INTERVAL '366 days'
  GROUP BY month
)
SELECT 
  ms.month,
  COALESCE(ma.mau, 0) as mau,
  COALESCE(mp.mpu, 0) as mpu,
  COALESCE(mp.revenue, 0) as revenue,
  COALESCE(mnu.registered, 0) as new_users_registered,
  COALESCE(mnu.guest, 0) as new_users_guest
FROM month_series ms
LEFT JOIN monthly_active ma ON ms.month = ma.month
LEFT JOIN monthly_paying mp ON ms.month = mp.month
LEFT JOIN monthly_new_users mnu ON ms.month = mnu.month
ORDER BY ms.month ASC;

-- 4. Redefine user_level_distribution_view to match frontend ranges
DROP VIEW IF EXISTS public.user_level_distribution_view CASCADE;
CREATE OR REPLACE VIEW public.user_level_distribution_view AS
SELECT
  COUNT(*) FILTER (WHERE level = 1)::integer as range_1,
  COUNT(*) FILTER (WHERE level > 1 AND level <= 5)::integer as range_2_5,
  COUNT(*) FILTER (WHERE level > 5 AND level <= 10)::integer as range_6_10,
  COUNT(*) FILTER (WHERE level > 10 AND level <= 15)::integer as range_11_15,
  COUNT(*) FILTER (WHERE level > 15)::integer as range_16_plus
FROM public.user_profiles;

-- 5. Create database functions (RPCs) for index-optimized relative time queries
DROP FUNCTION IF EXISTS public.get_daily_active_user_ids(INTEGER);
CREATE OR REPLACE FUNCTION public.get_daily_active_user_ids(days_limit INTEGER)
RETURNS TABLE (act_date TEXT, act_user_id UUID, is_anon BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (c.created_at AT TIME ZONE 'Asia/Tokyo')::date::text as act_date,
    c.user_id as act_user_id,
    COALESCE(u.is_anonymous, false) as is_anon
  FROM (
    SELECT created_at, user_id FROM public.battle_sessions WHERE user_id IS NOT NULL AND created_at >= NOW() - (days_limit || ' days')::interval
    UNION
    SELECT created_at, user_id FROM public.quest_activity_logs WHERE user_id IS NOT NULL AND action = 'start' AND created_at >= NOW() - (days_limit || ' days')::interval
    UNION
    SELECT created_at, user_id FROM public.colosseum_activity_logs WHERE user_id IS NOT NULL AND action = 'start' AND created_at >= NOW() - (days_limit || ' days')::interval
  ) c
  LEFT JOIN public.user_profiles u ON c.user_id = u.id
  GROUP BY (c.created_at AT TIME ZONE 'Asia/Tokyo')::date, c.user_id, u.is_anonymous;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_daily_paying_user_ids(INTEGER);
CREATE OR REPLACE FUNCTION public.get_daily_paying_user_ids(days_limit INTEGER)
RETURNS TABLE (pay_date TEXT, pay_user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (c.created_at AT TIME ZONE 'Asia/Tokyo')::date::text as pay_date,
    c.user_id as pay_user_id
  FROM public.payment_logs c
  WHERE c.user_id IS NOT NULL AND c.created_at >= NOW() - (days_limit || ' days')::interval
  GROUP BY (c.created_at AT TIME ZONE 'Asia/Tokyo')::date, c.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for RPC execution
GRANT EXECUTE ON FUNCTION public.get_daily_active_user_ids(INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_daily_paying_user_ids(INTEGER) TO anon, authenticated, service_role;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
