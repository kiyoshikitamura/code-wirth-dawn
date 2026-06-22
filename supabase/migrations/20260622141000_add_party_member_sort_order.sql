-- party_members テーブルに sort_order カラムを追加
ALTER TABLE party_members ADD COLUMN sort_order INTEGER DEFAULT 0;

-- 既存の同行NPCデータに対して、ユーザー(owner_id)ごとに作成日時順で初期順序(0, 1, 2...)を割り当て
WITH ordered_members AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at ASC) - 1 as row_num
  FROM party_members
)
UPDATE party_members pm
SET sort_order = om.row_num
FROM ordered_members om
WHERE pm.id = om.id;
