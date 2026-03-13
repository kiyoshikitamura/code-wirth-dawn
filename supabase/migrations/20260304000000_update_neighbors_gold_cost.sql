-- Migration: Update neighbors JSONB structure to include gold_cost
-- Date: 2026-03-04
-- Changes: neighbors format: Record<string, number> → Record<string, { days: number, gold_cost: number }>
--
-- 変更前: { "izumo": 3, "rakuyo": 5 }
-- 変更後: { "izumo": { "days": 3, "gold_cost": 150 }, "rakuyo": { "days": 5, "gold_cost": 250 } }
--
-- gold_cost の初期値は 日数 × 50G のダミー値。後から個別調整可能。

UPDATE locations
SET neighbors = (
  SELECT jsonb_object_agg(
    key,
    jsonb_build_object(
      'days', value::int,
      'gold_cost', (value::int * 50)
    )
  )
  FROM jsonb_each_text(neighbors)
)
WHERE neighbors IS NOT NULL
  AND neighbors != '{}'::jsonb
  -- 既に新形式のエントリが存在する場合はスキップ（冪等性確保）
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_each(neighbors) AS j(k, v)
    WHERE jsonb_typeof(v) = 'object'
    LIMIT 1
  );
