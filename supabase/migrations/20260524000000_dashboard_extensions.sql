-- Migration: Dashboard Extensions v2
-- Create quest_activity_logs and payment_logs tables for detailed analytics.

-- 1. Create quest_activity_logs table
CREATE TABLE IF NOT EXISTS public.quest_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    scenario_id BIGINT NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('start', 'complete', 'abandon')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.quest_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read quest_activity_logs" ON public.quest_activity_logs FOR SELECT USING (true);

-- 2. Create payment_logs table
CREATE TABLE IF NOT EXISTS public.payment_logs (
    id TEXT PRIMARY KEY, -- Stripe Session ID
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL DEFAULT 0, -- 円
    gold_amount INTEGER NOT NULL DEFAULT 0, -- 付与ゴールド
    type TEXT NOT NULL CHECK (type IN ('subscription', 'gold_purchase')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read payment_logs" ON public.payment_logs FOR SELECT USING (true);
