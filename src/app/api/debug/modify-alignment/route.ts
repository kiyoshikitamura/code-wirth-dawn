import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 属性値（秩序/混沌/正義/悪意）を変更するデバッグ用API
export async function POST(req: Request) {
    try {
        const { userId, type, amount = 10 } = await req.json();

        if (!userId) return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });

        // 属性タイプのバリデーション
        const columnMap: Record<string, string> = {
            order: 'order_pts',
            chaos: 'chaos_pts',
            justice: 'justice_pts',
            evil: 'evil_pts'
        };

        const column = columnMap[type];
        if (!column) {
            return NextResponse.json({
                error: `無効な属性タイプ: ${type}。有効値: order, chaos, justice, evil`
            }, { status: 400 });
        }

        // 現在値を取得
        const { data: profile, error: fetchError } = await supabase
            .from('user_profiles')
            .select(column)
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
        }

        const currentVal = (profile as any)[column] || 0;
        const newVal = Math.max(0, currentVal + amount); // 0未満にはしない

        // 更新
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ [column]: newVal })
            .eq('id', userId);

        if (updateError) throw updateError;

        const typeLabel: Record<string, string> = {
            order: '秩序', chaos: '混沌', justice: '正義', evil: '悪意'
        };

        return NextResponse.json({
            success: true,
            message: `${typeLabel[type]}を ${amount > 0 ? '+' : ''}${amount} 変更しました。`,
            type,
            previous: currentVal,
            current: newVal
        });
    } catch (e: any) {
        console.error('[デバッグ] 属性値変更エラー:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
