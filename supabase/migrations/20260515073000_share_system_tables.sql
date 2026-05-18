-- 号外システム テーブル (spec_v21_share_system)
-- 2026-05-15

-- 訪問済み拠点の記録（#11 全拠点制覇トリガー用）
CREATE TABLE IF NOT EXISTS user_visited_locations (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id UUID NOT NULL,
    first_visited_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, location_id)
);
ALTER TABLE user_visited_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own visits" ON user_visited_locations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own visits" ON user_visited_locations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 号外発火済みフラグ（重複防止用）
-- trigger_slug: トリガー種別 (e.g. 'level_milestone', 'fame_hero')
-- trigger_key: 副キー (e.g. '10' for Lv10, '港町' for location-specific)
-- 回数性:
--   1回:      永続（DELETEしない）
--   キャラ1回: 永続（DELETEしない）
--   世代1回:  世代交代時にDELETE
--   繰返:    INSERTしない（重複チェック不要）
CREATE TABLE IF NOT EXISTS user_share_triggers (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger_slug TEXT NOT NULL,
    trigger_key TEXT NOT NULL DEFAULT '',
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, trigger_slug, trigger_key)
);
ALTER TABLE user_share_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own triggers" ON user_share_triggers
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own triggers" ON user_share_triggers
    FOR INSERT WITH CHECK (auth.uid() = user_id);
