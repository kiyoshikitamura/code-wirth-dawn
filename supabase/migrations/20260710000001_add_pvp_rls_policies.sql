-- 1. pvp_defense_parties policies
DROP POLICY IF EXISTS "Public read pvp_defense_parties" ON public.pvp_defense_parties;
CREATE POLICY "Public read pvp_defense_parties" ON public.pvp_defense_parties 
    FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS "Users can insert own pvp_defense_party" ON public.pvp_defense_parties;
CREATE POLICY "Users can insert own pvp_defense_party" ON public.pvp_defense_parties 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pvp_defense_party" ON public.pvp_defense_parties;
CREATE POLICY "Users can update own pvp_defense_party" ON public.pvp_defense_parties 
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own pvp_defense_party" ON public.pvp_defense_parties;
CREATE POLICY "Users can delete own pvp_defense_party" ON public.pvp_defense_parties 
    FOR DELETE USING (auth.uid() = user_id);

-- 2. pvp_battle_logs policies
DROP POLICY IF EXISTS "Public read pvp_battle_logs" ON public.pvp_battle_logs;
CREATE POLICY "Public read pvp_battle_logs" ON public.pvp_battle_logs 
    FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS "Users can insert own pvp_battle_logs" ON public.pvp_battle_logs;
CREATE POLICY "Users can insert own pvp_battle_logs" ON public.pvp_battle_logs 
    FOR INSERT WITH CHECK (auth.uid() = attacker_user_id OR auth.uid() = defender_user_id);

DROP POLICY IF EXISTS "Users can update own pvp_battle_logs" ON public.pvp_battle_logs;
CREATE POLICY "Users can update own pvp_battle_logs" ON public.pvp_battle_logs 
    FOR UPDATE USING (auth.uid() = attacker_user_id OR auth.uid() = defender_user_id);

-- 3. pvp_claimed_rewards policies
DROP POLICY IF EXISTS "Users can manage own pvp_claimed_rewards" ON public.pvp_claimed_rewards;
CREATE POLICY "Users can manage own pvp_claimed_rewards" ON public.pvp_claimed_rewards 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PostgREST キャッシュリロード
NOTIFY pgrst, 'reload schema';
