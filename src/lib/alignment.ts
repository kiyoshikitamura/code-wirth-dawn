/**
 * Alignment Utility — Wirth-Dawn
 *
 * 対立軸ベースのアライメント割合計算。
 * - 軸1: 秩序(Order) ⇔ 混沌(Chaos)    → order_ratio = order / (order + chaos) * 100
 * - 軸2: 正義(Justice) ⇔ 悪(Evil)      → justice_ratio = justice / (justice + evil) * 100
 *
 * 各軸は 0〜100 のスケール。50 が中立。
 * 0 に近いほど Chaos/Evil 寄り、100 に近いほど Order/Justice 寄り。
 */

export interface AlignmentPcts {
  /** 秩序率: 0(=完全混沌) ～ 50(=中立) ～ 100(=完全秩序) */
  order_ratio: number;
  /** 正義率: 0(=完全悪) ～ 50(=中立) ～ 100(=完全正義) */
  justice_ratio: number;
  /** 混沌率: 100 - order_ratio */
  chaos_ratio: number;
  /** 悪率: 100 - justice_ratio */
  evil_ratio: number;
}

/**
 * 対立軸ベースのアライメント割合を算出。
 * 両軸とも累積値が0の場合は中立(50)を返す。
 */
export function calcAlignmentPcts(
  order: number, chaos: number, justice: number, evil: number
): AlignmentPcts {
  const ocTotal = order + chaos;
  const jeTotal = justice + evil;

  const order_ratio = ocTotal > 0 ? (order / ocTotal) * 100 : 50;
  const justice_ratio = jeTotal > 0 ? (justice / jeTotal) * 100 : 50;

  return {
    order_ratio: Math.round(order_ratio * 10) / 10,
    justice_ratio: Math.round(justice_ratio * 10) / 10,
    chaos_ratio: Math.round((100 - order_ratio) * 10) / 10,
    evil_ratio: Math.round((100 - justice_ratio) * 10) / 10,
  };
}

/**
 * 闇市出現条件チェック。
 * Evil寄り(evil_ratio >= 60%) または Chaos寄り(chaos_ratio >= 60%) で出現。
 */
export function isDarkMarketEligible(pcts: AlignmentPcts): boolean {
  return pcts.evil_ratio >= 60 || pcts.chaos_ratio >= 60;
}

/**
 * 支配的アライメントを返す（称号等で使用）。
 * 各軸で離れている方を優先し、最も偏っている属性を返す。
 */
export function getDominantAlignment(pcts: AlignmentPcts): 'order' | 'chaos' | 'justice' | 'evil' | 'neutral' {
  const orderDeviation = Math.abs(pcts.order_ratio - 50);
  const justiceDeviation = Math.abs(pcts.justice_ratio - 50);

  // 両軸とも中立に近い場合
  if (orderDeviation < 10 && justiceDeviation < 10) return 'neutral';

  if (orderDeviation >= justiceDeviation) {
    return pcts.order_ratio >= 50 ? 'order' : 'chaos';
  } else {
    return pcts.justice_ratio >= 50 ? 'justice' : 'evil';
  }
}

/**
 * UserProfileからAlignmentPctsを算出するヘルパー。
 */
export function getUserAlignmentPcts(user: {
  order_pts?: number; chaos_pts?: number;
  justice_pts?: number; evil_pts?: number;
}): AlignmentPcts {
  return calcAlignmentPcts(
    user.order_pts || 0, user.chaos_pts || 0,
    user.justice_pts || 0, user.evil_pts || 0
  );
}
