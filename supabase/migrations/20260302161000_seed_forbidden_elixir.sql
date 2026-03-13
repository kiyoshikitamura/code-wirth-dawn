-- Phase 2-A: 禁術の秘薬 のデータ投入（is_black_market カラム付き）
-- spec_v6_shop_system.md §3.3 参照

-- is_black_market カラムが未存在の場合に備えて安全に追加
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_black_market BOOLEAN DEFAULT FALSE;

-- nation_tags カラムが未存在の場合に備えて安全に追加
ALTER TABLE items ADD COLUMN IF NOT EXISTS min_prosperity INTEGER DEFAULT 1;

-- 禁術の秘薬 の投入
-- 全拠点（loc_all）で nation_tags を設定し、崩壊拠点（Prosperity=1）限定の闇市アイテムとして登録
-- ※ items テーブルに description カラムは存在しないためフレーバーテキストは effect_data に格納
INSERT INTO items (slug, name, type, base_price, is_black_market, nation_tags, min_prosperity, effect_data)
VALUES (
    'item_elixir_forbidden',
    '禁術の秘薬',
    'consumable',
    50000,
    TRUE,
    ARRAY['loc_all'],
    1,
    '{"description": "失われた寿命（Vitality）を1回復する、禁術によって作られた奇跡の霊薬。崩壊した拠点の闇市でのみ入手できる。", "effect": "restore_vitality", "amount": 1}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    base_price     = EXCLUDED.base_price,
    is_black_market = EXCLUDED.is_black_market,
    nation_tags    = EXCLUDED.nation_tags,
    min_prosperity = EXCLUDED.min_prosperity,
    effect_data    = EXCLUDED.effect_data;
