-- Add Capital Pass item to the shop
INSERT INTO items (slug, name, type, base_price, effect_data, nation_tags, min_prosperity, is_black_market)
VALUES
  ('capital_pass', '首都通行許可証', 'consumable', 5000, '{"is_pass": true}', ARRAY['loc_all'], 3, false)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_price = EXCLUDED.base_price,
  effect_data = EXCLUDED.effect_data,
  nation_tags = EXCLUDED.nation_tags,
  min_prosperity = EXCLUDED.min_prosperity,
  is_black_market = EXCLUDED.is_black_market;
