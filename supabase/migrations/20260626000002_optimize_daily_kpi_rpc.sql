-- Migration: Optimize get_daily_kpi RPC to prevent timeouts on large datasets
-- By pre-filtering and distincting user activities for the target range (last days_limit + 30 days)
-- we avoid repeated full table scans inside the scalar subqueries.

DROP FUNCTION IF EXISTS public.get_daily_kpi(INTEGER);

CREATE OR REPLACE FUNCTION public.get_daily_kpi(days_limit INTEGER)
RETURNS TABLE (
  kpi_date TEXT,
  new_users INTEGER,
  new_users_registered INTEGER,
  new_users_guest INTEGER,
  total_battles INTEGER,
  victories INTEGER,
  defeats INTEGER,
  fleds INTEGER,
  revenue INTEGER,
  dpu INTEGER,
  dau INTEGER,
  mau INTEGER,
  anon_mau INTEGER,
  auth_mau INTEGER,
  mpu INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT ((NOW() AT TIME ZONE 'Asia/Tokyo')::date - i)::date as jst_date
    FROM generate_series(0, days_limit - 1) as i
  ),
  basic_stats AS (
    SELECT 
      v.date,
      v.new_users::integer as val_new_users,
      v.new_users_registered::integer as val_new_users_registered,
      v.new_users_guest::integer as val_new_users_guest,
      v.total_battles::integer as val_total_battles,
      v.victories::integer as val_victories,
      v.defeats::integer as val_defeats,
      v.fleds::integer as val_fleds,
      v.revenue::integer as val_revenue,
      v.dpu::integer as val_dpu,
      v.dau::integer as val_dau
    FROM public.daily_basic_stats_view v
  ),
  -- 1. Pre-distinct active user dates for the required range (up to days_limit + 30 days ago)
  user_active_dates AS (
    SELECT DISTINCT user_id, (created_at AT TIME ZONE 'Asia/Tokyo')::date as active_date
    FROM public.battle_sessions
    WHERE user_id IS NOT NULL 
      AND created_at >= (NOW() AT TIME ZONE 'Asia/Tokyo')::date - (days_limit + 35)
    UNION
    SELECT DISTINCT user_id, (created_at AT TIME ZONE 'Asia/Tokyo')::date as active_date
    FROM public.quest_activity_logs
    WHERE user_id IS NOT NULL AND action = 'start'
      AND created_at >= (NOW() AT TIME ZONE 'Asia/Tokyo')::date - (days_limit + 35)
    UNION
    SELECT DISTINCT user_id, (created_at AT TIME ZONE 'Asia/Tokyo')::date as active_date
    FROM public.colosseum_activity_logs
    WHERE user_id IS NOT NULL AND action = 'start'
      AND created_at >= (NOW() AT TIME ZONE 'Asia/Tokyo')::date - (days_limit + 35)
  ),
  -- 2. Pre-joined user info to split anonymous vs authenticated active users
  active_users_with_info AS (
    SELECT uad.user_id, uad.active_date, u.is_anonymous
    FROM user_active_dates uad
    LEFT JOIN public.user_profiles u ON uad.user_id = u.id
  ),
  -- 3. Pre-distinct paying user dates for the required range
  payer_active_dates AS (
    SELECT DISTINCT user_id, (created_at AT TIME ZONE 'Asia/Tokyo')::date as pay_date
    FROM public.payment_logs
    WHERE user_id IS NOT NULL
      AND created_at >= (NOW() AT TIME ZONE 'Asia/Tokyo')::date - (days_limit + 35)
  )
  SELECT 
    ds.jst_date::text,
    COALESCE(b.val_new_users, 0),
    COALESCE(b.val_new_users_registered, 0),
    COALESCE(b.val_new_users_guest, 0),
    COALESCE(b.val_total_battles, 0),
    COALESCE(b.val_victories, 0),
    COALESCE(b.val_defeats, 0),
    COALESCE(b.val_fleds, 0),
    COALESCE(b.val_revenue, 0),
    COALESCE(b.val_dpu, 0),
    COALESCE(b.val_dau, 0),
    (
      SELECT COUNT(DISTINCT uad.user_id)::integer
      FROM user_active_dates uad
      WHERE uad.active_date >= ds.jst_date - 29 AND uad.active_date <= ds.jst_date
    ),
    (
      SELECT COUNT(DISTINCT au.user_id)::integer
      FROM active_users_with_info au
      WHERE au.active_date >= ds.jst_date - 29 AND au.active_date <= ds.jst_date
        AND au.is_anonymous = true
    ),
    (
      SELECT COUNT(DISTINCT au.user_id)::integer
      FROM active_users_with_info au
      WHERE au.active_date >= ds.jst_date - 29 AND au.active_date <= ds.jst_date
        AND au.is_anonymous = false
    ),
    (
      SELECT COUNT(DISTINCT pad.user_id)::integer
      FROM payer_active_dates pad
      WHERE pad.pay_date >= ds.jst_date - 29 AND pad.pay_date <= ds.jst_date
    )
  FROM date_series ds
  LEFT JOIN basic_stats b ON ds.jst_date::text = b.date
  ORDER BY ds.jst_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_daily_kpi(INTEGER) TO anon, authenticated, service_role;
