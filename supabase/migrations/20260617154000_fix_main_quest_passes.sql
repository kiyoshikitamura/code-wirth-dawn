-- Migration: Fix main quest passes rewards, grant gold to previously pass-refunded users, and grant passes to all qualified users.

-- 1. 各メインクエストの報酬データ (rewards) の更新（新規入国用のみ）
UPDATE scenarios 
SET rewards = '{"gold":400,"items":["item_pass_markand"],"move_to":"loc_meridia","reputation":10,"alignment_shift":{"justice":10}}'::jsonb 
WHERE id = 6004;

UPDATE scenarios 
SET rewards = '{"gold":700,"items":["item_pass_yato"],"move_to":"loc_yato","reputation":10,"alignment_shift":{"justice":5}}'::jsonb 
WHERE id = 6007;

UPDATE scenarios 
SET rewards = '{"gold":500,"items":[502,"item_pass_karyu"],"move_to":"loc_charon","reputation":15,"alignment_shift":{"justice":10}}'::jsonb 
WHERE id = 6010;

UPDATE scenarios 
SET rewards = '{"gold":2000,"items":["item_pass_roland"],"move_to":"loc_regalia","reputation":20,"alignment_shift":{"order":5}}'::jsonb 
WHERE id = 6014;


-- 2. 以前補填を受けた対象ユーザーに対して、補填枚数に応じたゴールドを付与
-- (a) b0bf1b44-df04-4bae-b445-e2b53bb949a6: 4枚補填されたため 96,000G (24,000 * 4) を付与
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_chronicles 
    WHERE user_id = 'b0bf1b44-df04-4bae-b445-e2b53bb949a6' 
      AND event_type = 'system_refund' 
      AND title = '通行証不具合の補填'
  ) THEN
    UPDATE public.user_profiles 
    SET gold = gold + 96000, updated_at = NOW() 
    WHERE id = 'b0bf1b44-df04-4bae-b445-e2b53bb949a6';

    INSERT INTO public.user_chronicles (user_id, event_type, accumulated_days, location_id, title, description, param_changes, is_major_event, created_at)
    SELECT id, 'system_refund', accumulated_days, current_location_id, '通行証不具合の補填', 'メインクエスト通行許可証に関する不具合の補填として、ゴールド (+96,000G) を付与しました。', '{"gold": 96000}'::jsonb, false, NOW()
    FROM public.user_profiles
    WHERE id = 'b0bf1b44-df04-4bae-b445-e2b53bb949a6';
  END IF;
END $$;

-- (b) c7906aec-ba14-4e35-8102-b21c6bea529a: 1枚補填されたため 24,000G を付与
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_chronicles 
    WHERE user_id = 'c7906aec-ba14-4e35-8102-b21c6bea529a' 
      AND event_type = 'system_refund' 
      AND title = '通行証不具合の補填'
  ) THEN
    UPDATE public.user_profiles 
    SET gold = gold + 24000, updated_at = NOW() 
    WHERE id = 'c7906aec-ba14-4e35-8102-b21c6bea529a';

    INSERT INTO public.user_chronicles (user_id, event_type, accumulated_days, location_id, title, description, param_changes, is_major_event, created_at)
    SELECT id, 'system_refund', accumulated_days, current_location_id, '通行証不具合の補填', 'メインクエスト通行許可証に関する不具合の補填として、ゴールド (+24,000G) を付与しました。', '{"gold": 24000}'::jsonb, false, NOW()
    FROM public.user_profiles
    WHERE id = 'c7906aec-ba14-4e35-8102-b21c6bea529a';
  END IF;
END $$;


-- 3. 該当クエストをクリアしたユーザー全てに対して通行許可証を付与
--    (以前補填を受けた上記2名を除外)

-- (a) マルカンド (ID: 438) - 第4話クリア者のうち未所持者
INSERT INTO inventory (user_id, item_id, quantity, is_equipped, is_skill, acquired_at)
SELECT DISTINCT uc.user_id, 438, 1, false, false, NOW()
FROM user_completed_quests uc
WHERE uc.scenario_id = 6004
  AND uc.user_id NOT IN ('b0bf1b44-df04-4bae-b445-e2b53bb949a6', 'c7906aec-ba14-4e35-8102-b21c6bea529a')
  AND NOT EXISTS (
      SELECT 1 FROM inventory inv 
      WHERE inv.user_id = uc.user_id AND inv.item_id = 438
  );

-- (b) 夜刀 (ID: 437) - 第7話クリア者のうち未所持者
INSERT INTO inventory (user_id, item_id, quantity, is_equipped, is_skill, acquired_at)
SELECT DISTINCT uc.user_id, 437, 1, false, false, NOW()
FROM user_completed_quests uc
WHERE uc.scenario_id = 6007
  AND uc.user_id NOT IN ('b0bf1b44-df04-4bae-b445-e2b53bb949a6', 'c7906aec-ba14-4e35-8102-b21c6bea529a')
  AND NOT EXISTS (
      SELECT 1 FROM inventory inv 
      WHERE inv.user_id = uc.user_id AND inv.item_id = 437
  );

-- (c) 華龍 (ID: 436) - 第10話クリア者のうち未所持者
INSERT INTO inventory (user_id, item_id, quantity, is_equipped, is_skill, acquired_at)
SELECT DISTINCT uc.user_id, 436, 1, false, false, NOW()
FROM user_completed_quests uc
WHERE uc.scenario_id = 6010
  AND uc.user_id NOT IN ('b0bf1b44-df04-4bae-b445-e2b53bb949a6', 'c7906aec-ba14-4e35-8102-b21c6bea529a')
  AND NOT EXISTS (
      SELECT 1 FROM inventory inv 
      WHERE inv.user_id = uc.user_id AND inv.item_id = 436
  );

-- (d) ローランド (ID: 435) - 第14話クリア者のうち未所持者
INSERT INTO inventory (user_id, item_id, quantity, is_equipped, is_skill, acquired_at)
SELECT DISTINCT uc.user_id, 435, 1, false, false, NOW()
FROM user_completed_quests uc
WHERE uc.scenario_id = 6014
  AND uc.user_id NOT IN ('b0bf1b44-df04-4bae-b445-e2b53bb949a6', 'c7906aec-ba14-4e35-8102-b21c6bea529a')
  AND NOT EXISTS (
      SELECT 1 FROM inventory inv 
      WHERE inv.user_id = uc.user_id AND inv.item_id = 435
  );
