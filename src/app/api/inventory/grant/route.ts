process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// [Security v27.3] 付与上限定数
const MAX_GOLD_PER_GRANT = 50000;
const MAX_ITEMS_PER_GRANT = 10;
const MAX_ITEM_QUANTITY = 5;

/**
 * POST /api/inventory/grant
 * クエスト中間報酬としてアイテムやゴールドをプレイヤーに直接付与するAPI。
 * Body: { items?: { item_id: number, quantity: number }[], gold?: number }
 * Authorization: Bearer <jwt> (必須)
 * 
 * [Security v27.3] サーバーサイド検証:
 * - ゴールド上限: 1リクエストあたり最大 50,000G
 * - アイテム上限: 1リクエストあたり最大 10種類、各最大5個
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
        console.log('[Grant] Received items:', JSON.stringify(items), 'gold:', gold);
        const grantedItems: { item_id: number; name: string; quantity: number }[] = [];

        // アイテム付与
        if (items && Array.isArray(items)) {
            // [Security v27.3] アイテム種類数上限
            const safeItems = items.slice(0, MAX_ITEMS_PER_GRANT);

            for (const grant of safeItems) {
                // 正規化: "601" (string/number) → {item_id: 601, quantity: 1}
                let item_id: number;
                let quantity: number = 1;
                if (typeof grant === 'string' || typeof grant === 'number') {
                    item_id = parseInt(String(grant), 10);
                } else {
                    item_id = grant.item_id;
                    quantity = grant.quantity || 1;
                }
                console.log('[Grant] Processing item_id:', item_id, 'quantity:', quantity, 'raw:', JSON.stringify(grant));
                if (!item_id || isNaN(item_id) || quantity <= 0) continue;

                // [Security v27.3] 個別数量上限
                quantity = Math.min(quantity, MAX_ITEM_QUANTITY);

                // アイテム名と種別を取得
                const { data: itemData } = await supabaseService
                    .from('items')
                    .select('name, type')
                    .eq('id', item_id)
                    .maybeSingle();

                const isEquipment = itemData?.type === 'equipment';

                // 既存のインベントリ行を確認 (装備品は集約しないため常にnull)
                const { data: existing } = isEquipment ? { data: null } : await supabaseService
                    .from('inventory')
                    .select('id, quantity')
                    .eq('user_id', user.id)
                    .eq('item_id', item_id)
                    .limit(1)
                    .maybeSingle();

                if (existing) {
                    // 爆薬(ID: 3010)の複数所持制限: すでに持っているなら追加をスキップ
                    if (item_id === 3010) {
                        console.log(`[Inventory Grant] Skip adding item_explosive for user ${user.id} (already owned).`);
                        continue;
                    }
                    // 既存行の数量を加算
                    await supabaseService
                        .from('inventory')
                        .update({ quantity: existing.quantity + quantity })
                        .eq('id', existing.id);
                } else {
                    if (isEquipment) {
                        // 装備品の場合はスタックせず数量分の個別行をインサート
                        const insertRows = [];
                        for (let i = 0; i < quantity; i++) {
                            insertRows.push({
                                user_id: user.id,
                                item_id,
                                quantity: 1,
                                is_equipped: false,
                            });
                        }
                        await supabaseService
                            .from('inventory')
                            .insert(insertRows);
                    } else {
                        // 爆薬の新規追加の場合は数量を強制的に 1 に制限
                        const finalQuantity = item_id === 3010 ? 1 : quantity;
                        // 新規行を挿入
                        await supabaseService
                            .from('inventory')
                            .insert({
                                user_id: user.id,
                                item_id,
                                quantity: finalQuantity,
                                is_equipped: false,
                            });
                    }
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
            // [Security v27.3] ゴールド上限
            const safeGold = Math.min(gold, MAX_GOLD_PER_GRANT);

            const { data: profile } = await supabaseService
                .from('user_profiles')
                .select('gold')
                .eq('id', user.id)
                .single();

            if (profile) {
                const newGold = (profile.gold || 0) + safeGold;
                await supabaseService
                    .from('user_profiles')
                    .update({ gold: newGold })
                    .eq('id', user.id);
                goldGranted = safeGold;
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
