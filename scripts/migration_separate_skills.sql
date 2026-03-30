-- ============================================================
-- Wirth-Dawn: アイテム/スキル分離 マイグレーション
-- 実行順序: Step 1 → Step 2 → Step 3 → Step 4 → Step 5
-- ============================================================

-- ============================================================
-- Step 1: 新テーブル作成
-- ============================================================

-- skills マスタ: スキルカード専用テーブル
CREATE TABLE IF NOT EXISTS skills (
    id BIGINT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    card_id BIGINT REFERENCES cards(id),
    base_price INTEGER NOT NULL DEFAULT 0,
    deck_cost INTEGER NOT NULL DEFAULT 2,
    nation_tags TEXT[] DEFAULT '{}',
    min_prosperity INTEGER DEFAULT 1,
    is_black_market BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_skills: ユーザーのスキル所持/装備状態
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id),
    is_equipped BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

-- equipped_items: 装備品スロット管理
CREATE TABLE IF NOT EXISTS equipped_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    slot TEXT NOT NULL CHECK (slot IN ('weapon', 'armor', 'accessory')),
    equipped_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, slot)
);

-- items テーブルに sub_type カラム追加 (装備品用)
ALTER TABLE items ADD COLUMN IF NOT EXISTS sub_type TEXT;

-- ============================================================
-- Step 2: items → skills データ移行
-- items テーブルの type='skill_card' 行を skills に INSERT
-- ============================================================
INSERT INTO skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market)
SELECT
    i.id,
    i.slug,
    i.name,
    i.linked_card_id,
    i.base_price,
    COALESCE(i.cost, 2),
    CASE
        WHEN i.nation_tags IS NULL THEN '{}'::TEXT[]
        ELSE i.nation_tags
    END,
    COALESCE(i.min_prosperity, 1),
    COALESCE(i.is_black_market, FALSE)
FROM items i
WHERE i.type = 'skill_card'
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 3: inventory → user_skills データ移行
-- inventory の is_skill=true 行を user_skills に移行
-- ============================================================
INSERT INTO user_skills (user_id, skill_id, is_equipped, acquired_at)
SELECT
    inv.user_id,
    inv.item_id,
    inv.is_equipped,
    COALESCE(inv.acquired_at, NOW())
FROM inventory inv
WHERE inv.is_skill = TRUE
  AND inv.user_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM skills s WHERE s.id = inv.item_id)
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- ============================================================
-- Step 4: items テーブルの type 正規化
-- 非正規 type を正規化し、装備品設定を行う
-- ============================================================

-- item(atk:N), item(def:N), item(hp:N) → equipment
UPDATE items SET type = 'equipment', sub_type = 'weapon'
WHERE type LIKE 'item(atk:%';

UPDATE items SET type = 'equipment', sub_type = 'armor'
WHERE type LIKE 'item(def:%';

UPDATE items SET type = 'equipment', sub_type = 'accessory'
WHERE type LIKE 'item(hp:%';

-- consumable(vit:N) → consumable
UPDATE items SET type = 'consumable'
WHERE type LIKE 'consumable(%';

-- ============================================================
-- Step 5: 旧データのクリーンアップ
-- ※ 注意: 外部キー制約のため、inventory のスキル行を先に削除
-- ============================================================

-- inventory から移行済みスキル行を削除
DELETE FROM inventory
WHERE is_skill = TRUE
  AND user_id IS NOT NULL
  AND item_id IN (SELECT id FROM skills);

-- items テーブルからスキル行を削除 (skills に移行済み)
-- ※ FK制約がある場合は先に inventory.item_id の orphan を処理すること
-- DELETE FROM items WHERE type = 'skill_card';
-- ↑ 安全のためコメントアウト。移行確認後に手動実行を推奨。

-- ============================================================
-- インデックス作成
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_equipped_items_user_id ON equipped_items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
