-- Create Colosseum system tables and functions

-- 1. Colosseum stats for users
CREATE TABLE IF NOT EXISTS public.colosseum_user_stats (
    user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for colosseum_user_stats
ALTER TABLE public.colosseum_user_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read colosseum_user_stats" ON public.colosseum_user_stats;
CREATE POLICY "Public read colosseum_user_stats" ON public.colosseum_user_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write colosseum_user_stats" ON public.colosseum_user_stats;
CREATE POLICY "Service write colosseum_user_stats" ON public.colosseum_user_stats FOR ALL USING (true) WITH CHECK (true);

-- 2. Colosseum ranking cache (Holds top 500 active users)
CREATE TABLE IF NOT EXISTS public.ranking_colosseum_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name TEXT,
    wins INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    rank_by_wins INTEGER,
    rank_by_streak INTEGER,
    aggregated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for ranking_colosseum_cache
ALTER TABLE public.ranking_colosseum_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read ranking_colosseum_cache" ON public.ranking_colosseum_cache;
CREATE POLICY "Public read ranking_colosseum_cache" ON public.ranking_colosseum_cache FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write ranking_colosseum_cache" ON public.ranking_colosseum_cache;
CREATE POLICY "Service write ranking_colosseum_cache" ON public.ranking_colosseum_cache FOR ALL USING (true) WITH CHECK (true);

-- Indexes for rankings
CREATE INDEX IF NOT EXISTS idx_ranking_colosseum_wins ON public.ranking_colosseum_cache(wins DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_colosseum_streak ON public.ranking_colosseum_cache(max_streak DESC);

-- 3. Colosseum enemy groups pool
CREATE TABLE IF NOT EXISTS public.colosseum_enemy_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    difficulty TEXT NOT NULL, -- 'easy', 'normal', 'hard'
    enemy_group_slug TEXT NOT NULL
);

-- RLS for colosseum_enemy_groups
ALTER TABLE public.colosseum_enemy_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read colosseum_enemy_groups" ON public.colosseum_enemy_groups;
CREATE POLICY "Public read colosseum_enemy_groups" ON public.colosseum_enemy_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write colosseum_enemy_groups" ON public.colosseum_enemy_groups;
CREATE POLICY "Service write colosseum_enemy_groups" ON public.colosseum_enemy_groups FOR ALL USING (true) WITH CHECK (true);

-- 4. Colosseum random reward pool (salvages rare/exclusive items & skills)
CREATE TABLE IF NOT EXISTS public.colosseum_reward_pool (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_type TEXT NOT NULL, -- 'item', 'skill'
    reward_id TEXT NOT NULL,   -- item_id or skill_id as string
    name TEXT
);

-- RLS for colosseum_reward_pool
ALTER TABLE public.colosseum_reward_pool ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read colosseum_reward_pool" ON public.colosseum_reward_pool;
CREATE POLICY "Public read colosseum_reward_pool" ON public.colosseum_reward_pool FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write colosseum_reward_pool" ON public.colosseum_reward_pool;
CREATE POLICY "Service write colosseum_reward_pool" ON public.colosseum_reward_pool FOR ALL USING (true) WITH CHECK (true);

-- 5. Stored function (RPC) to aggregate rankings
CREATE OR REPLACE FUNCTION public.aggregate_colosseum_ranking()
RETURNS VOID 
AS $$
DECLARE
  lock_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- キャッシュを完全にクリア
  DELETE FROM public.ranking_colosseum_cache WHERE true;

  -- 勝利数・連勝数ランキングを最大500名構築してインサート
  INSERT INTO public.ranking_colosseum_cache (
    user_id,
    user_name,
    wins,
    max_streak,
    rank_by_wins,
    rank_by_streak,
    aggregated_at
  )
  SELECT
    p.id as user_id,
    COALESCE(p.name, '名もなき旅人') as user_name,
    s.wins,
    s.max_streak,
    ROW_NUMBER() OVER (ORDER BY s.wins DESC, s.max_streak DESC, p.created_at ASC) as rank_by_wins,
    ROW_NUMBER() OVER (ORDER BY s.max_streak DESC, s.wins DESC, p.created_at ASC) as rank_by_streak,
    lock_time as aggregated_at
  FROM public.colosseum_user_stats s
  JOIN public.user_profiles p ON p.id = s.user_id
  WHERE (s.wins + s.losses) > 0
  ORDER BY GREATEST(s.wins, s.max_streak) DESC
  LIMIT 500;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Seed data
-- Seed colosseum_enemy_groups
INSERT INTO public.colosseum_enemy_groups (difficulty, enemy_group_slug) VALUES
  ('easy', 'bandit_group'),
  ('easy', 'neutral_goblin_group'),
  ('easy', 'neutral_wolf_group'),
  ('easy', 'roland_undead_group'),
  ('easy', 'roland_bandit_group'),
  ('easy', 'main_bandit_squad'),
  
  ('normal', 'markand_desert_group'),
  ('normal', 'markand_worm_group'),
  ('normal', 'yato_yokai_group'),
  ('normal', 'yato_tengu_group'),
  ('normal', 'karyu_spirit_group'),
  ('normal', 'karyu_terracotta_group'),
  ('normal', 'main_markand_spy'),
  ('normal', 'main_empire_clash'),
  ('normal', 'main_assassin_night'),
  ('normal', 'main_bounty_hunters'),
  ('normal', 'spot_yato_spider_1'),
  ('normal', 'spot_yato_spider_2'),
  
  ('hard', 'enemy_grp_boss_skel_king'),
  ('hard', 'enemy_grp_boss_worm'),
  ('hard', 'enemy_grp_boss_ogre'),
  ('hard', 'enemy_grp_boss_thunder'),
  ('hard', 'enemy_grp_boss_griffon'),
  ('hard', 'enemy_grp_boss_treant'),
  ('hard', 'bounty_low'),
  ('hard', 'bounty_mid'),
  ('hard', 'bounty_high'),
  ('hard', 'bounty_elite'),
  ('hard', 'bounty_legend'),
  ('hard', 'main_guardian_dragon'),
  ('hard', 'main_mercenary_king'),
  ('hard', 'spot_roland_alvin'),
  ('hard', 'spot_yato_shuten')
ON CONFLICT DO NOTHING;

-- Seed colosseum_reward_pool
INSERT INTO public.colosseum_reward_pool (reward_type, reward_id, name) VALUES
  ('item', '15', '傷薬'),
  ('item', '19', '解毒剤'),
  ('item', '21', '火炎瓶'),
  ('item', '22', '砥石'),
  ('item', '23', '煙玉'),
  ('item', '53', '応急処置キット'),
  ('item', '420', '高級傷薬'),
  ('item', '421', '最高級傷薬'),
  ('item', '423', '天使の涙'),
  ('item', '191', '騎士の盾'),
  ('item', '192', '白銀の槍'),
  ('item', '194', '十字軍の指輪'),
  ('item', '196', '錬金術セット'),
  ('item', '197', '商人の鞄'),
  ('item', '198', '砂漠の外套'),
  ('item', '202', '呪符セット'),
  ('item', '203', '当世具足'),
  ('item', '205', '忍具入れ'),
  ('item', '206', '神器:草薙(模造)'),
  ('item', '208', '青龍偃月刀'),
  ('item', '210', '鉄の爪'),
  ('item', '214', '冒険者の靴'),
  ('item', '219', '重装鎧'),
  ('item', '222', '幸運のコイン'),
  ('item', '230', '大賢者の杖'),
  ('item', '233', '黄金のサイコロ'),
  ('item', '238', '般若の面'),
  ('item', '244', '盗賊の七つ道具'),
  ('item', '245', '旅人のリュック'),
  
  ('skill', '187', '教本:鉄の剣'),
  ('skill', '188', '教本:護身短剣'),
  ('skill', '189', '教本:樵の斧'),
  ('skill', '190', '聖書:癒やしの祈り'),
  ('skill', '193', '巻物:聖なる一撃'),
  ('skill', '195', '教本:曲刀術'),
  ('skill', '199', '教本:調毒'),
  ('skill', '201', '奥義書:居合'),
  ('skill', '204', '巻物:式神使役'),
  ('skill', '207', '教本:少林拳'),
  ('skill', '209', '巻物:気功砲'),
  ('skill', '211', '教本:暗殺術'),
  ('skill', '212', '禁術:血の契約書'),
  ('skill', '217', '教本:挑発'),
  ('skill', '218', '教本:瞑問'),
  ('skill', '221', '教本:狂戦士'),
  ('skill', '225', '奥義書:命削り'),
  ('skill', '227', '魔導書:火球'),
  ('skill', '228', '魔導書:氷槍'),
  ('skill', '229', '魔導書:雷撃'),
  ('skill', '231', '聖書:広域防壁'),
  ('skill', '239', '教本:禅'),
  ('skill', '242', '教本:鋼鉄の肌'),
  ('skill', '243', '奥義:獅子吼'),
  ('skill', '246', '教本:サバイバル'),
  ('skill', '247', '教本:応急手当'),
  ('skill', '250', '禁書:死体操作'),
  ('skill', '254', '教本:経絡秘孔')
ON CONFLICT DO NOTHING;
