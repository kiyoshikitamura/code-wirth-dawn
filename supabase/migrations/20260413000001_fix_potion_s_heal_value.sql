-- ============================================================
-- 傷薬 S の effect_data に heal 値（50）を追加
-- item_potion_s は use_timing のみセットで heal が未設定だった
-- ============================================================

UPDATE items
SET effect_data = jsonb_set(
    COALESCE(effect_data, '{}'::jsonb),
    '{heal}', '50'
)
WHERE slug IN ('item_potion_s', 'potion_health_s');

-- 確認
SELECT slug, name, effect_data
FROM items
WHERE slug IN ('item_potion_s', 'potion_health_s');
