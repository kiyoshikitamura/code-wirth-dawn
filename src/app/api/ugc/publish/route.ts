import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';

/**
 * POST /api/ugc/publish
 * 
 * UGCクエストの審査申請（draft → pending_review）。
 * 仕様: spec_v12_ugc_system.md §4.2
 * 
 * 処理フロー:
 * 1. シナリオが draft 状態であることを確認
 * 2. 報酬アイテム（ugc_item）の base_price からパブリッシュ税を算出
 *    - 税額 = ugc_item.base_price + 100G（基本税）
 *    - ugc_item.base_price が未設定の場合は 500G をフォールバックとして使用
 * 3. user_profiles.gold から税を仮引き落とし
 * 4. scenarios.status を pending_review に更新
 * 5. シナリオ更新に失敗した場合はゴールドをロールバック
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, userId } = body;

        if (!userId || !id) {
            return NextResponse.json({ error: 'Unauthorized or Missing ID' }, { status: 401 });
        }

        const client = createAuthClient(request);

        // 1. シナリオを取得して状態・所有者を確認
        const { data: quest, error: questErr } = await client
            .from('scenarios')
            .select('id, status, creator_id, rewards')
            .eq('id', id)
            .eq('creator_id', userId)
            .single();

        if (questErr || !quest) {
            return NextResponse.json({ error: 'クエストが見つかりません。' }, { status: 404 });
        }
        if (quest.status !== 'draft') {
            return NextResponse.json({ error: 'このクエストは既に審査申請済みです。' }, { status: 400 });
        }

        // ─── タスク3: 公開枠チェック（仕様: spec_v13 §4, spec_v12 §5.1） ───
        const { data: profile0, error: profileCheck0Err } = await client
            .from('user_profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .single();

        if (profileCheck0Err || !profile0) {
            return NextResponse.json({ error: 'ユーザー情報が見つかりません。' }, { status: 404 });
        }

        const tier = profile0.subscription_tier ?? 'free';
        const publishLimit = tier === 'premium' ? 20 : tier === 'basic' ? 5 : 1;

        const { count: publishedCount, error: countErr } = await client
            .from('scenarios')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', userId)
            .eq('status', 'published');

        if (countErr) throw countErr;
        if ((publishedCount ?? 0) >= publishLimit) {
            return NextResponse.json({
                error: `公開枠の上限（${publishLimit}件）に達しています。既存の公開クエストをアーカイブしてから申請してください。`,
                limit: publishLimit,
                current: publishedCount,
            }, { status: 403 });
        }

        // 2. パブリッシュ税の計算（仕様: spec_v7_lifecycle_economy.md §5.3）
        // 報酬UGCアイテムの price を税の基準とする。未設定の場合は 500G をフォールバック
        const ugcItem = quest.rewards?.ugc_item;
        const itemValue = ugcItem?.price ?? 500;
        const publishTax = 100 + itemValue; // 基本税 100G + アイテム価値

        // 3. user_profiles からクリエイターのゴールドを取得
        const { data: profile, error: profileErr } = await client
            .from('user_profiles')
            .select('gold')
            .eq('id', userId)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: 'ユーザー情報が見つかりません。' }, { status: 404 });
        }

        // 4. ゴールド残高チェック（不足時は 400 Bad Request）
        if (profile.gold < publishTax) {
            return NextResponse.json({
                error: `ゴールドが不足しています。パブリッシュ税: ${publishTax} G（現在の所持金: ${profile.gold} G）`,
                required: publishTax,
                current_gold: profile.gold
            }, { status: 400 });
        }

        // 5. ゴールドを仮引き落とし
        const { error: goldErr } = await client
            .rpc('increment_gold', { p_user_id: userId, p_amount: -publishTax });

        if (goldErr) throw goldErr;

        // 6. シナリオのステータスを pending_review に更新
        const { error: statusErr } = await client
            .from('scenarios')
            .update({ status: 'pending_review' })
            .eq('id', id)
            .eq('creator_id', userId);

        if (statusErr) {
            // ロールバック: ゴールドを元に戻す
            await client
                .rpc('increment_gold', { p_user_id: userId, p_amount: publishTax });
            throw statusErr;
        }

        return NextResponse.json({
            success: true,
            tax: publishTax,
            new_gold: profile.gold - publishTax
        });

    } catch (e: any) {
        console.error('Publish API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
