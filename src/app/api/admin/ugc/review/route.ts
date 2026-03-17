import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key',
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * POST /api/admin/ugc/review
 * UGCクエストの運営審査（承認 / 却下）。
 * 仕様: spec_v12_ugc_system.md §4.2
 *
 * 認証: x-admin-secret ヘッダー（ADMIN_SECRET_KEY 環境変数と照合）
 *
 * Body: { scenario_id: string, action: 'approve' | 'reject' }
 *
 * approve: status → 'published'（税金回収）
 * reject:  status → 'draft' + パブリッシュ税を全額払い戻し
 */
export async function POST(req: Request) {
    try {
        // ─── 管理者認証 ───
        const adminSecret = req.headers.get('x-admin-secret');
        if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { scenario_id, action } = await req.json();

        if (!scenario_id || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'scenario_id と action ("approve" | "reject") は必須です。' },
                { status: 400 }
            );
        }

        // ─── シナリオを取得 ───
        const { data: quest, error: questErr } = await supabaseAdmin
            .from('scenarios')
            .select('id, status, creator_id, rewards')
            .eq('id', scenario_id)
            .single();

        if (questErr || !quest) {
            return NextResponse.json({ error: 'シナリオが見つかりません。' }, { status: 404 });
        }

        if (quest.status !== 'pending_review') {
            return NextResponse.json({
                error: `このシナリオは審査待ち（pending_review）状態ではありません。現在のステータス: ${quest.status}`,
            }, { status: 400 });
        }

        if (action === 'approve') {
            // ─── 承認: published に更新 ───
            const { error: updateErr } = await supabaseAdmin
                .from('scenarios')
                .update({ status: 'published' })
                .eq('id', scenario_id);

            if (updateErr) throw updateErr;

            return NextResponse.json({
                success: true,
                action: 'approve',
                new_status: 'published',
            });

        } else {
            // ─── 却下: draft に戻す + パブリッシュ税を全額払い戻し ───

            // 1. シナリオを draft に戻す
            const { error: updateErr } = await supabaseAdmin
                .from('scenarios')
                .update({ status: 'draft' })
                .eq('id', scenario_id);

            if (updateErr) throw updateErr;

            // 2. パブリッシュ税の計算（申請時と同じ計算式）
            const ugcItem = quest.rewards?.ugc_item;
            const itemValue = ugcItem?.base_price ?? 500;
            const refundAmount = 100 + itemValue;

            // 3. クリエイターの gold を取得して払い戻し
            const { data: creatorProfile, error: profileErr } = await supabaseAdmin
                .from('user_profiles')
                .select('gold')
                .eq('id', quest.creator_id)
                .single();

            if (profileErr || !creatorProfile) {
                // プロフィールが取得できなくてもシナリオは draft に戻す（払い戻しのみスキップ）
                console.error('[admin/ugc/review] Creator profile not found for refund:', quest.creator_id);
                return NextResponse.json({
                    success: true,
                    action: 'reject',
                    new_status: 'draft',
                    warning: 'パブリッシュ税の払い戻しに失敗しました。手動対応が必要です。',
                });
            }

                const { error: goldErr } = await supabaseAdmin
                    .rpc('increment_gold', { p_user_id: quest.creator_id, p_amount: refundAmount });

            if (goldErr) {
                console.error('[admin/ugc/review] Gold refund error:', goldErr);
            }

            return NextResponse.json({
                success: true,
                action: 'reject',
                new_status: 'draft',
                refunded: refundAmount,
                creator_id: quest.creator_id,
            });
        }

    } catch (err: any) {
        console.error('[admin/ugc/review] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
