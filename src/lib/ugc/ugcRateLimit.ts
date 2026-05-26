/**
 * UGC System v2 — レートリミットロジック
 * @module ugcRateLimit
 */

import type { SubscriptionTier } from './ugcConfig';
import { UGC_RATE_LIMITS } from './ugcConfig';

type RateLimitAction = 'publish' | 'save' | 'import';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = { from: (table: string) => any };

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  resets_at: string; // UTC midnight ISO string
}

/**
 * レートリミットをチェックし、許可された場合は記録する。
 *
 * @param supabase - Supabase client
 * @param userId - ユーザーID
 * @param action - アクション種別
 * @param tier - サブスクリプションTier
 * @param dryRun - true の場合は記録せずにチェックのみ
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  action: RateLimitAction,
  tier: SubscriptionTier,
  dryRun = false
): Promise<RateLimitResult> {
  const limit = UGC_RATE_LIMITS[tier][action];

  // 無制限
  if (limit === -1) {
    return {
      allowed: true,
      current: 0,
      limit: -1,
      resets_at: getUtcMidnight(),
    };
  }

  // 今日の UTC 0:00
  const todayStart = getTodayUtcStart();

  // 今日のアクション回数を取得
  const { count, error } = await supabase
    .from('ugc_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('performed_at', todayStart);

  if (error) {
    throw new Error(`Rate limit check failed: ${error.message}`);
  }

  const current = count ?? 0;
  const allowed = current < limit;

  // 許可された場合、記録する（dryRun でなければ）
  if (allowed && !dryRun) {
    const { error: insertError } = await supabase
      .from('ugc_rate_limits')
      .insert({
        user_id: userId,
        action,
      });

    if (insertError) {
      throw new Error(`Rate limit record failed: ${insertError.message}`);
    }
  }

  return {
    allowed,
    current,
    limit,
    resets_at: getUtcMidnight(),
  };
}

/**
 * 今日の UTC 0:00 を ISO 文字列で返す
 */
function getTodayUtcStart(): string {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

/**
 * 次の UTC 0:00 を ISO 文字列で返す
 */
function getUtcMidnight(): string {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + 1);
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}
