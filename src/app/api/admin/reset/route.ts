process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // 0. 環境チェック — リセットは本番環境でのみ実行可能
        const vercelEnv = process.env.VERCEL_ENV || 'development';
        if (vercelEnv !== 'production') {
            return NextResponse.json(
                { error: 'リセット機能は本番環境でのみ利用可能です', environment: vercelEnv },
                { status: 403 }
            );
        }

        // 1. 認証チェック
        const adminKey = req.headers.get('x-admin-key');
        if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!supabaseServer) {
            return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 });
        }

        console.log('[Admin Reset] Initiating full database and auth user reset...');

        // 2. 依存関係のある子テーブルのデータを手動で削除（外部キー制約エラーを防止）
        // id IS NOT NULL を条件とすることで、型を問わず全件削除を強制させます。
        
        // クエスト完了履歴
        const { error: qErr } = await supabaseServer
            .from('user_completed_quests')
            .delete()
            .filter('id', 'not.is', null);
        if (qErr) {
            console.error('[Admin Reset] user_completed_quests delete error:', qErr);
            throw qErr;
        }

        // クエスト行動ログ (quest_activity_logs)
        const { error: questActErr } = await supabaseServer
            .from('quest_activity_logs')
            .delete()
            .filter('id', 'not.is', null);
        if (questActErr) {
            console.error('[Admin Reset] quest_activity_logs delete error:', questActErr);
            throw questActErr;
        }

        // 決済ログ (payment_logs)
        const { error: payLogErr } = await supabaseServer
            .from('payment_logs')
            .delete()
            .filter('id', 'not.is', null);
        if (payLogErr) {
            console.error('[Admin Reset] payment_logs delete error:', payLogErr);
            throw payLogErr;
        }

        // 評判データ
        const { error: repErr } = await supabaseServer
            .from('reputations')
            .delete()
            .filter('id', 'not.is', null);
        if (repErr) {
            console.error('[Admin Reset] reputations delete error:', repErr);
            throw repErr;
        }

        // インベントリ (所持品)
        const { error: invErr } = await supabaseServer
            .from('inventory')
            .delete()
            .filter('id', 'not.is', null);
        if (invErr) {
            console.error('[Admin Reset] inventory delete error:', invErr);
            throw invErr;
        }

        // 祈りログ (prayer_logs)
        const { error: prayErr } = await supabaseServer
            .from('prayer_logs')
            .delete()
            .filter('id', 'not.is', null);
        if (prayErr) {
            console.error('[Admin Reset] prayer_logs delete error:', prayErr);
            throw prayErr;
        }

        // 死亡履歴ログ (historical_logs)
        const { error: histErr } = await supabaseServer
            .from('historical_logs')
            .delete()
            .filter('id', 'not.is', null);
        if (histErr) {
            console.error('[Admin Reset] historical_logs delete error:', histErr);
            throw histErr;
        }

        // ロイヤリティログ (royalty_logs)
        const { error: royErr } = await supabaseServer
            .from('royalty_logs')
            .delete()
            .filter('id', 'not.is', null);
        if (royErr) {
            console.error('[Admin Reset] royalty_logs delete error:', royErr);
            throw royErr;
        }

        // ロイヤリティ日額制限ログ (royalty_daily_log)
        const { error: royDailyErr } = await supabaseServer
            .from('royalty_daily_log')
            .delete()
            .filter('id', 'not.is', null);
        if (royDailyErr) {
            console.warn('[Admin Reset] royalty_daily_log delete warning:', royDailyErr);
        }

        // パーティメンバー
        const { error: partyErr } = await supabaseServer
            .from('party_members')
            .delete()
            .filter('id', 'not.is', null);
        if (partyErr) {
            console.error('[Admin Reset] party_members delete error:', partyErr);
            throw partyErr;
        }

        // NPC雇用状態のクリア (hired_by_user_id を NULL にリセット)
        const { error: npcErr } = await supabaseServer
            .from('npcs')
            .update({ hired_by_user_id: null })
            .filter('id', 'not.is', null);
        if (npcErr) {
            console.error('[Admin Reset] npcs reset error:', npcErr);
            throw npcErr;
        }

        // 戦闘セッション
        const { error: battleErr } = await supabaseServer
            .from('battle_sessions')
            .delete()
            .filter('id', 'not.is', null);
        if (battleErr) {
            console.error('[Admin Reset] battle_sessions delete error:', battleErr);
            throw battleErr;
        }

        // 通報データ
        const { error: reportErr } = await supabaseServer
            .from('reports')
            .delete()
            .filter('id', 'not.is', null);
        if (reportErr) {
            console.error('[Admin Reset] reports delete error:', reportErr);
            throw reportErr;
        }

        // Stripe決済Webhookイベントログ
        const { error: stripeErr } = await supabaseServer
            .from('stripe_webhook_events')
            .delete()
            .filter('id', 'not.is', null);
        if (stripeErr) {
            console.error('[Admin Reset] stripe_webhook_events delete error:', stripeErr);
            throw stripeErr;
        }

        // 3. user_profiles テーブルの全削除
        const { error: profileDeleteErr } = await supabaseServer
            .from('user_profiles')
            .delete()
            .filter('id', 'not.is', null);

        if (profileDeleteErr) {
            console.error('[Admin Reset] Profile delete error:', profileDeleteErr);
            throw profileDeleteErr;
        }

        // 4. Supabase Auth ユーザーの全削除
        let authUsersDeleted = 0;
        const { data: { users }, error: listAuthError } = await supabaseServer.auth.admin.listUsers({
            perPage: 1000
        });

        if (!listAuthError && users && Array.isArray(users)) {
            for (const u of users) {
                const { error: deleteAuthErr } = await supabaseServer.auth.admin.deleteUser(u.id);
                if (!deleteAuthErr) {
                    authUsersDeleted++;
                } else {
                    console.error(`[Admin Reset] Failed to delete auth user ${u.id}:`, deleteAuthErr);
                }
            }
        }

        console.log(`[Admin Reset] Reset completed. Auth users deleted: ${authUsersDeleted}`);

        return NextResponse.json({
            success: true,
            message: `全データベーステーブル及び認証ユーザー（${authUsersDeleted}名）の一括リセットが完了しました。`
        });

    } catch (err: any) {
        console.error('[Admin Reset] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
