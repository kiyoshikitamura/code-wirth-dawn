-- ============================================================
-- v2.9.2: 簡易テントの再設計
-- vit_restore → heal_pct (フィールドHP50%回復)
-- 
-- 設計意図:
--   - Vitalityの減少はほぼ不可逆（例外: 竜血のみ）
--   - テントは名声が低く宿屋を利用できないプレイヤーの
--     フィールド唯一のHP回復手段として再設計
-- ============================================================

-- 簡易テント: vit_restore → heal_pct (HP 50%回復)
UPDATE items
SET effect_data = '{
    "use_timing": "field",
    "heal_pct": 0.5,
    "description": "野営しながらHPを回復する簡易テント。宿屋が利用できない時の代替手段。"
}'::jsonb
WHERE slug = 'item_tent';

-- 確認
SELECT slug, name, effect_data FROM items WHERE slug IN ('item_tent', 'item_dragon_blood');
