-- Security Fix: Enable RLS on enemy_skills table
-- This table was identified as lacking Row-Level Security in a Supabase security audit.

ALTER TABLE public.enemy_skills ENABLE ROW LEVEL SECURITY;

-- Allow public read access to enemy_skills as it's master data
DROP POLICY IF EXISTS "Public read enemy_skills" ON public.enemy_skills;
CREATE POLICY "Public read enemy_skills" ON public.enemy_skills 
    FOR SELECT USING (true);

-- Note: INSERT, UPDATE, DELETE will automatically be restricted to service_role / superuser
