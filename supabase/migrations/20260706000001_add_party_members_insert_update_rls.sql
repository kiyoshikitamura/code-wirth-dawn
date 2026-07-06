-- Migration: Add INSERT and UPDATE policies for party_members

-- 1. Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert own party members" ON public.party_members;
DROP POLICY IF EXISTS "Users can update own party members" ON public.party_members;

-- 2. Create INSERT policy
CREATE POLICY "Users can insert own party members" ON public.party_members
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

-- 3. Create UPDATE policy
CREATE POLICY "Users can update own party members" ON public.party_members
    FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
