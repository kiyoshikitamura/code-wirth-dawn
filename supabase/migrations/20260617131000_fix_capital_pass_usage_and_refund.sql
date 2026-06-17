-- Update item name and description/flavor text for Capital Pass items
UPDATE items SET
  name = '聖王国通行許可証',
  description = '教皇の印璽が押された羊皮紙。使用すると365日間、ローランド聖王国の首都「王都レガリア」への通行が許可される。',
  effect_data = jsonb_set(effect_data, '{description}', '"教皇の印璽が押された羊皮紙。使用すると365日間、ローランド聖王国の首都「王都レガリア」への通行が許可される。"'::jsonb)
WHERE slug = 'item_pass_roland';

UPDATE items SET
  description = '翡翠で象られた身分証。使用すると365日間、華龍神朝の首都「天極城『龍京』」への通行が許可される。',
  effect_data = jsonb_set(effect_data, '{description}', '"翡翠で象られた身分証。使用すると365日間、華龍神朝の首都「天極城『龍京』」への通行が許可される。"'::jsonb)
WHERE slug = 'item_pass_karyu';

UPDATE items SET
  description = '血判と複雑な呪符が記された木札。使用すると365日間、夜刀神国の首都「神都『出雲』」への通行が許可される。',
  effect_data = jsonb_set(effect_data, '{description}', '"血判と複雑な呪符が記された木札。使用すると365日間、夜刀神国の首都「神都『出雲』」への通行が許可される。"'::jsonb)
WHERE slug = 'item_pass_yato';

UPDATE items SET
  description = '金糸で刺繍された布証。使用すると365日間、砂塵の王国マルカンドの首都「黄金都市イスハーク」への通行が許可される。',
  effect_data = jsonb_set(effect_data, '{description}', '"金糸で刺繍された布証。使用すると365日間、砂塵の王国マルカンドの首都「黄金都市イスハーク」への通行が許可される。"'::jsonb)
WHERE slug = 'item_pass_markand';

-- Refund consumed pass items to affected users who obtained them but don't have them in inventory and don't have active pass expiration
INSERT INTO public.inventory (user_id, item_id, quantity, is_equipped, is_skill, acquired_at)
SELECT 
  h.user_id, 
  h.item_id, 
  1, 
  false, 
  false, 
  NOW()
FROM public.user_item_history h
JOIN public.user_profiles p ON p.id = h.user_id
WHERE h.item_id IN (435, 436, 437, 438)
  -- Currently not in inventory
  AND NOT EXISTS (
    SELECT 1 
    FROM public.inventory i 
    WHERE i.user_id = h.user_id 
      AND i.item_id = h.item_id
  )
  -- Currently pass is not active / not expired yet
  AND (
    p.pass_expires_at IS NULL 
    OR (p.pass_expires_at->>(
      CASE h.item_id
        WHEN 435 THEN 'Roland'
        WHEN 436 THEN 'Karyu'
        WHEN 437 THEN 'Yato'
        WHEN 438 THEN 'Markand'
      END
    )) IS NULL
    OR (p.pass_expires_at->>(
      CASE h.item_id
        WHEN 435 THEN 'Roland'
        WHEN 436 THEN 'Karyu'
        WHEN 437 THEN 'Yato'
        WHEN 438 THEN 'Markand'
      END
    ))::integer <= p.accumulated_days
  );
