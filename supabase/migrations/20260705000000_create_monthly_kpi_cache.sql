-- Migration: Create monthly_kpi_cache table and incremental refresh database function
-- To prevent gateway timeout errors by caching monthly kpi stats and running JST-filtered incremental updates.

-- 1. Create table public.monthly_kpi_cache
CREATE TABLE IF NOT EXISTS public.monthly_kpi_cache (
  month TEXT PRIMARY KEY,
  revenue INTEGER NOT NULL DEFAULT 0,
  mau INTEGER NOT NULL DEFAULT 0,
  mpu INTEGER NOT NULL DEFAULT 0,
  new_users_registered INTEGER NOT NULL DEFAULT 0,
  new_users_guest INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for monthly_kpi_cache
ALTER TABLE public.monthly_kpi_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read monthly_kpi_cache" ON public.monthly_kpi_cache;
CREATE POLICY "Public read monthly_kpi_cache" ON public.monthly_kpi_cache FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service write monthly_kpi_cache" ON public.monthly_kpi_cache;
CREATE POLICY "Service write monthly_kpi_cache" ON public.monthly_kpi_cache FOR ALL USING (true) WITH CHECK (true);

-- Define optimized refresh monthly function
CREATE OR REPLACE FUNCTION public.refresh_monthly_kpi_cache(full_refresh BOOLEAN DEFAULT false)
RETURNS VOID AS $$
DECLARE
  v_start_month DATE;
  v_start_jst TIMESTAMPTZ;
  v_end_jst TIMESTAMPTZ;
  v_month_str TEXT;
  v_revenue INT;
  v_mau INT;
  v_mpu INT;
  v_new_reg INT;
  v_new_guest INT;
  v_offset INT;
  v_max_offset INT;
BEGIN
  IF full_refresh THEN
    v_start_month := date_trunc('month', (NOW() AT TIME ZONE 'Asia/Tokyo') - INTERVAL '11 months');
    v_max_offset := 11;
  ELSE
    v_start_month := date_trunc('month', (NOW() AT TIME ZONE 'Asia/Tokyo') - INTERVAL '1 months');
    v_max_offset := 1;
  END IF;
  
  FOR v_offset IN 0..v_max_offset LOOP
    -- Convert local month boundary to UTC TIMESTAMPTZ
    v_start_jst := timezone('Asia/Tokyo', (v_start_month + (v_offset || ' month')::interval));
    v_end_jst := v_start_jst + INTERVAL '1 month';
    v_month_str := TO_CHAR(v_start_jst AT TIME ZONE 'Asia/Tokyo', 'YYYY/MM');
    
    -- Calculate revenue and mpu (paying users)
    SELECT COALESCE(SUM(amount), 0)::integer, COUNT(DISTINCT user_id)::integer
    INTO v_revenue, v_mpu
    FROM public.payment_logs
    WHERE created_at >= v_start_jst AND created_at < v_end_jst AND user_id IS NOT NULL;
    
    -- Calculate new users
    SELECT 
      COUNT(*) FILTER (WHERE is_anonymous = false)::integer,
      COUNT(*) FILTER (WHERE is_anonymous = true)::integer
    INTO v_new_reg, v_new_guest
    FROM public.user_profiles
    WHERE created_at >= v_start_jst AND created_at < v_end_jst;
    
    -- Calculate MAU (Monthly Active Users)
    SELECT COUNT(DISTINCT user_id)::integer
    INTO v_mau
    FROM (
      SELECT user_id FROM public.battle_sessions WHERE created_at >= v_start_jst AND created_at < v_end_jst AND user_id IS NOT NULL
      UNION
      SELECT user_id FROM public.quest_activity_logs WHERE created_at >= v_start_jst AND created_at < v_end_jst AND user_id IS NOT NULL AND action = 'start'
    ) combined;
    
    -- Upsert
    INSERT INTO public.monthly_kpi_cache (
      month, revenue, mau, mpu, new_users_registered, new_users_guest, updated_at
    ) VALUES (
      v_month_str, v_revenue, v_mau, v_mpu, v_new_reg, v_new_guest, NOW()
    ) ON CONFLICT (month) DO UPDATE SET
      revenue = EXCLUDED.revenue,
      mau = EXCLUDED.mau,
      mpu = EXCLUDED.mpu,
      new_users_registered = EXCLUDED.new_users_registered,
      new_users_guest = EXCLUDED.new_users_guest,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Populating the cache table
SELECT public.refresh_monthly_kpi_cache(true);

-- Drop old view if exists and recreate to read from cache table
DROP VIEW IF EXISTS public.monthly_kpi_view CASCADE;
CREATE OR REPLACE VIEW public.monthly_kpi_view AS
SELECT 
  month,
  revenue,
  mau,
  mpu,
  new_users_registered,
  new_users_guest
FROM public.monthly_kpi_cache;
