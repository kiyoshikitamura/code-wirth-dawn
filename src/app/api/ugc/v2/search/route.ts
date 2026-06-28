process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { UGC_ENABLED } from '@/lib/ugc/ugcConfig';

/**
 * GET /api/ugc/v2/search?q=&page=1&limit=20
 *
 * UGCクエスト検索API（公開済みのみ）。
 * クエスト名またはクリエイター名でのテキスト検索。
 * 仕様: spec_v12_ugc_system_v2.md §7.1
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let dbQuery = client
      .from('ugc_scenarios')
      .select('id, slug, title, short_description, difficulty, rec_level, scenario_type, creator_id, play_count, clear_count, published_at', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // テキスト検索
    if (query.trim()) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%`);
    }

    const { data: scenarios, count, error } = await dbQuery;
    if (error) throw error;

    // クリエイター名を取得（バッチ）
    const creatorIds = [...new Set((scenarios || []).map(s => s.creator_id))];
    let creatorMap: Record<string, string> = {};
    if (creatorIds.length > 0) {
      const { data: profiles } = await client
        .from('user_profiles')
        .select('id, name')
        .in('id', creatorIds);
      if (profiles) {
        creatorMap = Object.fromEntries(profiles.map(p => [p.id, p.name || '名もなき冒険者']));
      }
    }

    // 結果にクリエイター名を付与
    const results = (scenarios || []).map(s => ({
      ...s,
      creator_name: creatorMap[s.creator_id] || '名もなき冒険者',
    }));

    // クリエイター名でのクライアント側フィルタ（DB側ilike不可のため）
    let filtered = results;
    if (query.trim() && scenarios) {
      const q = query.toLowerCase();
      filtered = results.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.creator_name.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      data: filtered,
      total: count ?? 0,
      page,
      limit,
      has_more: (count ?? 0) > offset + limit,
    });

  } catch (e: any) {
    console.error('[ugc/v2/search] Error:', e);
    return NextResponse.json({ error: e.message || 'Search failed' }, { status: 500 });
  }
}
