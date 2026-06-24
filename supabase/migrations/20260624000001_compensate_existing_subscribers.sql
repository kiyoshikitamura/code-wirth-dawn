-- 既存の Basic / Premium サブスクリプション加入者へ、アップデートに伴う鍵アイテムの初回分補填を適用
DO $$
DECLARE
  r RECORD;
  v_inv_id UUID;
BEGIN
  -- 1. Basic プラン加入者への補填（知識と契約の鍵: 76 x1, 魔道と鉄壁の鍵: 77 x1）
  FOR r IN 
    SELECT id 
    FROM public.user_profiles 
    WHERE subscription_status = 'active' AND subscription_tier = 'basic' 
  LOOP
    -- 知識と契約の鍵 (76)
    SELECT id INTO v_inv_id FROM public.inventory WHERE user_id = r.id AND item_id = 76;
    IF v_inv_id IS NOT NULL THEN
      UPDATE public.inventory SET quantity = quantity + 1 WHERE id = v_inv_id;
    ELSE
      INSERT INTO public.inventory (user_id, item_id, quantity) VALUES (r.id, 76, 1);
    END IF;

    -- 魔道と鉄壁の鍵 (77)
    SELECT id INTO v_inv_id FROM public.inventory WHERE user_id = r.id AND item_id = 77;
    IF v_inv_id IS NOT NULL THEN
      UPDATE public.inventory SET quantity = quantity + 1 WHERE id = v_inv_id;
    ELSE
      INSERT INTO public.inventory (user_id, item_id, quantity) VALUES (r.id, 77, 1);
    END IF;
  END LOOP;

  -- 2. Premium プラン加入者への補填（知識と契約の鍵: 76 x3, 魔道と鉄壁の鍵: 77 x2）
  FOR r IN 
    SELECT id 
    FROM public.user_profiles 
    WHERE subscription_status = 'active' AND subscription_tier = 'premium' 
  LOOP
    -- 知識と契約の鍵 (76)
    SELECT id INTO v_inv_id FROM public.inventory WHERE user_id = r.id AND item_id = 76;
    IF v_inv_id IS NOT NULL THEN
      UPDATE public.inventory SET quantity = quantity + 3 WHERE id = v_inv_id;
    ELSE
      INSERT INTO public.inventory (user_id, item_id, quantity) VALUES (r.id, 76, 3);
    END IF;

    -- 魔道と鉄壁の鍵 (77)
    SELECT id INTO v_inv_id FROM public.inventory WHERE user_id = r.id AND item_id = 77;
    IF v_inv_id IS NOT NULL THEN
      UPDATE public.inventory SET quantity = quantity + 2 WHERE id = v_inv_id;
    ELSE
      INSERT INTO public.inventory (user_id, item_id, quantity) VALUES (r.id, 77, 2);
    END IF;
  END LOOP;
END $$;
