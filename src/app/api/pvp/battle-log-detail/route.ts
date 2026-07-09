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
        const logId = searchParams.get('id');

        if (!logId) {
            return NextResponse.json({ error: 'ログIDが指定されていません。' }, { status: 400 });
        }

        // DBから特定のログの text_log カラムのみをピンポイント取得 (インデックススキャン)
        const { data: log, error } = await supabaseServer
            .from('pvp_battle_logs')
            .select('text_log, attacker_user_id, defender_user_id')
            .eq('id', logId)
            .single();

        if (error || !log) {
            return NextResponse.json({ error: '対戦ログ詳細が見つかりませんでした。' }, { status: 404 });
        }

        // 閲覧セキュリティガード: 自分が当事者 (攻撃側または防衛側) である場合のみ許可
        if (log.attacker_user_id !== user.id && log.defender_user_id !== user.id) {
            return NextResponse.json({ error: 'このログを閲覧する権限がありません。' }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            text_log: log.text_log || '戦闘アクションの記録はありません。'
        }, {
            headers: {
                // 確定した過去の戦闘詳細ログは絶対に不変であるため、CDN及びブラウザで1時間（3600秒）キャッシュ
                'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600'
            }
        });
    } catch (e: any) {
        console.error('[pvp/battle-log-detail] Error:', e.message);
        return NextResponse.json({ error: e.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
