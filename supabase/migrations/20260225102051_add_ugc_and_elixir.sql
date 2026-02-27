-- Add is_ugc to inventory
ALTER TABLE inventory ADD COLUMN is_ugc BOOLEAN DEFAULT FALSE;

-- Add Elixir of Forbidden Arts to items
INSERT INTO items (slug, name, type, base_price, description, is_skill, rarity, is_black_market) 
VALUES (
    'item_elixir_forbidden', 
    '禁術の秘薬', 
    'consumable', 
    50000, 
    '失われた寿命を1回復する、禁術によって作られた奇跡の霊薬。', 
    FALSE, 
    'legendary', 
    TRUE
)
ON CONFLICT (slug) DO NOTHING;
