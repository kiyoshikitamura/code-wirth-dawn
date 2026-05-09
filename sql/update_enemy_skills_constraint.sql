-- ============================================================
-- Update enemy_skills_effect_type_check constraint
-- Adds support for 'buff_self_def' for Zeus's Aegis Shield
-- ============================================================

ALTER TABLE enemy_skills DROP CONSTRAINT IF EXISTS enemy_skills_effect_type_check;
ALTER TABLE enemy_skills ADD CONSTRAINT enemy_skills_effect_type_check
  CHECK (effect_type IN (
    'damage', 'drain_vit', 'heal', 'status_effect',
    'damage_poison', 'damage_blind', 'damage_bleed', 'damage_stun',
    'buff_self_atk', 'buff_self_def', 'debuff_atk_down', 'debuff_def_down',
    'inject', 'buff', 'debuff', 'other'
  ));
