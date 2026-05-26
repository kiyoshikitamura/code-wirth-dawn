import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { UGC_ENABLED } from '@/lib/ugc/ugcConfig';

/**
 * POST /api/admin/ugc/review
 *
 * 管理者によるUGCクエスト審査API。
 * pending_review → published / rejected
 * 仕様: spec_v12_ugc_system_v2.md §10.1
 *
 * Body: { scenario_id: string, action: 'approve' | 'reject', reason?: string }
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

    // 管理者権限チェック
    const { data: profile } = await client
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: '管理者権限が必要です。' }, { status: 403 });
    }

    const body = await request.json();
    const { scenario_id, action, reason } = body;

    if (!scenario_id || !action) {
      return NextResponse.json({ error: 'scenario_id と action が必要です。' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action は approve / reject のいずれかです。' }, { status: 400 });
    }

    // シナリオ取得
    const { data: scenario, error: fetchErr } = await client
      .from('ugc_scenarios')
      .select('id, status')
      .eq('id', scenario_id)
      .single();

    if (fetchErr || !scenario) {
      return NextResponse.json({ error: 'クエストが見つかりません。' }, { status: 404 });
    }

    if (scenario.status !== 'pending_review') {
      return NextResponse.json({
        error: '審査対象は pending_review 状態のクエストのみです。',
      }, { status: 400 });
    }

    if (action === 'approve') {
      const { error: updateErr } = await client
        .from('ugc_scenarios')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          rejected_reason: null,
        })
        .eq('id', scenario_id);

      if (updateErr) throw updateErr;
      return NextResponse.json({ success: true, status: 'published' });
    }

    if (action === 'reject') {
      if (!reason) {
        return NextResponse.json({ error: '却下理由が必要です。' }, { status: 400 });
      }

      const { error: updateErr } = await client
        .from('ugc_scenarios')
        .update({
          status: 'rejected',
          rejected_reason: reason,
        })
        .eq('id', scenario_id);

      if (updateErr) throw updateErr;
      return NextResponse.json({ success: true, status: 'rejected' });
    }

  } catch (e: any) {
    console.error('[admin/ugc/review] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
