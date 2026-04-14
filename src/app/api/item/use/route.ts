import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { inventory_id, use_context } = body; // use_context: 'battle' | 'field'

        if (!inventory_id) {
            return NextResponse.json({ error: 'inventory_id は必須です。' }, { status: 400 });
        }

        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        // インベントリアイテムを取得
        const { data: invItem, error: fetchError } = await client
            .from('inventory')
            .select('id, quantity, item_id, items:item_id(id, slug, type, effect_data)')
            .eq('id', inventory_id)
            .eq('user_id', user.id)
            .maybeSingle();

        if (fetchError || !invItem) {
            return NextResponse.json({ error: 'アイテムが見つかりません。' }, { status: 404 });
        }

        if ((invItem.quantity || 0) <= 0) {
            return NextResponse.json({ error: 'このアイテムの所持数がありません。' }, { status: 400 });
        }

        // use_timing の整合性チェック
        const effectData = (invItem.items as any)?.effect_data || {};
        const itemTiming = effectData.use_timing || 'field';

        if (use_context === 'battle' && itemTiming !== 'battle') {
            return NextResponse.json(
                { error: 'このアイテムはバトル外でのみ使用できます。' },
                { status: 400 }
            );
        }
        if (use_context === 'field' && itemTiming === 'battle') {
            return NextResponse.json(
                { error: 'このアイテムはバトル中にのみ使用できます。' },
                { status: 400 }
            );
        }

        // 数量をデクリメント
        const newQuantity = (invItem.quantity || 1) - 1;

        if (newQuantity <= 0) {
            // 0になれば削除
            const { error: deleteError } = await client
                .from('inventory')
                .delete()
                .eq('id', inventory_id)
                .eq('user_id', user.id);
            if (deleteError) throw deleteError;
        } else {
            const { error: updateError } = await client
                .from('inventory')
                .update({ quantity: newQuantity })
                .eq('id', inventory_id)
                .eq('user_id', user.id);
            if (updateError) throw updateError;
        }

        return NextResponse.json({ success: true, new_quantity: newQuantity });

    } catch (err: any) {
        console.error('[POST /api/item/use] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
