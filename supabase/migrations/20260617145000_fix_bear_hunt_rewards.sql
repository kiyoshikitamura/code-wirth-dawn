-- 凶熊狩り (ID: 7005) の報酬定義を整合化 ( items を item_bear_pelt に修正)
UPDATE scenarios 
SET rewards = '{"gold":200,"items":["item_bear_pelt"],"reputation":5}'::jsonb 
WHERE id = 7005;
