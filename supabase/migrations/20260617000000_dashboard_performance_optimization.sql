-- Migration: Dashboard Performance Optimization
-- Create indexes for logs and setup database Views to offload heavy KPI query aggregation.

-- 1. Create Indexes to optimize lookup speed and sorting
-- Note: quest_activity_logs is a VIEW referencing public.user_chronicles. We must index the base table instead.
CREATE INDEX IF NOT EXISTS idx_user_chronicles_user_id ON public.user_chronicles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chronicles_event_type ON public.user_chronicles(event_type);
CREATE INDEX IF NOT EXISTS idx_user_chronicles_scenario_id ON public.user_chronicles(scenario_id);
CREATE INDEX IF NOT EXISTS idx_user_chronicles_ugc_scenario_id ON public.user_chronicles(ugc_scenario_id);
CREATE INDEX IF NOT EXISTS idx_user_chronicles_created_at ON public.user_chronicles(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON public.payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON public.payment_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_battle_sessions_user_id ON public.battle_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_sessions_created_at ON public.battle_sessions(created_at);


-- 2. Create View for Quest statistics (Starts, Completes, Abandons per official scenario)
CREATE OR REPLACE VIEW public.quest_activity_stats_view AS
SELECT 
  s.id as scenario_id,
  s.title,
  s.quest_type,
  COALESCE(COUNT(log.id) FILTER (WHERE log.action = 'start'), 0)::integer as start_count,
  COALESCE(COUNT(log.id) FILTER (WHERE log.action = 'complete'), 0)::integer as complete_count,
  COALESCE(COUNT(log.id) FILTER (WHERE log.action = 'abandon'), 0)::integer as abandon_count
FROM public.scenarios s
LEFT JOIN public.quest_activity_logs log ON s.id::text = log.scenario_id
GROUP BY s.id, s.title, s.quest_type;


-- 3. Create View for User Profile statistics (Total Users, Gold stats, Average Level)
CREATE OR REPLACE VIEW public.user_profile_summary_view AS
SELECT
  COUNT(*)::integer as total_users,
  COALESCE(SUM(gold), 0)::bigint as total_gold,
  COALESCE(MAX(gold), 0)::integer as max_gold,
  COALESCE(AVG(gold), 0)::numeric as avg_gold,
  COALESCE(AVG(level), 1)::numeric as avg_level
FROM public.user_profiles;


-- 4. Create View for User Level distribution
CREATE OR REPLACE VIEW public.user_level_distribution_view AS
SELECT
  COUNT(*) FILTER (WHERE level <= 5)::integer as range_1_5,
  COUNT(*) FILTER (WHERE level > 5 AND level <= 10)::integer as range_6_10,
  COUNT(*) FILTER (WHERE level > 10 AND level <= 15)::integer as range_11_15,
  COUNT(*) FILTER (WHERE level > 15)::integer as range_16_plus
FROM public.user_profiles;


-- 5. Create View for Subscription tier distribution
CREATE OR REPLACE VIEW public.user_subscription_distribution_view AS
SELECT
  COUNT(*) FILTER (WHERE COALESCE(subscription_tier, 'free') = 'free')::integer as free_count,
  COUNT(*) FILTER (WHERE subscription_tier = 'basic')::integer as basic_count,
  COUNT(*) FILTER (WHERE subscription_tier = 'premium')::integer as premium_count
FROM public.user_profiles;


-- 6. Create View for daily time-series statistics (last 366 days in JST)
CREATE OR REPLACE VIEW public.daily_basic_stats_view AS
WITH date_series AS (
  SELECT (CURRENT_DATE - i)::date as jst_date
  FROM generate_series(0, 365) as i
),
new_users AS (
  SELECT 
    (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date as jst_date,
    COUNT(*)::integer as count
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
  -- Active UU: distinct users performing battles or starting quests on that day
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


-- 7. Create Views to retrieve light-weight user IDs per day for MAU/MPU sliding window calculation
CREATE OR REPLACE VIEW public.daily_active_user_ids_view AS
SELECT 
  (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date::text as date,
  user_id
FROM (
  SELECT created_at, user_id FROM public.battle_sessions WHERE user_id IS NOT NULL
  UNION
  SELECT created_at, user_id FROM public.quest_activity_logs WHERE user_id IS NOT NULL AND action = 'start'
) combined
GROUP BY date, user_id;

CREATE OR REPLACE VIEW public.daily_paying_user_ids_view AS
SELECT 
  (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::date::text as date,
  user_id
FROM public.payment_logs
WHERE user_id IS NOT NULL
GROUP BY date, user_id;


-- 8. Create View for Payment statistics summary (grouped by type)
CREATE OR REPLACE VIEW public.payment_summary_view AS
SELECT
  type,
  COUNT(*)::integer as count,
  COALESCE(SUM(amount), 0)::bigint as revenue,
  COALESCE(SUM(gold_amount), 0)::bigint as total_gold
FROM public.payment_logs
GROUP BY type;
