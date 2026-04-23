-- ============================================================
-- v2.9.3b: スキル vs アイテム 価格バランス調整
-- スキルブックの相対的価値維持のための価格修正6件
-- ============================================================

-- #1 砥石: 100G → 250G（狂戦士スキル1200Gとの価格差緩和）
UPDATE items SET base_price = 250 WHERE slug = 'item_whetstone';

-- #2 奥義書:命削り: 8000G → 5000G（Vitリスク考慮で減額）
UPDATE items SET base_price = 5000 WHERE slug = 'skill_vital_strike';

-- #3 禁書:死体操作: 8000G → 5000G（ニッチスキルの価格適正化）
UPDATE items SET base_price = 5000 WHERE slug = 'skill_necromancy';

-- #4 秘伝:点穴: 5000G → 3500G（即死+麻痺にVitコストもあり）
UPDATE items SET base_price = 3500 WHERE slug = 'manual_dim_mak';

-- #5 鉄の剣(武器) → 鍛鉄の剣（教本:鉄の剣との名称衝突回避）
UPDATE items SET name = '鍛鉄の剣',
    effect_data = '{"atk_bonus":6,"description":"鍛冶師が鍛えた標準的な鉄の剣。バランスの良い一振り。"}'::jsonb
WHERE slug = 'gear_broadsword';

-- #6 奥義:獅子吼: 3000G → 2500G（同価格帯装備との相対調整）
UPDATE items SET base_price = 2500 WHERE slug = 'skill_lion_roar';

-- 確認
SELECT slug, name, base_price FROM items
WHERE slug IN ('item_whetstone','skill_vital_strike','skill_necromancy','manual_dim_mak','gear_broadsword','skill_lion_roar');
