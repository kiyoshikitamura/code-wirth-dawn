-- Migration: Update user_level_distribution_view to subdivide Level 1 and Level 2-5
-- Drop existing view to avoid column name change conflict
DROP VIEW IF EXISTS public.user_level_distribution_view;

CREATE VIEW public.user_level_distribution_view AS
SELECT
  COUNT(*) FILTER (WHERE level = 1)::integer as range_1,
  COUNT(*) FILTER (WHERE level >= 2 AND level <= 5)::integer as range_2_5,
  COUNT(*) FILTER (WHERE level >= 6 AND level <= 10)::integer as range_6_10,
  COUNT(*) FILTER (WHERE level >= 11 AND level <= 15)::integer as range_11_15,
  COUNT(*) FILTER (WHERE level >= 16)::integer as range_16_plus
FROM public.user_profiles;
