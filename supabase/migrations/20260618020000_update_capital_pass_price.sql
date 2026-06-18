-- Migration: update_capital_pass_price
UPDATE items SET base_price = 10000 WHERE slug IN (
    'item_pass_roland',
    'item_pass_karyu',
    'item_pass_yato',
    'item_pass_markand'
);
