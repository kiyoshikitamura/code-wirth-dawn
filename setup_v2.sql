-- 1. Reset
DROP TABLE IF EXISTS world_history;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS action_logs;
DROP TABLE IF EXISTS scenarios;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS reputations;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS world_states;
DROP TABLE IF EXISTS locations;

-- 2. Locations
CREATE TABLE locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  type TEXT DEFAULT 'Town',
  nation_id TEXT DEFAULT 'Neutral',
  connections jsonb DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. World States
CREATE TABLE world_states (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_name TEXT NOT NULL REFERENCES locations(name) UNIQUE,
  status TEXT DEFAULT 'Prosperous', -- Zenith, Prosperous, Stagnant, Declining, Ruined
  attribute_name TEXT DEFAULT '至高の平穏',
  controlling_nation TEXT DEFAULT 'Neutral',
  flavor_text TEXT DEFAULT '静かな日常。',
  background_url TEXT DEFAULT '/backgrounds/default.jpg',
  order_score INTEGER DEFAULT 10,
  chaos_score INTEGER DEFAULT 10,
  justice_score INTEGER DEFAULT 10,
  evil_score INTEGER DEFAULT 10,
  total_days_passed INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Profiles
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY,
  title_name TEXT DEFAULT '名もなき旅人',
  avatar_url TEXT DEFAULT '/avatars/adventurer.jpg',
  order_pts INTEGER DEFAULT 0,
  chaos_pts INTEGER DEFAULT 0,
  justice_pts INTEGER DEFAULT 0,
  evil_pts INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 1000,
  current_location_id uuid,
  previous_location_id uuid,
  age INTEGER DEFAULT 20,
  accumulated_days INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Added Parameters
  vitality INTEGER DEFAULT 100,
  praise_count INTEGER DEFAULT 0,
  prayer_count INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  max_hp INTEGER DEFAULT 100,
  hp INTEGER DEFAULT 100,
  max_mp INTEGER DEFAULT 20,
  mp INTEGER DEFAULT 20,
  attack INTEGER DEFAULT 10,
  defense INTEGER DEFAULT 5,
  
  CONSTRAINT fk_current_location FOREIGN KEY (current_location_id) REFERENCES locations(id),
  CONSTRAINT fk_prev_location FOREIGN KEY (previous_location_id) REFERENCES locations(id)
);

-- 5. Reputations
CREATE TABLE reputations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id),
  location_name TEXT NOT NULL REFERENCES locations(name),
  score INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'Stranger',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, location_name)
);

-- 6. World History
CREATE TABLE world_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_name TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  headline TEXT,
  news_content TEXT,
  occured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Items
CREATE TABLE items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  item_type TEXT,
  required_attribute TEXT DEFAULT 'ANY',
  power_value INTEGER DEFAULT 0,
  stock_limit INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Inventory
CREATE TABLE inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id),
  item_id uuid REFERENCES items(id),
  quantity INTEGER DEFAULT 1,
  is_equipped BOOLEAN DEFAULT false,
  is_skill BOOLEAN DEFAULT false,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Scenarios
CREATE TABLE scenarios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  
  -- V3 Quest System Fields
  type TEXT DEFAULT 'Subjugation',
  time_cost INTEGER DEFAULT 1,
  ruling_nation_id TEXT,
  location_id UUID REFERENCES locations(id),
  
  -- JSONB Logic
  conditions JSONB DEFAULT '{}'::jsonb,
  rewards JSONB DEFAULT '{}'::jsonb,
  flow_nodes JSONB DEFAULT '[]'::jsonb,
  
  -- Legacy / Flat columns (kept for compatibility or basic display)
  required_status TEXT,
  required_attribute TEXT,
  reward_gold INTEGER DEFAULT 100,
  
  order_impact INTEGER DEFAULT 0,
  chaos_impact INTEGER DEFAULT 0,
  justice_impact INTEGER DEFAULT 0,
  evil_impact INTEGER DEFAULT 0,
  rep_impact INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scenarios_location_id ON scenarios(location_id);
CREATE INDEX idx_scenarios_ruling_nation_id ON scenarios(ruling_nation_id);

-- 10. Initial Data

-- HIDDEN HUB
-- Connected to ALL CAPITALS for initial jump logic (though logic handles this dynamically mostly)
INSERT INTO locations (name, description, x, y, type, nation_id, connections) VALUES
('名もなき旅人の拠所', '次元の狭間にある安息の地。', 500, 500, 'Town', 'Neutral', '["王都アーカディア", "交易都市メリディア", "帝都カロン", "神都ヤト"]'::jsonb);

-- CLUSTERED LAYOUT

-- 1. ROLAND (North-West) [Center approx 250, 250]
INSERT INTO locations (name, description, x, y, type, nation_id, connections) VALUES
('王都アーカディア', 'ローランドの首都。', 250, 250, 'Capital', 'Roland', '["騎士団駐屯地", "聖教会都市", "巡礼の宿場町", "白亜の砦"]'::jsonb),
('騎士団駐屯地', '王都を守る盾。', 150, 250, 'Town', 'Roland', '["王都アーカディア", "白亜の砦"]'::jsonb),
('聖教会都市', '信仰の中心地。', 350, 200, 'City', 'Roland', '["王都アーカディア", "巡礼の宿場町"]'::jsonb),
('巡礼の宿場町', '国境へ続く道。', 400, 300, 'Village', 'Roland', '["王都アーカディア", "聖教会都市", "自由の関所"]'::jsonb), -- Connects to Markand (自由の関所)
('白亜の砦', '南を守る要塞。', 250, 350, 'Dungeon', 'Roland', '["王都アーカディア", "騎士団駐屯地", "鉄の鉱山村"]'::jsonb); -- Connects to Karyu (鉄の鉱山村)

-- 2. MARKAND (North-East) [Center approx 750, 250]
INSERT INTO locations (name, description, x, y, type, nation_id, connections) VALUES
('交易都市メリディア', '砂漠の巨大都市。', 750, 250, 'Capital', 'Markand', '["自由の関所", "カジノタウン", "スラム街", "オアシスの村"]'::jsonb),
('自由の関所', 'ローランドとの国境。', 600, 300, 'Town', 'Markand', '["交易都市メリディア", "巡礼の宿場町"]'::jsonb), -- Connects to Roland
('カジノタウン', '欲望の街。', 850, 200, 'City', 'Markand', '["交易都市メリディア", "オアシスの村"]'::jsonb),
('スラム街', '都市の暗部。', 750, 350, 'Dungeon', 'Markand', '["交易都市メリディア"]'::jsonb),
('オアシスの村', '南への休息地。', 800, 400, 'Village', 'Markand', '["交易都市メリディア", "カジノタウン", "霧の渡し守"]'::jsonb); -- Connects to Yato (霧の渡し守) - Wait, Yato is SE, so South connection is good.

-- 3. KARYU (South-West) [Center approx 250, 750]
INSERT INTO locations (name, description, x, y, type, nation_id, connections) VALUES
('帝都カロン', '鉄と炎の都。', 250, 750, 'Capital', 'Karyu', '["鉄の鉱山村", "処刑場の街", "カロン国境砦", "地下監獄"]'::jsonb),
('鉄の鉱山村', '北からの入口。', 250, 600, 'Village', 'Karyu', '["帝都カロン", "白亜の砦"]'::jsonb), -- Connects to Roland
('処刑場の街', '恐怖による統治。', 150, 800, 'City', 'Karyu', '["帝都カロン", "地下監獄"]'::jsonb),
('地下監獄', '脱出不能。', 250, 850, 'Dungeon', 'Karyu', '["帝都カロン", "処刑場の街"]'::jsonb),
('カロン国境砦', '東への監視塔。', 400, 750, 'Town', 'Karyu', '["帝都カロン", "黄泉の門前町"]'::jsonb); -- Connects to Yato (黄泉の門前町)

-- 4. YATO (South-East) [Center approx 750, 750]
INSERT INTO locations (name, description, x, y, type, nation_id, connections) VALUES
('神都ヤト', '常闇の都。', 750, 750, 'Capital', 'Yato', '["霧の渡し守", "黄泉の門前町", "呪われた廃村", "彼岸花の里"]'::jsonb),
('霧の渡し守', '北からの水路。', 800, 600, 'Village', 'Yato', '["神都ヤト", "オアシスの村"]'::jsonb), -- Connects to Markand
('黄泉の門前町', '西への霊道。', 600, 750, 'City', 'Yato', '["神都ヤト", "カロン国境砦"]'::jsonb), -- Connects to Karyu
('呪われた廃村', '怨霊の巣窟。', 700, 850, 'Dungeon', 'Yato', '["神都ヤト"]'::jsonb),
('彼岸花の里', '最果ての地。', 850, 800, 'Village', 'Yato', '["神都ヤト"]'::jsonb);

-- B. World States Init
INSERT INTO world_states (location_name, controlling_nation, status, order_score, chaos_score, justice_score, evil_score)
SELECT name, nation_id, 'Prosperous', 
  CASE WHEN nation_id = 'Roland' THEN 80 ELSE 20 END,
  CASE WHEN nation_id = 'Markand' THEN 80 ELSE 20 END,
  CASE WHEN nation_id = 'Roland' OR nation_id = 'Markand' THEN 80 ELSE 20 END,
  CASE WHEN nation_id = 'Karyu' OR nation_id = 'Yato' THEN 80 ELSE 20 END
FROM locations;

-- C. Items
INSERT INTO items (name, description, price, item_type, stock_limit) VALUES 
('傷薬', 'HP回復', 50, 'consumable', 10),
('旅人の剣', '基本装備', 500, 'equipment', 1);

-- D. Scenarios
INSERT INTO scenarios (title, description, client_name, reward_gold, rep_impact, order_impact) VALUES
('スライム退治', '村の平和を守れ', '村長', 100, 10, 5),
('密輸の護衛', '危険な仕事', '闇商人', 300, -20, -10);
