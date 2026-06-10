-- 1. royalty_daily_log に UNIQUE インデックスを追加（ON CONFLICT 用）
CREATE UNIQUE INDEX IF NOT EXISTS idx_royalty_daily_log_user_date 
ON public.royalty_daily_log (user_id, log_date);

-- 2. アトミックなロイヤリティ分配用 RPC
-- 元プレイヤーの残高への加算と日額CAP制限を、1トランザクションで安全に処理します。
CREATE OR REPLACE FUNCTION public.process_royalty_payout(
  p_owner_id UUID,
  p_amount INT,
  p_daily_cap INT
) 
RETURNS INT 
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  current_total INT := 0;
  effective_payout INT := 0;
BEGIN
  -- 対象日付のログが存在しない場合は 0 で初期挿入、存在する場合は行ロックして現在の値を保持
  INSERT INTO public.royalty_daily_log (user_id, log_date, total_gold)
  VALUES (p_owner_id, today_date, 0)
  ON CONFLICT (user_id, log_date) DO UPDATE
  SET user_id = EXCLUDED.user_id -- ロック獲得のためのダミー更新
  RETURNING total_gold INTO current_total;

  -- 日額上限に対する残り枠を計算
  effective_payout := GREATEST(0, p_daily_cap - current_total);
  effective_payout := LEAST(p_amount, effective_payout);

  IF effective_payout > 0 THEN
    -- 元プレイヤーのゴールド残高を加算
    UPDATE public.user_profiles
    SET gold = gold + effective_payout
    WHERE id = p_owner_id;

    -- 本日の累積獲得ログを更新
    UPDATE public.royalty_daily_log
    SET total_gold = total_gold + effective_payout
    WHERE user_id = p_owner_id AND log_date = today_date;
  END IF;

  RETURN effective_payout;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 名声ランキングデータベース集計用 RPC
-- Node.js に全データを持ち込まず、データベース側で集計からキャッシュテーブルの書き換えまでを完結させます。
CREATE OR REPLACE FUNCTION public.aggregate_reputation_ranking()
RETURNS VOID 
AS $$
DECLARE
  lock_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- キャッシュテーブルを一旦クリア（ダミーID '00000000-0000-0000-0000-000000000000' は除く安全策）
  DELETE FROM public.ranking_reputation_cache 
  WHERE id IS DISTINCT FROM '00000000-0000-0000-0000-000000000000';

  -- 集計とキャッシュ挿入（全プレイヤーの名声の合計を集計）
  INSERT INTO public.ranking_reputation_cache (
    user_id,
    user_name,
    total_reputation,
    rank_desc,
    rank_asc,
    aggregated_at
  )
  SELECT 
    p.id as user_id,
    COALESCE(p.name, '名もなき旅人') as user_name,
    COALESCE(SUM(r.score), 0) as total_reputation,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(r.score), 0) DESC) as rank_desc,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(r.score), 0) ASC) as rank_asc,
    lock_time as aggregated_at
  FROM public.user_profiles p
  LEFT JOIN public.reputations r ON r.user_id = p.id
  GROUP BY p.id, p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. アライメントランキングデータベース集計用 RPC
-- 各サイクルの開始時と現在値の差分（ゲイン）を集計し、上位 20 名をキャッシュします。
CREATE OR REPLACE FUNCTION public.aggregate_alignment_ranking(p_cycle_started_at TIMESTAMP WITH TIME ZONE)
RETURNS VOID 
AS $$
DECLARE
  lock_time TIMESTAMP WITH TIME ZONE := NOW();
  needs_reset BOOLEAN := FALSE;
BEGIN
  -- baselines のサイクルリセットチェック
  SELECT COUNT(*) = 0 OR MIN(cycle_started_at) IS DISTINCT FROM p_cycle_started_at INTO needs_reset
  FROM public.alignment_baseline;

  IF needs_reset THEN
    -- 新サイクル開始時は、その瞬間の各プレイヤーのアライメント値を baseline にスナップショット保存
    DELETE FROM public.alignment_baseline;
    
    INSERT INTO public.alignment_baseline (user_id, order_pts, chaos_pts, justice_pts, evil_pts, cycle_started_at)
    SELECT 
      id as user_id,
      COALESCE(order_pts, 0) as order_pts,
      COALESCE(chaos_pts, 0) as chaos_pts,
      COALESCE(justice_pts, 0) as justice_pts,
      COALESCE(evil_pts, 0) as evil_pts,
      p_cycle_started_at as cycle_started_at
    FROM public.user_profiles;
  END IF;

  -- アライメントランキングのキャッシュクリア
  DELETE FROM public.ranking_alignment_cache 
  WHERE id IS DISTINCT FROM '00000000-0000-0000-0000-000000000000';

  -- 各プレイヤーのアライメントゲイン（差分）を集計してキャッシュ挿入
  INSERT INTO public.ranking_alignment_cache (
    user_id,
    user_name,
    order_gained,
    chaos_gained,
    justice_gained,
    evil_gained,
    total_gained,
    rank,
    aggregated_at,
    cycle_started_at
  )
  SELECT 
    p.id as user_id,
    COALESCE(p.name, '名もなき旅人') as user_name,
    GREATEST(0, COALESCE(p.order_pts, 0) - COALESCE(b.order_pts, 0)) as order_gained,
    GREATEST(0, COALESCE(p.chaos_pts, 0) - COALESCE(b.chaos_pts, 0)) as chaos_gained,
    GREATEST(0, COALESCE(p.justice_pts, 0) - COALESCE(b.justice_pts, 0)) as justice_gained,
    GREATEST(0, COALESCE(p.evil_pts, 0) - COALESCE(b.evil_pts, 0)) as evil_gained,
    (
      GREATEST(0, COALESCE(p.order_pts, 0) - COALESCE(b.order_pts, 0)) +
      GREATEST(0, COALESCE(p.chaos_pts, 0) - COALESCE(b.chaos_pts, 0)) +
      GREATEST(0, COALESCE(p.justice_pts, 0) - COALESCE(b.justice_pts, 0)) +
      GREATEST(0, COALESCE(p.evil_pts, 0) - COALESCE(b.evil_pts, 0))
    ) as total_gained,
    ROW_NUMBER() OVER (
      ORDER BY (
        GREATEST(0, COALESCE(p.order_pts, 0) - COALESCE(b.order_pts, 0)) +
        GREATEST(0, COALESCE(p.chaos_pts, 0) - COALESCE(b.chaos_pts, 0)) +
        GREATEST(0, COALESCE(p.justice_pts, 0) - COALESCE(b.justice_pts, 0)) +
        GREATEST(0, COALESCE(p.evil_pts, 0) - COALESCE(b.evil_pts, 0))
      ) DESC
    ) as rank,
    lock_time as aggregated_at,
    p_cycle_started_at as cycle_started_at
  FROM public.user_profiles p
  LEFT JOIN public.alignment_baseline b ON b.user_id = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
