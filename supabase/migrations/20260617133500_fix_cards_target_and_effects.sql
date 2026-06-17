-- オアシスの水 (ID 20)、清め (ID 24) の対象を self に変更（自己治療・回復に整合）
UPDATE cards SET target_type = 'self' WHERE id IN (20, 24);

-- メテオストライク (ID 37) の効果を poison に変更（説明文に整合）
UPDATE cards SET effect_id = 'poison' WHERE id = 37;

-- 黒曜球 (ID 49) の効果を atk_down に変更（説明文に整合）
UPDATE cards SET effect_id = 'atk_down' WHERE id = 49;
