-- spec_v16: 経済・名声システムの拡張および移動エンカウント仕様
-- Migration: 20260311053335_spec_v16_economy_reputation.sql

-- §2: 首都入場制限 — user_profiles に許可証有効期限カラムを追加
-- pass_expires_at: { "regalia": 730, "ish-haq": 400, ... }
--   キー = 首都の locations.slug
--   値   = 有効期限の accumulated_days 数値
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pass_expires_at JSONB DEFAULT '{}'::jsonb;

-- §4: 祈りの強化 — 個人バフ（Blessing）データを保存するカラムを追加
-- blessing_data: { "hp_pct": 0.10, "ap_bonus": 1, "expires_after_battle": true }
-- nullの場合はバフなし
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS blessing_data JSONB DEFAULT NULL;

-- §5: クエスト受領条件の拡張 — max_reputation カラム追加
-- null = 制限なし / 設定値以下の名声を持つプレイヤーのみ受注可能（悪人向けクエスト）
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS max_reputation INT DEFAULT NULL;

-- §1: 移動エンカウント用エネミーマスタテーブル
-- 各拠点に紐づくエンカウント敵グループを管理する
CREATE TABLE IF NOT EXISTS location_encounters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
    enemy_group_slug TEXT NOT NULL,     -- enemy_groups.csv の slug に対応
    min_player_level INT DEFAULT 1,     -- 出現プレイヤーレベル下限
    max_player_level INT DEFAULT 99,    -- 出現プレイヤーレベル上限
    weight INT DEFAULT 1,              -- 重み付き抽選（同location内で相対比較）
    encounter_type TEXT DEFAULT 'random' -- 'random' | 'bounty_hunter'
);

-- RLS: location_encounters は読み取り公開、変更はサービスロールのみ
ALTER TABLE location_encounters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "location_encounters_public_read" ON location_encounters
    FOR SELECT USING (true);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_location_encounters_location_id ON location_encounters(location_id);
CREATE INDEX IF NOT EXISTS idx_location_encounters_type ON location_encounters(encounter_type);

-- §1: 初期エンカウントシードデータ
-- 全拠点に汎用エネミー（goblin_squad）を登録する
-- 首都を除く全拠点に適用
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT
    id,
    'goblin_squad',
    1,
    99,
    1,
    'random'
FROM locations
WHERE slug NOT IN ('regalia', 'ish-haq', 'izumo', 'longqing')
ON CONFLICT DO NOTHING;

-- 首都には賞金稼ぎ用のエネミーを登録（将来拡張用）
INSERT INTO location_encounters (location_id, enemy_group_slug, min_player_level, max_player_level, weight, encounter_type)
SELECT
    id,
    'goblin_squad',
    1,
    99,
    1,
    'bounty_hunter'
FROM locations
ON CONFLICT DO NOTHING;
