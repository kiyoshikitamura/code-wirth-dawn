import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ugc/archive
 * 公開中のクエストを非公開（unpublished）に移行する。
 * 仕様: spec_v12_ugc_system.md §4.2, §5.1
 *
 * - アーカイブ枠チェック: free=3, basic=10, premium=50 (spec_v13 §4)
 * - パブリッシュ税の払い戻しは行わない
 *
 * Body: { scenario_id: string, userId: string }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        let userId = body.userId;
        const authHeader = req.headers.get('authorization');
        
        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        const { scenario_id } = body;

        if (!scenario_id || !userId) {
            return NextResponse.json({ error: 'scenario_id と 認証情報 は必須です。' }, { status: 400 });
        }

        // 1. シナリオを取得・所有者・ステータス確認
        const { data: quest, error: questErr } = await supabase
            .from('scenarios')
            .select('id, status, creator_id')
            .eq('id', scenario_id)
            .eq('creator_id', userId)
            .single();

        if (questErr || !quest) {
            return NextResponse.json({ error: 'クエストが見つかりません。' }, { status: 404 });
        }
        if (quest.status !== 'published') {
            return NextResponse.json(
                { error: '非公開にできるのは公開済み（published）のクエストのみです。' },
                { status: 400 }
            );
        }

        // 2. アーカイブ枠チェック
        const { data: profile, error: profileErr } = await supabase
            .from('user_profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: 'ユーザー情報が見つかりません。' }, { status: 404 });
        }

        const tier = profile.subscription_tier ?? 'free';
        const archiveLimit = tier === 'premium' ? 50 : tier === 'basic' ? 10 : 3;

        const { count: archivedCount, error: countErr } = await supabase
            .from('scenarios')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', userId)
            .eq('status', 'unpublished');

        if (countErr) throw countErr;
        if ((archivedCount ?? 0) >= archiveLimit) {
            return NextResponse.json({
                error: `アーカイブ枠の上限（${archiveLimit}件）に達しています。既存のアーカイブを削除してから非公開にしてください。`,
                limit: archiveLimit,
                current: archivedCount,
            }, { status: 403 });
        }

        // 3. ステータスを unpublished に更新（払い戻しなし）
        const { error: updateError } = await supabase
            .from('scenarios')
            .update({ status: 'unpublished' })
            .eq('id', scenario_id)
            .eq('creator_id', userId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('[ugc/archive] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
