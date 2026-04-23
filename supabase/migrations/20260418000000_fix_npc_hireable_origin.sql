-- ============================================================
-- v2.9.3e: NPCテーブルのis_hireable/originフラグ修正
-- 問題: is_hireableがデフォルトfalseのまま、originカラムが未追加
--       → 酒場クエリが常に空配列を返していた
-- ============================================================

-- 1. originカラムを追加（存在しない場合のみ）
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'system_mercenary';

-- 2. 全NPC（system_mercenary想定）にis_hireable=true, origin='system_mercenary'を設定
UPDATE npcs SET
    is_hireable = true,
    origin = 'system_mercenary'
WHERE slug LIKE 'npc_%';

-- 3. ゲストNPCはhireableだがoriginを区別
UPDATE npcs SET origin = 'system_guest'
WHERE slug LIKE 'npc_guest_%';

-- 確認
SELECT slug, is_hireable, origin FROM npcs ORDER BY slug;
