-- Seed initial items for Shop System (Spec v6)

INSERT INTO items (id, name, type, base_price, effect_data, nation_tags, min_prosperity, required_alignment, is_black_market)
VALUES
  -- Consumables
  ('potion_health_s', '薬草 (S)', 'consumable', 30, '{"heal": 30}', ARRAY['loc_all'], 1, '{}', false),
  ('potion_health_m', '上級傷薬 (M)', 'consumable', 100, '{"heal": 100}', ARRAY['loc_all'], 3, '{}', false),
  ('torch', '松明', 'consumable', 10, '{"light_duration": 10}', ARRAY['loc_all'], 1, '{}', false),
  ('explosive_powder', '火薬', 'consumable', 200, '{"damage": 50}', ARRAY['loc_markand'], 2, '{}', false),
  ('holy_water', '聖水', 'consumable', 150, '{"purify": true}', ARRAY['loc_holy_empire'], 2, '{}', false),
  ('elixir_shadow', '闇の秘薬', 'consumable', 500, '{"heal": 999, "curse": true}', ARRAY['loc_all'], 1, '{"evil": 10, "chaos": 10}', true),

  -- Skills
  ('skill_slash', 'スラッシュ', 'skill', 300, '{"power": 20, "cost": 5}', ARRAY['loc_all'], 1, '{}', false),
  ('skill_fireball', 'ファイアボール', 'skill', 500, '{"power": 30, "cost": 10}', ARRAY['loc_all'], 2, '{}', false),
  ('skill_heal', 'ヒール', 'skill', 400, '{"heal": 50, "cost": 15}', ARRAY['loc_all'], 1, '{}', false),
  ('skill_iron_defense', '鉄壁', 'skill', 600, '{"defense": 50, "cost": 8}', ARRAY['loc_roland'], 3, '{}', false),
  ('skill_assassinate', '暗殺', 'skill', 1000, '{"power": 100, "cost": 30}', ARRAY['loc_all'], 1, '{"evil": 20}', true),
  ('skill_royal_sword', '近衛騎士の剣技', 'skill', 2000, '{"power": 60, "cost": 20}', ARRAY['loc_roland'], 4, '{"order": 30}', false),
  
  -- Weapons / Equipment (treated as items or skills depending on spec, here 'equipment' per migration check)
  ('w_iron_sword', '鉄の剣', 'equipment', 250, '{"attack": 5}', ARRAY['loc_all'], 1, '{}', false),
  ('w_steel_shield', '鋼鉄の盾', 'equipment', 400, '{"cover": 10}', ARRAY['loc_roland'], 2, '{}', false)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  base_price = EXCLUDED.base_price,
  effect_data = EXCLUDED.effect_data,
  nation_tags = EXCLUDED.nation_tags,
  min_prosperity = EXCLUDED.min_prosperity,
  required_alignment = EXCLUDED.required_alignment,
  is_black_market = EXCLUDED.is_black_market;
