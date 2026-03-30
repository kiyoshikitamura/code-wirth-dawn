-- 傭兵NPC改修: epithet(通り名)カラムの追加
-- party_members テーブル
ALTER TABLE party_members ADD COLUMN IF NOT EXISTS epithet TEXT DEFAULT '';

-- npcs テーブル
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS epithet TEXT DEFAULT '';
