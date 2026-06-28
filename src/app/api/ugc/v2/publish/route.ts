process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { checkRateLimit } from '@/lib/ugc/ugcRateLimit';
import { UGC_ENABLED, UGC_ASSET_LIMITS, type SubscriptionTier } from '@/lib/ugc/ugcConfig';

/**
 * POST /api/ugc/v2/publish
 *
 * UGCクエストの審査申請（draft → pending_review）。
 * v2: パブリッシュ税を廃止し、レートリミットに変更。
 * 仕様: spec_v12_ugc_system_v2.md §5.4
 *
 * Body: { scenario_id: string }
 */
export async function POST(request: Request) {
  try {
    if (!UGC_ENABLED) {
      return NextResponse.json({ error: 'UGC機能は現在無効です。' }, { status: 403 });
    }

    const client = createAuthClient(request);
    const { data: { user }, error: authErr } = await client.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    const body = await request.json();
    const { scenario_id } = body;

    if (!scenario_id) {
      return NextResponse.json({ error: 'scenario_id が必要です。' }, { status: 400 });
    }

    // シナリオ取得（所有者・状態確認）
    const { data: scenario, error: fetchErr } = await client
      .from('ugc_scenarios')
      .select('id, status, creator_id, tested_at')
      .eq('id', scenario_id)
      .eq('creator_id', user.id)
      .single();

    if (fetchErr || !scenario) {
      return NextResponse.json({ error: 'クエストが見つかりません。' }, { status: 404 });
    }

    if (scenario.status !== 'draft') {
      return NextResponse.json({ error: 'このクエストは既に審査申請済みです。' }, { status: 400 });
    }

    // テストプレイ必須チェック
    if (!scenario.tested_at) {
      return NextResponse.json({
        error: '公開申請の前にテストプレイでクリアを確認してください。',
      }, { status: 400 });
    }

    // Tier取得
    const { data: profile } = await client
      .from('user_profiles')
      .select('subscription_tier, ugc_extra_published')
      .eq('id', user.id)
      .single();
    const tier: SubscriptionTier = (profile?.subscription_tier as SubscriptionTier) ?? 'free';

    // 公開枠チェック（extra枠を加算）
    const basePublishLimit = UGC_ASSET_LIMITS[tier].published;
    const extraPublished = profile?.ugc_extra_published || 0;
    const publishLimit = basePublishLimit + extraPublished;
    if (basePublishLimit !== -1) {
      const { count } = await client
        .from('ugc_scenarios')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('status', 'published');

      if ((count ?? 0) >= publishLimit) {
        return NextResponse.json({
          error: `公開枠の上限（${publishLimit}件）に達しています。既存のクエストをアーカイブしてください。`,
          limit: publishLimit,
          current: count,
        }, { status: 403 });
      }
    }

    // レートリミットチェック（パブリッシュ税の代替）
    const rl = await checkRateLimit(client, user.id, 'publish', tier);
    if (!rl.allowed) {
      return NextResponse.json({
        error: `公開申請の1日あたりの上限（${rl.limit}回）に達しています。`,
        rate_limit: rl,
      }, { status: 429 });
    }

    // ステータス更新
    const { error: updateErr } = await client
      .from('ugc_scenarios')
      .update({ status: 'pending_review' })
      .eq('id', scenario_id)
      .eq('creator_id', user.id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, status: 'pending_review' });

  } catch (e: any) {
    console.error('[ugc/v2/publish] Error:', e);
    return NextResponse.json({ error: e.message || 'Publish failed' }, { status: 500 });
  }
}
