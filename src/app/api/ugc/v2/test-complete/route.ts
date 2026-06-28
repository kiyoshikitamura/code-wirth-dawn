process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { UGC_ENABLED } from '@/lib/ugc/ugcConfig';

/**
 * POST /api/ugc/v2/test-complete
 *
 * テストプレイ成功時に ugc_scenarios.tested_at を記録する。
 * クリエイター本人のdraftシナリオのみ許可。
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

    if (!scenario_id || typeof scenario_id !== 'string') {
      return NextResponse.json({ error: 'scenario_id が必要です。' }, { status: 400 });
    }

    // ── シナリオ取得＆権限チェック
    const { data: scenario, error: fetchErr } = await client
      .from('ugc_scenarios')
      .select('id, creator_id, status, tested_at')
      .eq('id', scenario_id)
      .single();

    if (fetchErr || !scenario) {
      return NextResponse.json({ error: 'シナリオが見つかりません。' }, { status: 404 });
    }

    if (scenario.creator_id !== user.id) {
      return NextResponse.json({ error: '自分のシナリオのみテスト完了を記録できます。' }, { status: 403 });
    }

    if (scenario.status !== 'draft') {
      return NextResponse.json({ error: 'ドラフト状態のシナリオのみテスト完了を記録できます。' }, { status: 400 });
    }

    // ── tested_at を更新
    const { error: updateErr } = await client
      .from('ugc_scenarios')
      .update({ tested_at: new Date().toISOString() })
      .eq('id', scenario_id)
      .eq('creator_id', user.id);

    if (updateErr) {
      console.error('[ugc/v2/test-complete] update error:', updateErr);
      throw new Error(updateErr.message);
    }

    return NextResponse.json({
      success: true,
      tested_at: new Date().toISOString(),
    });

  } catch (e: any) {
    console.error('[ugc/v2/test-complete] Error:', e);
    return NextResponse.json({ error: e.message || 'Test complete failed' }, { status: 500 });
  }
}
