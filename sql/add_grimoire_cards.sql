-- cards テーブルに魔導書カード3種を追加 (ID 65-67)
-- 実行日: 2026-04-28

INSERT INTO cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES
  (65, 'card_fireball', '火球', 'Magic', 2, 'mp', 10, 40, 'single_enemy', 'burn', '/images/items/grimoire_fire.png', '火球を放ち敵を攻撃する。40の魔法ダメージを与え、2ターンの間、炎上（毎ターンHP5%ダメージ）を付与する。'),
  (66, 'card_ice_lance', '氷槍', 'Magic', 2, 'mp', 10, 35, 'single_enemy', 'bind', '/images/items/grimoire_ice.png', '氷の槍で敵を貫く。35の魔法ダメージを与え、1ターンの間、敵を拘束（行動不能）にする。'),
  (67, 'card_thunder_strike', '雷撃', 'Magic', 3, 'mp', 15, 45, 'single_enemy', 'stun', '/images/items/grimoire_thunder.png', '雷を落とし敵を攻撃する。45の魔法ダメージを与え、1ターンの間、スタン（行動不能）を付与する。')
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  ap_cost = EXCLUDED.ap_cost,
  cost_type = EXCLUDED.cost_type,
  cost_val = EXCLUDED.cost_val,
  effect_val = EXCLUDED.effect_val,
  target_type = EXCLUDED.target_type,
  effect_id = EXCLUDED.effect_id,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description;

-- skills テーブルの魔導書スキルにcard_idを紐づけ
-- skills.slug は items.slug と一致するケースが多い
-- grimoire_fire → card_id=65, grimoire_ice → card_id=66, grimoire_thunder → card_id=67
UPDATE skills SET card_id = 65 WHERE slug = 'grimoire_fire' AND (card_id IS NULL OR card_id != 65);
UPDATE skills SET card_id = 66 WHERE slug = 'grimoire_ice' AND (card_id IS NULL OR card_id != 66);
UPDATE skills SET card_id = 67 WHERE slug = 'grimoire_thunder' AND (card_id IS NULL OR card_id != 67);

-- 確認: 更新結果
SELECT id, slug, name, card_id FROM skills WHERE slug IN ('grimoire_fire', 'grimoire_ice', 'grimoire_thunder');
SELECT id, slug, name, type, effect_val, effect_id FROM cards WHERE id IN (65, 66, 67);
