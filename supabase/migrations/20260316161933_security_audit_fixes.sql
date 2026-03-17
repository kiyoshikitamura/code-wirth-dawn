-- Migration for Security Audit Fixes
-- 1. Stripe Webhook Idempotency Table
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No public access policies; only service_role (server) should access this table.

-- 2. Server-Authoritative Battle Sessions Table
CREATE TABLE IF NOT EXISTS public.battle_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enemy_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    player_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('active', 'victory', 'defeat', 'fled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.battle_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own battle sessions
CREATE POLICY "Users can view their own battle sessions" ON public.battle_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Restrict INSERT/UPDATE/DELETE to service_role (server API) only
