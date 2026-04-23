-- ============================================================
-- v2.9.2: 未実装バトルアイテム4種の効果実装
-- 聖水/火炎瓶/砥石/大型爆弾 に use_timing と効果データを設定
-- ============================================================

-- ■ 砥石: ATK+50%バフ（3ターン）
-- 既存の atk_up エンジンをそのまま利用
UPDATE items
SET effect_data = '{
    "use_timing": "battle",
    "effect_id": "atk_up",
    "effect_duration": 3,
    "description": "武器を研いで攻撃力を一時的に強化する。3ターンATK1.5倍。"
}'::jsonb
WHERE slug = 'item_whetstone';

-- ■ 聖水: 単体50ダメージ
-- アンデッドの弱点を突く純粋な固定ダメージ
UPDATE items
SET effect_data = '{
    "use_timing": "battle",
    "damage": 50,
    "description": "聖なる水を投げつけ、敵に50ダメージ。アンデッド系への投擲に最適。"
}'::jsonb
WHERE slug = 'item_holy_water';

-- ■ 火炎瓶: 単体30ダメージ + 毒（炎上のDoT代替）2ターン
-- 直接ダメージ + 継続ダメージ（poison流用）の複合効果
UPDATE items
SET effect_data = '{
    "use_timing": "battle",
    "damage": 30,
    "target": "enemy",
    "effect_id": "poison",
    "effect_duration": 2,
    "description": "火炎瓶を投げつけ30ダメージ。さらに炎上（2ターン持続ダメージ）を与える。"
}'::jsonb
WHERE slug = 'item_oil_pot';

-- ■ 大型爆弾: 全体80ダメージ
-- 敵全体に固定ダメージの強力な攻撃アイテム
UPDATE items
SET effect_data = '{
    "use_timing": "battle",
    "aoe_damage": 80,
    "description": "敵全体に80ダメージを与える大型爆弾。集団戦の切り札。"
}'::jsonb
WHERE slug = 'item_bomb_large';

-- 確認
SELECT slug, name, effect_data FROM items
WHERE slug IN ('item_whetstone', 'item_holy_water', 'item_oil_pot', 'item_bomb_large');
