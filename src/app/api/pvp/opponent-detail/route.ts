import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const targetUserId = searchParams.get('user_id');

        if (!targetUserId) {
            return NextResponse.json({ error: 'ユーザーIDが指定されていません。' }, { status: 400 });
        }

        // ゴースト対戦相手のハンドリング (ゴーストデータはフロント側でプリセットを引く想定だが、フォールバック用)
        if (targetUserId.startsWith('ghost_')) {
            return NextResponse.json({ error: 'ゴーストの詳細はローカル定義を参照してください。' }, { status: 400 });
        }

        // 特定ユーザーの防衛デッキスナップショットを1件のみピンポイント取得 (Seq Scan 回避)
        const { data: defenseParty, error } = await supabaseServer
            .from('pvp_defense_parties')
            .select('snapshot_data')
            .eq('user_id', targetUserId)
            .maybeSingle();

        if (error || !defenseParty) {
            return NextResponse.json({ error: '防衛デッキ詳細が見つかりませんでした。' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            party: defenseParty.snapshot_data
        }, {
            headers: {
                // 対戦相手の詳細スナップショット（装備・スキル）は変更頻度が極めて低いため、
                // CDNおよびブラウザで5分間キャッシュしてDBへの重複クエリを排除
                'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=120'
            }
        });
    } catch (e: any) {
        console.error('[pvp/opponent-detail] Error:', e.message);
        return NextResponse.json({ error: e.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
