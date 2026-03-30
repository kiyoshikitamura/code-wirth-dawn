import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 属性値（秩序/混沌/正義/悪意）を変更するデバッグ用API
// world_states テーブルの対応カラムを直接更新する
export async function POST(req: Request) {
    try {
        const { userId, type, amount = 10 } = await req.json();

        if (!userId) return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });

        // 属性タイプのバリデーション
        // user_profiles 側のカラム
        const userColumnMap: Record<string, string> = {
            order: 'order_pts',
            chaos: 'chaos_pts',
            justice: 'justice_pts',
            evil: 'evil_pts'
        };
        // world_states 側のカラム
        const worldColumnMap: Record<string, string> = {
            order: 'order_score',
            chaos: 'chaos_score',
            justice: 'justice_score',
            evil: 'evil_score'
        };

        const userColumn = userColumnMap[type];
        const worldColumn = worldColumnMap[type];
        if (!userColumn || !worldColumn) {
            return NextResponse.json({
                error: `無効な属性タイプ: ${type}。有効値: order, chaos, justice, evil`
            }, { status: 400 });
        }

        // 1. user_profiles の値を更新
        const { data: profile, error: fetchError } = await supabase
            .from('user_profiles')
            .select(userColumn)
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
        }

        const currentVal = (profile as any)[userColumn] || 0;
        const newVal = Math.max(0, currentVal + amount);

        await supabase
            .from('user_profiles')
            .update({ [userColumn]: newVal })
            .eq('id', userId);

        // 2. 現在の拠点の world_states も同時に更新
        const { data: userLoc } = await supabase
            .from('user_profiles')
            .select('current_location_id, locations:locations!user_profiles_current_location_id_fkey(name)')
            .eq('id', userId)
            .single();

        let locationName = '国境の町'; // fallback
        if (userLoc?.locations && (userLoc.locations as any).name) {
            locationName = (userLoc.locations as any).name;
        }

        // world_states の現在値を取得して更新
        const { data: ws } = await supabase
            .from('world_states')
            .select(worldColumn)
            .eq('location_name', locationName)
            .single();

        if (ws) {
            const wsCurrentVal = (ws as any)[worldColumn] || 0;
            const wsNewVal = Math.max(0, wsCurrentVal + amount);
            await supabase
                .from('world_states')
                .update({ [worldColumn]: wsNewVal })
                .eq('location_name', locationName);
        }

        const typeLabel: Record<string, string> = {
            order: '秩序', chaos: '混沌', justice: '正義', evil: '悪意'
        };

        return NextResponse.json({
            success: true,
            message: `${typeLabel[type]}を ${amount > 0 ? '+' : ''}${amount} 変更しました。`,
            type,
            previous: currentVal,
            current: newVal,
            location: locationName
        });
    } catch (e: any) {
        console.error('[デバッグ] 属性値変更エラー:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
