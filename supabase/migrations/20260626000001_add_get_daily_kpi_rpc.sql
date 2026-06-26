-- Migration: Add get_daily_kpi RPC to optimize daily dashboard calculations and avoid PostgREST row limits
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
      SELECT COUNT(DISTINCT user_id)::integer
      FROM (
        SELECT user_id FROM public.battle_sessions 
        WHERE user_id IS NOT NULL 
          AND created_at >= (ds.jst_date - 29)::timestamp at time zone 'Asia/Tokyo'
          AND created_at < (ds.jst_date + 1)::timestamp at time zone 'Asia/Tokyo'
        UNION ALL
        SELECT user_id FROM public.quest_activity_logs 
        WHERE user_id IS NOT NULL AND action = 'start'
          AND created_at >= (ds.jst_date - 29)::timestamp at time zone 'Asia/Tokyo'
          AND created_at < (ds.jst_date + 1)::timestamp at time zone 'Asia/Tokyo'
        UNION ALL
        SELECT user_id FROM public.colosseum_activity_logs 
        WHERE user_id IS NOT NULL AND action = 'start'
          AND created_at >= (ds.jst_date - 29)::timestamp at time zone 'Asia/Tokyo'
          AND created_at < (ds.jst_date + 1)::timestamp at time zone 'Asia/Tokyo'
      ) combined
    ),
    (
      SELECT COUNT(DISTINCT combined.user_id)::integer
      FROM (
        SELECT user_id FROM public.battle_sessions 
        WHERE user_id IS NOT NULL 
          AND created_at >= (ds.jst_date - 29)::timestamp at time zone 'Asia/Tokyo'
          AND created_at < (ds.jst_date + 1)::timestamp at time zone 'Asia/Tokyo'
        UNION ALL
        SELECT user_id FROM public.quest_activity_logs 
        WHERE user_id IS NOT NULL AND action = 'start'
          AND created_at >= (ds.jst_date - 29)::timestamp at time zone 'Asia/Tokyo'
          AND created_at < (ds.jst_date + 1)::timestamp at time zone 'Asia/Tokyo'
        UNION ALL
        SELECT user_id FROM public.colosseum_activity_logs 
        WHERE user_id IS NOT NULL AND action = 'start'
          AND created_at >= (ds.jst_date - 29)::timestamp at time zone 'Asia/Tokyo'
          AND created_at < (ds.jst_date + 1)::timestamp at time zone 'Asia/Tokyo'
      ) combined
      JOIN public.user_profiles u ON combined.user_id = u.id
      WHERE u.is_anonymous = true
    ),
    (
      SELECT COUNT(DISTINCT combined.user_id)::integer
      FROM (
        SELECT user_id FROM public.battle_sessions 
        WHERE user_id IS NOT NULL 
          AND created_at >= (ds.jst_date - 29)::timestamp at time zone 'Asia/Tokyo'
          AND created_at < (ds.jst_date + 1)::timestamp at time zone 'Asia/Tokyo'
        UNION ALL
        SELECT user_id FROM public.quest_activity_logs 
        WHERE user_id IS NOT NULL AND action = 'start'
          AND created_at >= (ds.jst_date - 29)::timestamp at time zone 'Asia/Tokyo'
          AND created_at < (ds.jst_date + 1)::timestamp at time zone 'Asia/Tokyo'
        UNION ALL
        SELECT user_id FROM public.colosseum_activity_logs 
        WHERE user_id IS NOT NULL AND action = 'start'
          AND created_at >= (ds.jst_date - 29)::timestamp at time zone 'Asia/Tokyo'
          AND created_at < (ds.jst_date + 1)::timestamp at time zone 'Asia/Tokyo'
      ) combined
      JOIN public.user_profiles u ON combined.user_id = u.id
      WHERE u.is_anonymous = false
    ),
    (
      SELECT COUNT(DISTINCT user_id)::integer
      FROM public.payment_logs
      WHERE user_id IS NOT NULL
        AND created_at >= (ds.jst_date - 29)::timestamp at time zone 'Asia/Tokyo'
        AND created_at < (ds.jst_date + 1)::timestamp at time zone 'Asia/Tokyo'
    )
  FROM date_series ds
  LEFT JOIN basic_stats b ON ds.jst_date::text = b.date
  ORDER BY ds.jst_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for RPC execution
GRANT EXECUTE ON FUNCTION public.get_daily_kpi(INTEGER) TO anon, authenticated, service_role;
