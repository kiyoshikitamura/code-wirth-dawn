-- 1. user_profiles テーブルに新規パッケージの購入済みフラグカラムを追加
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS has_purchased_starter BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_purchased_elite BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. アトミックな Weekly サブスクボーナス（ゴールド＋鍵アイテム）付与用 RPC
CREATE OR REPLACE FUNCTION public.process_weekly_subscription_bonus(
  p_user_id UUID,
  p_tier TEXT
)
RETURNS BOOLEAN
AS $$
DECLARE
  v_last_bonus TIMESTAMP WITH TIME ZONE;
  v_seven_days_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '7 days';
  v_success BOOLEAN := FALSE;
  v_status TEXT;
  v_gold_amount INT;
  v_basic_key_amount INT;
  v_academy_key_amount INT;
  v_inv_id UUID;
BEGIN
  -- ロックを掛けつつ最終ボーナス日時とサブスクステータスを取得
  SELECT last_weekly_bonus_at, subscription_status INTO v_last_bonus, v_status
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- trialing（無料トライアル）状態のユーザーはスキップ
  IF v_status = 'trialing' THEN
    RETURN FALSE;
  END IF;

  -- 7日以上経過している場合、または初めて付与する場合のみ実行
  IF v_last_bonus IS NULL OR v_last_bonus <= v_seven_days_ago THEN
    -- Tier に基づく付与量の決定
    IF p_tier = 'premium' THEN
      v_gold_amount := 5000;
      v_basic_key_amount := 3;
      v_academy_key_amount := 2;
    ELSE
      v_gold_amount := 2000;
      v_basic_key_amount := 1;
      v_academy_key_amount := 1;
    END IF;

    -- ゴールドを加算し、付与日時を更新
    UPDATE public.user_profiles
    SET gold = gold + v_gold_amount,
        last_weekly_bonus_at = NOW()
    WHERE id = p_user_id;

    -- 知識と契約の鍵 (ベーシックキー: 76)
    SELECT id INTO v_inv_id FROM public.inventory WHERE user_id = p_user_id AND item_id = 76 FOR UPDATE;
    IF v_inv_id IS NOT NULL THEN
      UPDATE public.inventory SET quantity = quantity + v_basic_key_amount WHERE id = v_inv_id;
    ELSE
      INSERT INTO public.inventory (user_id, item_id, quantity) VALUES (p_user_id, 76, v_basic_key_amount);
    END IF;

    -- 魔道と鉄壁の鍵 (魔術学院キー: 77)
    SELECT id INTO v_inv_id FROM public.inventory WHERE user_id = p_user_id AND item_id = 77 FOR UPDATE;
    IF v_inv_id IS NOT NULL THEN
      UPDATE public.inventory SET quantity = quantity + v_academy_key_amount WHERE id = v_inv_id;
    ELSE
      INSERT INTO public.inventory (user_id, item_id, quantity) VALUES (p_user_id, 77, v_academy_key_amount);
    END IF;

    v_success := TRUE;
  END IF;

  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. アトミックな新規都度購入パッケージ処理用 RPC
CREATE OR REPLACE FUNCTION public.process_package_purchase(
  p_user_id UUID,
  p_package_key TEXT
)
RETURNS BOOLEAN
AS $$
DECLARE
  v_gold_amount INT;
  v_basic_key_amount INT;
  v_academy_key_amount INT;
  v_is_already_purchased BOOLEAN;
  v_inv_id UUID;
BEGIN
  -- すでに購入済みかチェック & ロック
  IF p_package_key = 'starter_pack' THEN
    SELECT has_purchased_starter INTO v_is_already_purchased FROM public.user_profiles WHERE id = p_user_id FOR UPDATE;
    IF v_is_already_purchased = TRUE THEN
      RETURN FALSE; -- 二重購入防止
    END IF;
    v_gold_amount := 10000;
    v_basic_key_amount := 5;
    v_academy_key_amount := 3;
  ELSIF p_package_key = 'elite_pack' THEN
    SELECT has_purchased_elite INTO v_is_already_purchased FROM public.user_profiles WHERE id = p_user_id FOR UPDATE;
    IF v_is_already_purchased = TRUE THEN
      RETURN FALSE; -- 二重購入防止
    END IF;
    v_gold_amount := 30000;
    v_basic_key_amount := 8;
    v_academy_key_amount := 5;
  ELSE
    RETURN FALSE;
  END IF;

  -- 1. ゴールドとフラグの更新
  IF p_package_key = 'starter_pack' THEN
    UPDATE public.user_profiles
    SET gold = gold + v_gold_amount,
        has_purchased_starter = TRUE
    WHERE id = p_user_id;
  ELSE
    UPDATE public.user_profiles
    SET gold = gold + v_gold_amount,
        has_purchased_elite = TRUE
    WHERE id = p_user_id;
  END IF;

  -- 2. 知識と契約の鍵 (ベーシックキー: 76)
  SELECT id INTO v_inv_id FROM public.inventory WHERE user_id = p_user_id AND item_id = 76 FOR UPDATE;
  IF v_inv_id IS NOT NULL THEN
    UPDATE public.inventory SET quantity = quantity + v_basic_key_amount WHERE id = v_inv_id;
  ELSE
    INSERT INTO public.inventory (user_id, item_id, quantity) VALUES (p_user_id, 76, v_basic_key_amount);
  END IF;

  -- 3. 魔道と鉄壁の鍵 (魔術学院キー: 77)
  SELECT id INTO v_inv_id FROM public.inventory WHERE user_id = p_user_id AND item_id = 77 FOR UPDATE;
  IF v_inv_id IS NOT NULL THEN
    UPDATE public.inventory SET quantity = quantity + v_academy_key_amount WHERE id = v_inv_id;
  ELSE
    INSERT INTO public.inventory (user_id, item_id, quantity) VALUES (p_user_id, 77, v_academy_key_amount);
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
