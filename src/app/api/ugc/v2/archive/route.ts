import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { UGC_ENABLED } from '@/lib/ugc/ugcConfig';

/**
 * POST /api/ugc/v2/archive
 *
 * 公開中クエストのアーカイブ（published → draft）。
 * 仕様: spec_v12_ugc_system_v2.md §5.5
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

    // シナリオ取得
    const { data: scenario, error: fetchErr } = await client
      .from('ugc_scenarios')
      .select('id, status, creator_id')
      .eq('id', scenario_id)
      .eq('creator_id', user.id)
      .single();

    if (fetchErr || !scenario) {
      return NextResponse.json({ error: 'クエストが見つかりません。' }, { status: 404 });
    }

    if (scenario.status !== 'published' && scenario.status !== 'pending_review') {
      return NextResponse.json({
        error: 'アーカイブできるのは公開中/審査中のクエストのみです。',
      }, { status: 400 });
    }

    // draft に戻す
    const { error: updateErr } = await client
      .from('ugc_scenarios')
      .update({
        status: 'draft',
        published_at: null,
      })
      .eq('id', scenario_id)
      .eq('creator_id', user.id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, status: 'draft' });

  } catch (e: any) {
    console.error('[ugc/v2/archive] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
