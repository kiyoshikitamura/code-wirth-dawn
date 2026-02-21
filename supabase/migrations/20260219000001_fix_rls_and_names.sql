
-- Migration: Fix Inventory RLS and Nation Names
-- 1. Add missing INSERT policy to inventory
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inventory' 
        AND policyname = 'Users can insert own inventory'
    ) THEN
        CREATE POLICY "Users can insert own inventory" ON inventory FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
    END IF;
END $$;

-- 2. Update Nations to match spec_v1 exactly
UPDATE nations SET name = 'ローラン聖帝国' WHERE id = 'Roland';
UPDATE nations SET name = '砂塵の王国マルカンド' WHERE id = 'Markand';
UPDATE nations SET name = '夜刀神国' WHERE id = 'Yato';
UPDATE nations SET name = '華龍神朝' WHERE id = 'Karyu';
UPDATE nations SET name = '中立自由都市' WHERE id = 'Neutral';

-- Also ensure RLS for user_profiles allows update if it doesn't already
-- (Gold deduction requires update)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;
