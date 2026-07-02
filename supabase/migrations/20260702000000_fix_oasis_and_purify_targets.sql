-- オアシスの水 (ID 20)、清め (ID 24) の対象を single_ally に変更（仲間に使えるように修正）
UPDATE cards SET target_type = 'single_ally' WHERE id IN (20, 24);
