-- Migration: royalty_daily_log
-- ロイヤリティの日額上限を管理するテーブル
-- spec_v7_lifecycle_economy.md §5.1

CREATE TABLE IF NOT EXISTS royalty_daily_log (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    total_gold  INT  NOT NULL DEFAULT 0,
    UNIQUE(user_id, log_date)
);

-- RLS: ユーザー本人の参照のみ許可（書き込みはサービスロール経由）
ALTER TABLE royalty_daily_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_royalty_log" ON royalty_daily_log
    FOR SELECT USING (auth.uid() = user_id);

-- party_members に hired_at カラムを追加（清掃バッチ用）
ALTER TABLE party_members
    ADD COLUMN IF NOT EXISTS hired_at TIMESTAMPTZ DEFAULT NOW();
