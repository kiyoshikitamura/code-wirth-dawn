-- ============================================================
-- v25: items.effect_data に use_timing フィールドを追加
-- 各消耗品を battle / field / passive に分類する
-- ============================================================

-- ■ バトル中使用 (battle)
-- 傷薬 S
UPDATE items
SET effect_data = jsonb_set(
    COALESCE(effect_data, '{}'::jsonb),
    '{use_timing}', '"battle"'
)
WHERE slug IN (
    'item_potion_s',
    'potion_health_s'
);

-- 傷薬 M
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"battle"'),
    '{heal}', '150'
)
WHERE slug IN ('item_potion', 'potion_health_m');

-- 上級傷薬
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"battle"'),
    '{heal}', '350'
)
WHERE slug = 'item_high_potion';

-- ローランの祝福 (HP 50% 回復)
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"battle"'),
    '{heal_pct}', '0.5'
)
WHERE slug = 'item_roland_blessing';

-- ローランの霊薬 (HP 全回復)
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"battle"'),
    '{heal_full}', 'true'
)
WHERE slug = 'item_roland_elixir';

-- 解毒剤 (ポイズン解除)
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"battle"'),
    '{remove_effect}', '"poison"'
)
WHERE slug = 'item_antidote';

-- 夜刀の毒薬 (敵にポイズン付与)
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(
        jsonb_set(
            jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"battle"'),
            '{effect_id}', '"poison"'
        ),
        '{target}', '"enemy"'
    ),
    '{effect_duration}', '3'
)
WHERE slug = 'item_yato_poison';

-- 夜刀の煙玉 (即時逃走)
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"battle"'),
    '{escape}', 'true'
)
WHERE slug = 'item_yato_smoke';

-- カリュウ茶 (HP回復: battle)
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"battle"'),
    '{heal}', '200'
)
WHERE slug = 'item_karyu_tea';

-- 聖都の霊水 (HP回復 + リジェネ: battle)
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(
        jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"battle"'),
        '{heal}', '200'
    ),
    '{effect_id}', '"regen"'
)
WHERE slug = 'item_oasis_water';

-- 禁術の秘薬 (バトル中は HP全回復 として扱う)
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"battle"'),
    '{heal_full}', 'true'
)
WHERE slug = 'item_black_market_elixir';

-- 砂漠の香辛料 (ATK強化系 → バトル中バフ: effect_id=atk_up)
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(
        jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"battle"'),
        '{effect_id}', '"atk_up"'
    ),
    '{effect_duration}', '2'
)
WHERE slug = 'item_desert_spice';

-- 魔符 (敵に状態異常: effect_id=stun)
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(
        jsonb_set(
            jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"battle"'),
            '{effect_id}', '"stun"'
        ),
        '{target}', '"enemy"'
    ),
    '{effect_duration}', '1'
)
WHERE slug = 'item_karyu_charm';

-- ■ フィールド使用 (field)
-- テント (Vit +1 回復)
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"field"'),
    '{vit_restore}', '1'
)
WHERE slug = 'item_tent';

-- 竜血 (Vit +3 回復)
UPDATE items
SET effect_data = jsonb_set(
    jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"field"'),
    '{vit_restore}', '3'
)
WHERE slug = 'item_dragon_blood';

-- ■ パッシブ (passive)
-- 通行許可証カテゴリ
UPDATE items
SET effect_data = jsonb_set(COALESCE(effect_data, '{}'::jsonb), '{use_timing}', '"passive"')
WHERE slug = 'capital_pass'
   OR (effect_data->>'is_pass')::boolean = true;

-- ============================================================
-- 確認クエリ
-- ============================================================
SELECT slug, name, type, effect_data->>'use_timing' AS use_timing
FROM items
WHERE type = 'consumable'
ORDER BY effect_data->>'use_timing', slug;
