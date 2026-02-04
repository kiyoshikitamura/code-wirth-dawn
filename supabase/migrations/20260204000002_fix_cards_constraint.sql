-- Fix Cards Cost Type Constraint
-- The initial constraint was too restrictive ('vitality', 'mp').
-- Expanding to include 'gold', 'item', 'none'.

ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_cost_type_check;

ALTER TABLE cards ADD CONSTRAINT cards_cost_type_check 
CHECK (cost_type IN ('vitality', 'mp', 'gold', 'item', 'none'));
