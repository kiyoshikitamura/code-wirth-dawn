import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';

/**
 * POST /api/profile/reset
 * 認証済ユーザーの全キャラクターデータを削除する（リセット）。
 * タイトル画面のキャラクター削除フローから呼び出される。
 *
 * 戦略:
 *   1. 既知のテーブルを明示的に削除（FK 依存順）
 *   2. 動的 FK スキャンで未知のテーブルもカバー
 *   3. 最後に user_profiles を削除
 */
export async function POST(req: Request) {
    try {
        // セッション検証 (Authorization ヘッダーから Bearer トークンを取得)
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        // トークンでユーザーを特定
        const { data: { user }, error: userError } = await supabaseService.auth.getUser(token);
        if (userError || !user) {
            return NextResponse.json({ error: '認証セッションが無効です' }, { status: 401 });
        }

        const userId = user.id;
        console.log(`[profile/reset] Resetting character for user: ${userId}`);

        // プロファイルの存在確認
        const { data: profile } = await supabaseService
            .from('user_profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (!profile) {
            return NextResponse.json({ error: 'キャラクターが見つかりません' }, { status: 404 });
        }

        // --- 既知テーブルを明示的に削除 (FK 依存順) ---
        // エラーがあっても次のテーブルに進む（最終的に profile 削除で成否を判定）

        // helper: 安全にテーブルのレコードを削除（テーブル不存在でもクラッシュしない）
        const safeDelete = async (table: string, column: string) => {
            try {
                const { error } = await supabaseService.from(table).delete().eq(column, userId);
                if (error) console.error(`[reset] ${table} delete error:`, error.message);
            } catch (e: any) {
                console.warn(`[reset] ${table} delete skipped:`, e.message);
            }
        };

        // helper: SET NULL（他ユーザーが雇っている影の source_user_id 参照を外す）
        const safeNullify = async (table: string, column: string) => {
            try {
                const { error } = await supabaseService
                    .from(table)
                    .update({ [column]: null })
                    .eq(column, userId);
                if (error) console.error(`[reset] ${table}.${column} nullify error:`, error.message);
            } catch (e: any) {
                console.warn(`[reset] ${table}.${column} nullify skipped:`, e.message);
            }
        };

        // 1. 歴史ログ（user_id → user_profiles FK, CASCADE なし）
        await safeDelete('historical_logs', 'user_id');

        // 2. ロイヤリティログ（source_user_id, target_user_id → user_profiles FK）
        await safeDelete('royalty_logs', 'source_user_id');
        await safeDelete('royalty_logs', 'target_user_id');

        // 3. パーティメンバー.source_user_id（他ユーザーの傭兵が参照, NULL化）
        await safeNullify('party_members', 'source_user_id');

        // 4. パーティメンバー（owner_id → user_profiles FK）
        await safeDelete('party_members', 'owner_id');

        // 5. インベントリ
        await safeDelete('inventory', 'user_id');

        // 6. 名声データ
        await safeDelete('reputations', 'user_id');

        // 7. 祈りログ
        await safeDelete('prayer_logs', 'user_id');

        // 8. 装備品
        await safeDelete('equipped_items', 'user_id');

        // 9. スキル
        await safeDelete('user_skills', 'user_id');

        // 10. クエスト進捗
        await safeDelete('quest_progress', 'user_id');

        // 11. クエスト完了履歴（メインシナリオ main_ep* のクリア記録は継承後も保持）
        try {
            // メインシナリオのIDを取得してから、それ以外を削除
            const { data: mainScenarios } = await supabaseService
                .from('scenarios')
                .select('id')
                .like('slug', 'main_ep%');
            const mainIds = (mainScenarios || []).map((s: any) => s.id);
            if (mainIds.length > 0) {
                // メインシナリオ以外のクリア記録を削除
                const { error } = await supabaseService
                    .from('user_completed_quests')
                    .delete()
                    .eq('user_id', userId)
                    .not('scenario_id', 'in', `(${mainIds.join(',')})`);
                if (error) console.error('[reset] user_completed_quests selective delete error:', error.message);
            } else {
                // メインシナリオが無い場合は全削除
                await safeDelete('user_completed_quests', 'user_id');
            }
        } catch (e: any) {
            console.warn('[reset] user_completed_quests selective delete failed, falling back:', e.message);
            await safeDelete('user_completed_quests', 'user_id');
        }

        // 12. ハブ状態
        await safeDelete('user_hub_states', 'user_id');

        // 13. ワールドビュー
        await safeDelete('user_world_views', 'user_id');

        // 14. ロイヤリティ日次ログ
        await safeDelete('royalty_daily_log', 'user_id');

        // 15. 引退キャラクター
        await safeDelete('retired_characters', 'user_id');

        // 16. バトルセッション
        await safeDelete('battle_sessions', 'user_id');

        // --- 動的 FK スキャン: user_profiles.id を参照する全テーブルを発見して削除 ---
        // SQL で information_schema を問い合わせ、まだ残っている FK 参照を動的に解決する
        try {
            const { data: fkRows, error: fkError } = await supabaseService.rpc('get_user_profile_fk_tables');
            if (!fkError && fkRows && fkRows.length > 0) {
                for (const row of fkRows) {
                    console.log(`[reset] Dynamic FK cleanup: ${row.child_table}.${row.child_column}`);
                    await safeDelete(row.child_table, row.child_column);
                }
            }
        } catch (e: any) {
            // RPC が存在しない場合はスキップ（明示削除でカバー済み）
            console.warn('[reset] Dynamic FK scan skipped (RPC not available):', e.message);
        }

        // 17. ユーザープロファイル（最後に削除）
        const { error: profileError } = await supabaseService
            .from('user_profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            console.error('[reset] profile delete error:', profileError);
            return NextResponse.json({ error: `プロファイル削除失敗: ${profileError.message}` }, { status: 500 });
        }

        console.log(`[profile/reset] Successfully reset character for user: ${userId}`);
        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error('[profile/reset] unexpected error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
