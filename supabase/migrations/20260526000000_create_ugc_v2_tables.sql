-- ============================================================================
-- Migration: UGC System v2 — 完全分離テーブル群
-- Spec: spec_v12_ugc_system_v2.md
-- 
-- 旧UGCカラム (scenarios.is_ugc, enemies.is_ugc 等) は互換性のため残置。
-- 新規UGCデータはすべて ugc_* テーブルに格納される。
-- ============================================================================

-- ─── 1. ugc_scenarios ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ugc_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT,
  client_name TEXT DEFAULT '謎の依頼人',
  quest_type TEXT DEFAULT 'normal',
  scenario_type TEXT DEFAULT 'Other',
  difficulty INT DEFAULT 1,
  rec_level INT DEFAULT 1,
  days_success INT DEFAULT 1,
  days_failure INT DEFAULT 1,
  conditions JSONB DEFAULT '{}',
  rewards JSONB DEFAULT '{}',
  flow_nodes JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'published', 'rejected')),
  tested_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  rejected_reason TEXT,
  play_count INT DEFAULT 0,
  clear_count INT DEFAULT 0,
  template_version TEXT DEFAULT '1.0',
  source_format TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ugc_scenarios IS 'UGC クエストシナリオ（公式 scenarios テーブルとは完全分離）';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ugc_scenarios_creator ON ugc_scenarios(creator_id);
CREATE INDEX IF NOT EXISTS idx_ugc_scenarios_status ON ugc_scenarios(status);
CREATE INDEX IF NOT EXISTS idx_ugc_scenarios_published ON ugc_scenarios(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ugc_scenarios_search ON ugc_scenarios(status, title);

-- ─── 2. ugc_enemies ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ugc_enemies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES ugc_scenarios(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  level INT DEFAULT 1,
  hp INT DEFAULT 50,
  atk INT DEFAULT 5,
  def INT DEFAULT 5,
  skills TEXT[] DEFAULT '{}',
  action_pattern JSONB DEFAULT '[]',
  image_url TEXT,
  flavor_text TEXT,
  asset_type TEXT DEFAULT 'enemy'
    CHECK (asset_type IN ('enemy', 'npc_companion')),
  tp_total INT,
  tp_consumed INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ugc_enemies IS 'UGC カスタムエネミー（公式 enemies テーブルとは完全分離）';

CREATE INDEX IF NOT EXISTS idx_ugc_enemies_creator ON ugc_enemies(creator_id);
CREATE INDEX IF NOT EXISTS idx_ugc_enemies_scenario ON ugc_enemies(scenario_id);

-- ─── 3. ugc_items ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ugc_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES ugc_scenarios(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'consumable'
    CHECK (type IN ('consumable', 'trade_good')),
  sub_type TEXT,
  base_price INT DEFAULT 1,
  effect_data JSONB,
  description TEXT,
  use_timing TEXT,
  rarity TEXT DEFAULT 'common'
    CHECK (rarity IN ('common', 'uncommon', 'rare')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ugc_items IS 'UGC カスタムアイテム（consumable/trade_good のみ。weapon/armor/key_item は禁止）';

CREATE INDEX IF NOT EXISTS idx_ugc_items_creator ON ugc_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_ugc_items_scenario ON ugc_items(scenario_id);

-- ─── 4. ugc_cards ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ugc_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES ugc_scenarios(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Skill',
  power INT DEFAULT 5
    CHECK (power >= 1 AND power <= 25),
  ap_cost INT DEFAULT 1
    CHECK (ap_cost >= 1 AND ap_cost <= 5),
  cost_val INT DEFAULT 1,
  target_type TEXT DEFAULT 'single_enemy',
  effect_id TEXT,
  effect_duration INT DEFAULT 0,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ugc_cards IS 'UGC カスタムスキルカード（power上限25、instakill禁止はアプリ層で制御）';

CREATE INDEX IF NOT EXISTS idx_ugc_cards_creator ON ugc_cards(creator_id);
CREATE INDEX IF NOT EXISTS idx_ugc_cards_scenario ON ugc_cards(scenario_id);

-- ─── 5. ugc_npcs ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ugc_npcs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES ugc_scenarios(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  level INT DEFAULT 1,
  atk INT DEFAULT 5,
  def INT DEFAULT 5,
  durability INT DEFAULT 100,
  cover_rate INT DEFAULT 10,
  ai_role TEXT DEFAULT 'striker'
    CHECK (ai_role IN ('striker', 'guardian', 'medic')),
  ai_grade TEXT DEFAULT 'random'
    CHECK (ai_grade = 'random'),
  signature_skills TEXT[] DEFAULT '{}',
  image_url TEXT,
  flavor_text TEXT,
  np_total INT,
  np_consumed INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ugc_npcs IS 'UGC カスタムNPC（ai_grade は random 固定、smart は英霊専用）';

CREATE INDEX IF NOT EXISTS idx_ugc_npcs_creator ON ugc_npcs(creator_id);
CREATE INDEX IF NOT EXISTS idx_ugc_npcs_scenario ON ugc_npcs(scenario_id);

-- ─── 6. ugc_rate_limits ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ugc_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL
    CHECK (action IN ('publish', 'save', 'import')),
  performed_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ugc_rate_limits IS 'UGC レートリミット記録（パブリッシュ税の代替）';

CREATE INDEX IF NOT EXISTS idx_ugc_rate_user
  ON ugc_rate_limits(user_id, action, performed_at);

-- ─── 7. 既存テーブルへの追加カラム ──────────────────────────────────────────

-- 7a. user_completed_quests: UGCクエストのクリア履歴を記録
ALTER TABLE user_completed_quests
  ADD COLUMN IF NOT EXISTS ugc_scenario_id UUID REFERENCES ugc_scenarios(id) ON DELETE SET NULL;

-- 7b. inventory: UGCアイテムの参照
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS ugc_item_id UUID REFERENCES ugc_items(id) ON DELETE SET NULL;

-- 7c. quest_activity_logs: ソース種別（official/ugc）の記録
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quest_activity_logs' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE quest_activity_logs ADD COLUMN source_type TEXT DEFAULT 'official';
  END IF;
END $$;

-- ─── 8. RLS ポリシー ────────────────────────────────────────────────────────

-- 8a. ugc_scenarios
ALTER TABLE ugc_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ugc_scenarios_creator_all"
  ON ugc_scenarios FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "ugc_scenarios_published_read"
  ON ugc_scenarios FOR SELECT
  USING (status = 'published');

-- 8b. ugc_enemies
ALTER TABLE ugc_enemies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ugc_enemies_creator_all"
  ON ugc_enemies FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "ugc_enemies_published_read"
  ON ugc_enemies FOR SELECT
  USING (
    scenario_id IS NULL
    OR EXISTS (
      SELECT 1 FROM ugc_scenarios s
      WHERE s.id = ugc_enemies.scenario_id AND s.status = 'published'
    )
  );

-- 8c. ugc_items
ALTER TABLE ugc_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ugc_items_creator_all"
  ON ugc_items FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "ugc_items_published_read"
  ON ugc_items FOR SELECT
  USING (
    scenario_id IS NULL
    OR EXISTS (
      SELECT 1 FROM ugc_scenarios s
      WHERE s.id = ugc_items.scenario_id AND s.status = 'published'
    )
  );

-- 8d. ugc_cards
ALTER TABLE ugc_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ugc_cards_creator_all"
  ON ugc_cards FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "ugc_cards_published_read"
  ON ugc_cards FOR SELECT
  USING (
    scenario_id IS NULL
    OR EXISTS (
      SELECT 1 FROM ugc_scenarios s
      WHERE s.id = ugc_cards.scenario_id AND s.status = 'published'
    )
  );

-- 8e. ugc_npcs
ALTER TABLE ugc_npcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ugc_npcs_creator_all"
  ON ugc_npcs FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "ugc_npcs_published_read"
  ON ugc_npcs FOR SELECT
  USING (
    scenario_id IS NULL
    OR EXISTS (
      SELECT 1 FROM ugc_scenarios s
      WHERE s.id = ugc_npcs.scenario_id AND s.status = 'published'
    )
  );

-- 8f. ugc_rate_limits
ALTER TABLE ugc_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ugc_rate_limits_own"
  ON ugc_rate_limits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 9. updated_at トリガー ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_ugc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ugc_scenarios_updated_at
  BEFORE UPDATE ON ugc_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_ugc_updated_at();
