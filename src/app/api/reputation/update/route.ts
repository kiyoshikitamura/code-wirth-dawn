import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reputation/update
 * シナリオ進行中の名声変動を即時反映するAPI。
 * Body: { amount: number, locationName?: string }
 * Authorization: Bearer <jwt> (必須)
 */
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
        }

        const { amount, locationName } = await req.json();
        if (typeof amount !== 'number' || amount === 0) {
            return NextResponse.json({ error: '有効な amount を指定してください' }, { status: 400 });
        }

        // ロケーション名を取得（指定がなければ現在地から）
        let targetLocationName = locationName;
        if (!targetLocationName) {
            const { data: profile } = await supabaseService
                .from('user_profiles')
                .select('current_location_id')
                .eq('id', user.id)
                .single();

            if (profile?.current_location_id) {
                const { data: locData } = await supabaseService
                    .from('locations')
                    .select('name')
                    .eq('id', profile.current_location_id)
                    .maybeSingle();
                targetLocationName = locData?.name;
            }
        }

        if (!targetLocationName) {
            return NextResponse.json({ error: 'ロケーション名を特定できません' }, { status: 400 });
        }

        // 既存レピュテーションを検索
        const { data: existing } = await supabaseService
            .from('reputations')
            .select('id, score')
            .eq('user_id', user.id)
            .eq('location_name', targetLocationName)
            .maybeSingle();

        let previousScore = 0;
        let newScore = amount;

        if (existing) {
            previousScore = existing.score || 0;
            newScore = previousScore + amount;
            const { error } = await supabaseService
                .from('reputations')
                .update({ score: newScore })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabaseService
                .from('reputations')
                .insert({
                    user_id: user.id,
                    location_name: targetLocationName,
                    score: newScore,
                });
            if (error) throw error;
        }

        console.log(`[Reputation] ${user.id} @ ${targetLocationName}: ${previousScore} → ${newScore} (${amount > 0 ? '+' : ''}${amount})`);

        return NextResponse.json({
            success: true,
            location: targetLocationName,
            previous: previousScore,
            current: newScore,
            delta: amount,
        });

    } catch (e: any) {
        console.error('[Reputation Update] エラー:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
