-- Migration: Optimize Dashboard Views for Scalability
-- Refactor views to include pre-aggregated metrics and avoid Node.js memory exhaustion.

-- 1. Update user_profile_summary_view to pre-calculate anonymous vs authenticated counts
CREATE OR REPLACE VIEW public.user_profile_summary_view AS
SELECT
  COUNT(*)::integer as total_users,
  COUNT(*) FILTER (WHERE is_anonymous = true)::integer as anon_users_count,
  COUNT(*) FILTER (WHERE is_anonymous = false)::integer as auth_users_count,
  COALESCE(SUM(gold), 0)::bigint as total_gold,
  COALESCE(MAX(gold), 0)::integer as max_gold,
  COALESCE(AVG(gold), 0)::numeric as avg_gold,
  COALESCE(AVG(level), 1)::numeric as avg_level
FROM public.user_profiles;


-- 2. Update daily_basic_stats_view to include registered vs guest new users
CREATE OR REPLACE VIEW public.daily_basic_stats_view AS
WITH date_series AS (
  SELECT (CURRENT_DATE - i)::date as jst_date
  FROM generate_series(0, 365) as i
),
new_users AS (
  SELECT 
    (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date as jst_date,
    COUNT(*)::integer as count,
    COUNT(*) FILTER (WHERE is_anonymous = false)::integer as registered_count,
    COUNT(*) FILTER (WHERE is_anonymous = true)::integer as guest_count
  FROM public.user_profiles
  GROUP BY jst_date
),
battles AS (
  SELECT 
    (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date as jst_date,
    COUNT(*)::integer as total,
    COUNT(*) FILTER (WHERE status = 'victory')::integer as victory,
    COUNT(*) FILTER (WHERE status = 'defeat')::integer as defeat,
    COUNT(*) FILTER (WHERE status = 'fled')::integer as fled
  FROM public.battle_sessions
  GROUP BY jst_date
),
payments AS (
  SELECT 
    (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date as jst_date,
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
    SELECT (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date as jst_date, user_id FROM public.battle_sessions
    UNION
    SELECT (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date as jst_date, user_id FROM public.quest_activity_logs WHERE action = 'start'
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


-- 3. Create monthly_kpi_view to pre-calculate all monthly aggregations on the DB side
CREATE OR REPLACE VIEW public.monthly_kpi_view AS
WITH month_series AS (
  -- Generate the last 12 months in YYYY/MM format
  SELECT TO_CHAR(date_trunc('month', (CURRENT_DATE AT TIME ZONE 'Asia/Tokyo') - (i || ' month')::interval), 'YYYY/MM') as jst_month
  FROM generate_series(0, 11) as i
),
monthly_revenue AS (
  SELECT 
    TO_CHAR((created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo'), 'YYYY/MM') as jst_month,
    SUM(amount)::integer as revenue
  FROM public.payment_logs
  GROUP BY jst_month
),
monthly_new_users AS (
  SELECT 
    TO_CHAR((created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo'), 'YYYY/MM') as jst_month,
    COUNT(*) FILTER (WHERE is_anonymous = false)::integer as registered_count,
    COUNT(*) FILTER (WHERE is_anonymous = true)::integer as guest_count
  FROM public.user_profiles
  GROUP BY jst_month
),
monthly_active_uu AS (
  SELECT 
    jst_month,
    COUNT(DISTINCT user_id)::integer as mau
  FROM (
    SELECT TO_CHAR((created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo'), 'YYYY/MM') as jst_month, user_id FROM public.battle_sessions WHERE user_id IS NOT NULL
    UNION
    SELECT TO_CHAR((created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo'), 'YYYY/MM') as jst_month, user_id FROM public.quest_activity_logs WHERE user_id IS NOT NULL AND action = 'start'
  ) combined
  GROUP BY jst_month
),
monthly_paying_uu AS (
  SELECT 
    TO_CHAR((created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo'), 'YYYY/MM') as jst_month,
    COUNT(DISTINCT user_id)::integer as mpu
  FROM public.payment_logs
  WHERE user_id IS NOT NULL
  GROUP BY jst_month
)
SELECT 
  ms.jst_month as month,
  COALESCE(mr.revenue, 0) as revenue,
  COALESCE(ma.mau, 0) as mau,
  COALESCE(mp.mpu, 0) as mpu,
  COALESCE(nu.registered_count, 0) as new_users_registered,
  COALESCE(nu.guest_count, 0) as new_users_guest
FROM month_series ms
LEFT JOIN monthly_revenue mr ON ms.jst_month = mr.jst_month
LEFT JOIN monthly_active_uu ma ON ms.jst_month = ma.jst_month
LEFT JOIN monthly_paying_uu mp ON ms.jst_month = mp.jst_month
LEFT JOIN monthly_new_users nu ON ms.jst_month = nu.jst_month
ORDER BY ms.jst_month ASC;
