import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { UGC_ENABLED } from '@/lib/ugc/ugcConfig';

/**
 * GET /api/ugc/v2/list — マイ作品一覧
 * DELETE /api/ugc/v2/list — 作品削除
 *
 * 仕様: spec_v12_ugc_system_v2.md §5.6
 */

export async function GET(request: Request) {
  try {
    if (!UGC_ENABLED) {
      return NextResponse.json({ error: 'UGC機能は現在無効です。' }, { status: 403 });
    }

    const client = createAuthClient(request);
    const { data: { user }, error: authErr } = await client.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    const { data: scenarios, error } = await client
      .from('ugc_scenarios')
      .select('id, slug, title, short_description, status, difficulty, rec_level, scenario_type, play_count, clear_count, tested_at, published_at, rejected_reason, created_at, updated_at')
      .eq('creator_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: scenarios || [] });

  } catch (e: any) {
    console.error('[ugc/v2/list] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

    // draft or rejected のみ削除可能
    const { data: scenario } = await client
      .from('ugc_scenarios')
      .select('id, status')
      .eq('id', scenario_id)
      .eq('creator_id', user.id)
      .single();

    if (!scenario) {
      return NextResponse.json({ error: 'クエストが見つかりません。' }, { status: 404 });
    }

    if (!['draft', 'rejected'].includes(scenario.status)) {
      return NextResponse.json({
        error: '公開中/審査中のクエストは削除できません。先にアーカイブしてください。',
      }, { status: 400 });
    }

    // 関連データ削除（カスケードでugc_enemies等も消える）
    const { error: delErr } = await client
      .from('ugc_scenarios')
      .delete()
      .eq('id', scenario_id)
      .eq('creator_id', user.id);

    if (delErr) throw delErr;

    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error('[ugc/v2/list] DELETE Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
