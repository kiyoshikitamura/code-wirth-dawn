-- Migration: Create daily_kpi_cache table and incremental refresh database function
-- To prevent gateway timeout errors by caching daily kpi stats and running JST-filtered incremental updates.

CREATE TABLE IF NOT EXISTS public.daily_kpi_cache (
  date TEXT PRIMARY KEY,
  new_users INTEGER NOT NULL,
  new_users_registered INTEGER NOT NULL,
  new_users_guest INTEGER NOT NULL,
  total_battles INTEGER NOT NULL,
  victories INTEGER NOT NULL,
  defeats INTEGER NOT NULL,
  fleds INTEGER NOT NULL,
  revenue INTEGER NOT NULL,
  dpu INTEGER NOT NULL,
  dau INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Define optimized refresh database function with date filters inside CTEs
CREATE OR REPLACE FUNCTION public.refresh_daily_kpi_cache(full_refresh BOOLEAN DEFAULT false)
RETURNS VOID AS $$
DECLARE
  v_start_date DATE;
BEGIN
  IF full_refresh THEN
    v_start_date := (NOW() AT TIME ZONE 'Asia/Tokyo')::date - 95;
  ELSE
    v_start_date := (NOW() AT TIME ZONE 'Asia/Tokyo')::date - 2;
  END IF;

  INSERT INTO public.daily_kpi_cache (
    date, new_users, new_users_registered, new_users_guest, 
    total_battles, victories, defeats, fleds, revenue, dpu, dau, updated_at
  )
  WITH date_series AS (
    SELECT (v_start_date + i)::date as jst_date
    FROM generate_series(0, ((NOW() AT TIME ZONE 'Asia/Tokyo')::date - v_start_date)) as i
  ),
  new_users AS (
    SELECT 
      (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date,
      COUNT(*)::integer as count,
      COUNT(*) FILTER (WHERE is_anonymous = false)::integer as registered_count,
      COUNT(*) FILTER (WHERE is_anonymous = true)::integer as guest_count
    FROM public.user_profiles
    WHERE created_at >= (v_start_date - INTERVAL '1 day')
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
    WHERE created_at >= (v_start_date - INTERVAL '1 day')
    GROUP BY jst_date
  ),
  payments AS (
    SELECT 
      (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date,
      SUM(amount)::integer as revenue,
      COUNT(DISTINCT user_id)::integer as dpu
    FROM public.payment_logs
    WHERE created_at >= (v_start_date - INTERVAL '1 day')
    GROUP BY jst_date
  ),
  active_uu AS (
    SELECT 
      jst_date,
      COUNT(DISTINCT user_id)::integer as dau
    FROM (
      SELECT (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date, user_id 
      FROM public.battle_sessions 
      WHERE created_at >= (v_start_date - INTERVAL '1 day') AND user_id IS NOT NULL
      UNION
      SELECT (created_at AT TIME ZONE 'Asia/Tokyo')::date as jst_date, user_id 
      FROM public.quest_activity_logs 
      WHERE created_at >= (v_start_date - INTERVAL '1 day') AND user_id IS NOT NULL AND action = 'start'
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
    COALESCE(a.dau, 0) as dau,
    NOW() as updated_at
  FROM date_series ds
  LEFT JOIN new_users nu ON ds.jst_date = nu.jst_date
  LEFT JOIN battles b ON ds.jst_date = b.jst_date
  LEFT JOIN payments p ON ds.jst_date = p.jst_date
  LEFT JOIN active_uu a ON ds.jst_date = a.jst_date
  WHERE ds.jst_date >= v_start_date
  ON CONFLICT (date) DO UPDATE SET
    new_users = EXCLUDED.new_users,
    new_users_registered = EXCLUDED.new_users_registered,
    new_users_guest = EXCLUDED.new_users_guest,
    total_battles = EXCLUDED.total_battles,
    victories = EXCLUDED.victories,
    defeats = EXCLUDED.defeats,
    fleds = EXCLUDED.fleds,
    revenue = EXCLUDED.revenue,
    dpu = EXCLUDED.dpu,
    dau = EXCLUDED.dau,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run full refresh once on deploy to populate cache
SELECT public.refresh_daily_kpi_cache(true);
