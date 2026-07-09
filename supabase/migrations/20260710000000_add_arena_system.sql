-- Migration: Add Arena PvP (Colosseum アリーナ) system tables and columns
-- Created At: 2026-07-09

-- 既存の古い対人戦関連テーブルを一旦削除 (スキーマ不一致回避・プレビュー用)
DROP TABLE IF EXISTS public.pvp_defense_parties CASCADE;
DROP TABLE IF EXISTS public.pvp_battle_logs CASCADE;
DROP TABLE IF EXISTS public.pvp_ranking_cache CASCADE;
DROP TABLE IF EXISTS public.pvp_claimed_rewards CASCADE;

-- 1. user_profiles の拡張
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS colosseum_cp INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS cp_last_recovered_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS arena_rate INTEGER DEFAULT 1000;

-- 2. pvp_defense_parties (防衛デッキスナップショット用)
CREATE TABLE public.pvp_defense_parties (
    user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    defender_rank VARCHAR(2) NOT NULL DEFAULT 'C', -- S, A, B, C のいずれか
    snapshot_data JSONB NOT NULL,      -- パーティ、装備、スキルのスナップショット
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成 (同ランク抽出の高速化)
CREATE INDEX IF NOT EXISTS idx_pvp_defense_parties_rank ON public.pvp_defense_parties(defender_rank);

-- 3. pvp_battle_logs (対戦履歴・テキストログ用)
CREATE TABLE public.pvp_battle_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    attacker_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    defender_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    is_attacker_victory BOOLEAN NOT NULL,
    attacker_rate_change INTEGER NOT NULL,
    defender_rate_change INTEGER NOT NULL,
    battle_type TEXT NOT NULL CHECK (battle_type IN ('challenge', 'defense')),
    text_log TEXT, -- アクション詳細テキスト
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成 (過去履歴の高速取得用)
CREATE INDEX IF NOT EXISTS idx_pvp_battle_logs_attacker ON public.pvp_battle_logs(attacker_user_id);
CREATE INDEX IF NOT EXISTS idx_pvp_battle_logs_defender ON public.pvp_battle_logs(defender_user_id);

-- 4. pvp_ranking_cache (アリーナランキングキャッシュ用)
CREATE TABLE public.pvp_ranking_cache (
    ranking_type TEXT PRIMARY KEY CHECK (ranking_type IN ('season', 'daily')),
    list_data JSONB NOT NULL,          -- 50位までのランキング結果JSON
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. pvp_claimed_rewards (オンデマンド報酬受け取りログ)
CREATE TABLE public.pvp_claimed_rewards (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('season', 'daily')),
    season_id TEXT NOT NULL,           -- 週ごとの水曜日付など (例: '2026-W28' や '2026-07-09')
    claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 同一シーズン/デイリーで1ユーザーが二重に受け取るのを防止するユニーク制約
CREATE UNIQUE INDEX IF NOT EXISTS idx_pvp_claimed_rewards_uid_type_season ON public.pvp_claimed_rewards(user_id, reward_type, season_id);

-- 6. バトルログの過去20件自動ローテーション用トリガー定義
CREATE OR REPLACE FUNCTION public.rotate_pvp_battle_logs()
RETURNS TRIGGER AS $$
BEGIN
    -- 攻撃側 (attacker) の古いログを削除
    DELETE FROM public.pvp_battle_logs
    WHERE attacker_user_id = NEW.attacker_user_id
      AND id NOT IN (
          SELECT id 
          FROM public.pvp_battle_logs 
          WHERE attacker_user_id = NEW.attacker_user_id 
          ORDER BY created_at DESC 
          LIMIT 20
      );
      
    -- 防衛側 (defender) の古いログを削除
    DELETE FROM public.pvp_battle_logs
    WHERE defender_user_id = NEW.defender_user_id
      AND id NOT IN (
          SELECT id 
          FROM public.pvp_battle_logs 
          WHERE defender_user_id = NEW.defender_user_id 
          ORDER BY created_at DESC 
          LIMIT 20
      );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_rotate_pvp_battle_logs
AFTER INSERT ON public.pvp_battle_logs
FOR EACH ROW
EXECUTE FUNCTION public.rotate_pvp_battle_logs();

-- 7. セキュリティ設定 (RLS) と権限許可
ALTER TABLE public.pvp_defense_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_battle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_ranking_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_claimed_rewards ENABLE ROW LEVEL SECURITY;

-- APIおよびサービスロールからのアクセスを許可
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- スキーマキャッシュをリロード
NOTIFY pgrst, 'reload schema';
