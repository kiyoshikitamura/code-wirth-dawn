-- Migration: ガウェイン・ヴォルグのステータス(HP・雇用費)・所持スキル調整

-- ガウェイン (npc_guest_gawain)
-- HP: 800 -> 420
-- 所持スキル: 防御(4), 挑発(9) -> 防御(4), 挑発(9), 五星の加護(71), 虚空撃(52)
UPDATE npcs SET 
    max_hp = 420, 
    inject_cards = ARRAY[4, 9, 71, 52], 
    default_cards = ARRAY[4, 9, 71, 52],
    hire_cost = 0
WHERE slug = 'npc_guest_gawain';

-- ヴォルグ (npc_guest_volg)
-- HP: 1600 -> 680
-- 雇用費: 6000
-- 所持スキル: 強打(1), 連撃(29), 鉄布衫(28) -> 連撃(29), 鉄布衫(28), 天翔斬(48), 居合切り(25)
UPDATE npcs SET 
    max_hp = 680, 
    inject_cards = ARRAY[29, 28, 48, 25], 
    default_cards = ARRAY[29, 28, 48, 25],
    hire_cost = 6000
WHERE slug = 'npc_guest_volg';
