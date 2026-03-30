import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { userId, locationId, locationName, amount = 100 } = await req.json();

        if (!userId) return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });

        // 現在のロケーション名を取得（指定がない場合はプロフィール→locationから）
        let targetLocationName = locationName;
        let targetLocationId = locationId;

        if (!targetLocationName) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('current_location_id')
                .eq('id', userId)
                .single();

            targetLocationId = profile?.current_location_id;

            // location_idから名前を取得
            if (targetLocationId) {
                const { data: locData } = await supabase
                    .from('locations')
                    .select('name')
                    .eq('id', targetLocationId)
                    .maybeSingle();
                targetLocationName = locData?.name;
            }
        }

        if (!targetLocationName) {
            return NextResponse.json({ error: 'ロケーション名を特定できません' }, { status: 400 });
        }

        // 既存のレピュテーションレコードを確認 (location_name ベース)
        const { data: existing } = await supabase
            .from('reputations')
            .select('id, score')
            .eq('user_id', userId)
            .eq('location_name', targetLocationName)
            .maybeSingle();

        if (existing) {
            // 更新
            const newScore = (existing.score || 0) + amount;
            const { error } = await supabase
                .from('reputations')
                .update({ score: newScore })
                .eq('id', existing.id);
            if (error) throw error;

            return NextResponse.json({
                success: true,
                message: `名声を ${amount > 0 ? '+' : ''}${amount} 変更しました。`,
                previous: existing.score,
                current: newScore
            });
        } else {
            // 新規挿入
            const insertData: any = {
                user_id: userId,
                location_name: targetLocationName,
                score: amount,
                rank: amount >= 300 ? 'Hero' : amount >= 0 ? 'Stranger' : 'Rogue',
            };

            const { error } = await supabase
                .from('reputations')
                .insert(insertData);
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
