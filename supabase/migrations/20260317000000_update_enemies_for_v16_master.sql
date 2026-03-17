-- Drop existing constraint on enemy_skills effect_type
ALTER TABLE enemy_skills DROP CONSTRAINT IF EXISTS enemy_skills_effect_type_check;

-- Optionally re-add with expanded types including 'heal'
ALTER TABLE enemy_skills ADD CONSTRAINT enemy_skills_effect_type_check CHECK (effect_type IN ('damage', 'drain_vit', 'inject', 'buff', 'debuff', 'heal', 'other'));

-- Add atk and spawn_type to enemies
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS atk INTEGER DEFAULT 0;
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS spawn_type TEXT DEFAULT 'random';
