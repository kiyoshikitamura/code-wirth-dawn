-- Migration: Add Pack Opening Keys to items table
-- ID 76: item_basic_key
-- ID 77: item_academy_key

INSERT INTO public.items (id, slug, name, type, base_price, min_prosperity, nation_tags, effect_data, is_black_market)
VALUES 
(
    76, 
    'item_basic_key', 
    '知識と契約の鍵', 
    'consumable', 
    2000, 
    1, 
    '{}', 
    '{"use_timing": "field", "effect": "open_pack", "pack_series": "basic", "description": "カードパック「黎明の知識と古の契約」を開封することのできる鍵"}'::jsonb, 
    false
),
(
    77, 
    'item_academy_key', 
    '魔道と知識の鍵', 
    'consumable', 
    3000, 
    1, 
    '{}', 
    '{"use_timing": "field", "effect": "open_pack", "pack_series": "chaos_and_rebellion", "description": "カードパック「混沌の魔道と反逆の鉄壁」を開封することのできる鍵"}'::jsonb, 
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
