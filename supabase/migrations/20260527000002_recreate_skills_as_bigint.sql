-- Migration: Drop and recreate skills and user_skills tables to match BIGINT requirement
-- Currently these tables exist on the database with UUID types, causing type errors during seeding and usage

-- 1. Drop existing tables if they exist (safe because they are empty master data/state)
DROP TABLE IF EXISTS public.user_skills CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;

-- 2. Recreate skills table with BIGINT id
CREATE TABLE public.skills (
    id BIGINT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    card_id BIGINT REFERENCES public.cards(id),
    base_price INTEGER NOT NULL DEFAULT 0,
    deck_cost INTEGER NOT NULL DEFAULT 2,
    nation_tags TEXT[] DEFAULT '{}',
    min_prosperity INTEGER DEFAULT 1,
    is_black_market BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Recreate user_skills table with BIGINT skill_id
CREATE TABLE public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    is_equipped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON public.user_skills(skill_id);

-- 5. Enable RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
-- skills is public read-only master data
DROP POLICY IF EXISTS "Public read skills" ON public.skills;
CREATE POLICY "Public read skills" ON public.skills FOR SELECT USING (true);

-- user_skills is row-level owner access
DROP POLICY IF EXISTS "Users can read own skills" ON public.user_skills;
CREATE POLICY "Users can read own skills" ON public.user_skills FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own skills" ON public.user_skills;
CREATE POLICY "Users can insert own skills" ON public.user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own skills" ON public.user_skills;
CREATE POLICY "Users can update own skills" ON public.user_skills FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own skills" ON public.user_skills;
CREATE POLICY "Users can delete own skills" ON public.user_skills FOR DELETE USING (auth.uid() = user_id);

-- 7. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
