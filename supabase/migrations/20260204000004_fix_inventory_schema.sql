-- Fix Inventory Schema to match Items(BIGINT)
DROP TABLE IF EXISTS inventory CASCADE;

CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  item_id BIGINT REFERENCES items(id), -- Changed from UUID to BIGINT
  quantity INTEGER DEFAULT 1,
  is_equipped BOOLEAN DEFAULT false,
  is_skill BOOLEAN DEFAULT false,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inventory" ON inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON inventory FOR DELETE USING (auth.uid() = user_id);
