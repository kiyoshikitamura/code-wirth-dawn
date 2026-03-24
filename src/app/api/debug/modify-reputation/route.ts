import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { userId, locationId, amount = 100 } = await req.json();

        if (!userId) return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });

        // 現在のロケーションIDを取得（指定がない場合はプロフィールから）
        let targetLocationId = locationId;
        if (!targetLocationId) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('current_location_id')
                .eq('id', userId)
                .single();
            targetLocationId = profile?.current_location_id;
        }

        if (!targetLocationId) {
            return NextResponse.json({ error: 'ロケーションIDを特定できません' }, { status: 400 });
        }

        // 既存のレピュテーションレコードを確認
        const { data: existing } = await supabase
            .from('reputations')
            .select('id, reputation_score')
            .eq('user_id', userId)
            .eq('location_id', targetLocationId)
            .maybeSingle();

        if (existing) {
            // 更新
            const newScore = (existing.reputation_score || 0) + amount;
            const { error } = await supabase
                .from('reputations')
                .update({ reputation_score: newScore })
                .eq('id', existing.id);
            if (error) throw error;

            return NextResponse.json({
                success: true,
                message: `名声を ${amount > 0 ? '+' : ''}${amount} 変更しました。`,
                previous: existing.reputation_score,
                current: newScore
            });
        } else {
            // 新規挿入
            const { error } = await supabase
                .from('reputations')
                .insert({
                    user_id: userId,
                    location_id: targetLocationId,
                    reputation_score: amount
                });
            if (error) throw error;

            return NextResponse.json({
                success: true,
                message: `名声レコードを作成しました（${amount}）。`,
                previous: 0,
                current: amount
            });
        }
    } catch (e: any) {
        console.error('[デバッグ] 名声変更エラー:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
