-- Migration: Add Pack Opening Keys to items table
-- ID 76: item_basic_key
-- ID 77: item_academy_key

INSERT INTO public.items (id, slug, name, type, base_price, min_prosperity, nation_tags, effect_data, is_black_market)
VALUES 
(
    76, 
    'item_basic_key', 
    'ベーシックキー', 
    'consumable', 
    2000, 
    1, 
    '{}', 
    '{"use_timing": "field", "effect": "open_pack", "pack_series": "basic", "description": "古びた青銅の鍵。既存のスキルカードが手に入るベーシックパックを1個開封できる。"}'::jsonb, 
    false
),
(
    77, 
    'item_academy_key', 
    '魔術学院キー', 
    'consumable', 
    3000, 
    1, 
    '{}', 
    '{"use_timing": "field", "effect": "open_pack", "pack_series": "chaos_and_rebellion", "description": "まばゆく輝く魔法 of 鍵。魔術学院のブースターパックを1個開封できる。"}'::jsonb, 
    false
)
ON CONFLICT (id) DO UPDATE SET 
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    base_price = EXCLUDED.base_price,
    min_prosperity = EXCLUDED.min_prosperity,
    nation_tags = EXCLUDED.nation_tags,
    effect_data = EXCLUDED.effect_data,
    is_black_market = EXCLUDED.is_black_market;
