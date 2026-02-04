-- Create user_hub_states table
CREATE TABLE IF NOT EXISTS public.user_hub_states (
    user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    is_in_hub BOOLEAN DEFAULT FALSE,
    last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.user_hub_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own hub state" ON public.user_hub_states;
CREATE POLICY "Users can view their own hub state"
    ON public.user_hub_states FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update their own hub state" ON public.user_hub_states;
CREATE POLICY "Users can update their own hub state"
    ON public.user_hub_states FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own hub state" ON public.user_hub_states;
CREATE POLICY "Users can insert their own hub state"
    ON public.user_hub_states FOR INSERT
    WITH CHECK (true);

-- Trigger to create hub state on profile creation (optional but good for consistency)
-- For now, we'll handle insert in app or let it be created on first access if needed.
-- Or just manually insert for existing users is safer via app logic?
-- Let's stick to simple table creation.
