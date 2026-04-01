import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/inventory/grant
 * クエスト中間報酬としてアイテムやゴールドをプレイヤーに直接付与するAPI。
 * Body: { items?: { item_id: number, quantity: number }[], gold?: number }
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

        const { items, gold } = await req.json();
        const grantedItems: { item_id: number; name: string; quantity: number }[] = [];

        // アイテム付与
        if (items && Array.isArray(items)) {
            for (const grant of items) {
                const { item_id, quantity = 1 } = grant;
                if (!item_id || quantity <= 0) continue;

                // アイテム名を取得
                const { data: itemData } = await supabaseService
                    .from('items')
                    .select('name')
                    .eq('id', item_id)
                    .maybeSingle();

                // 既存のインベントリ行を確認
                const { data: existing } = await supabaseService
                    .from('inventory')
                    .select('id, quantity')
                    .eq('user_id', user.id)
                    .eq('item_id', item_id)
                    .limit(1)
                    .maybeSingle();

                if (existing) {
                    // 既存行の数量を加算
                    await supabaseService
                        .from('inventory')
                        .update({ quantity: existing.quantity + quantity })
                        .eq('id', existing.id);
                } else {
                    // 新規行を挿入
                    await supabaseService
                        .from('inventory')
                        .insert({
                            user_id: user.id,
                            item_id,
                            quantity,
                            is_equipped: false,
                        });
                }

                grantedItems.push({
                    item_id,
                    name: itemData?.name || `item_${item_id}`,
                    quantity,
                });
            }
        }

        // ゴールド付与
        let goldGranted = 0;
        if (gold && gold > 0) {
            const { data: profile } = await supabaseService
                .from('user_profiles')
                .select('gold')
                .eq('id', user.id)
                .single();

            if (profile) {
                const newGold = (profile.gold || 0) + gold;
                await supabaseService
                    .from('user_profiles')
                    .update({ gold: newGold })
                    .eq('id', user.id);
                goldGranted = gold;
            }
        }

        console.log(`[Grant] ${user.id}: items=${JSON.stringify(grantedItems)}, gold=+${goldGranted}`);

        return NextResponse.json({
            success: true,
            items: grantedItems,
            gold: goldGranted,
        });

    } catch (e: any) {
        console.error('[Inventory Grant] エラー:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
