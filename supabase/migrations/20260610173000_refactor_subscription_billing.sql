-- 1. subscription_status カラムの追加
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive'
  CHECK (subscription_status IN ('inactive', 'trialing', 'active', 'canceled'));

-- 2. 既存有料ユーザーの初期ステータス移行
UPDATE public.user_profiles
  SET subscription_status = 'active'
  WHERE subscription_tier IN ('basic', 'premium') AND subscription_status = 'inactive';

-- 3. アトミックな Weekly ゴールドボーナス付与用 RPC
CREATE OR REPLACE FUNCTION public.process_weekly_gold_bonus(
  p_user_id UUID,
  p_amount INT
)
RETURNS BOOLEAN
AS $$
DECLARE
  v_last_bonus TIMESTAMP WITH TIME ZONE;
  v_seven_days_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '7 days';
  v_success BOOLEAN := FALSE;
  v_status TEXT;
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
    -- ゴールドを加算し、付与日時を更新
    UPDATE public.user_profiles
    SET gold = gold + p_amount,
        last_weekly_bonus_at = NOW()
    WHERE id = p_user_id;

    v_success := TRUE;
  END IF;

  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
