
-- Enable RLS and add public read policies for core game tables

-- 1. Enemy Groups
ALTER TABLE enemy_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enemy_groups" ON enemy_groups;
CREATE POLICY "Public read enemy_groups" ON enemy_groups FOR SELECT USING (true);

-- 2. Enemies
ALTER TABLE enemies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read enemies" ON enemies;
CREATE POLICY "Public read enemies" ON enemies FOR SELECT USING (true);

-- 3. Locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read locations" ON locations;
CREATE POLICY "Public read locations" ON locations FOR SELECT USING (true);

