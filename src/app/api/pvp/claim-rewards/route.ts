import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        // 受け取り可能な未受取報酬一覧を取得
        const { data: rewards, error } = await supabaseServer
            .from('pvp_reward_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_claimed', false);

        if (error) {
            console.error('[pvp/claim-rewards GET] Fetch error:', error);
            return NextResponse.json({ error: '報酬データの取得に失敗しました。' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            rewards: rewards || []
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const userId = user.id;

        // 1. 未受け取りの報酬行を全件取得
        const { data: rewards, error: fetchErr } = await supabaseServer
            .from('pvp_reward_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('is_claimed', false);

        if (fetchErr) {
            console.error('[pvp/claim-rewards] Fetch reward error:', fetchErr);
            return NextResponse.json({ error: '報酬のロードに失敗しました。' }, { status: 500 });
        }

        if (!rewards || rewards.length === 0) {
            return NextResponse.json({ success: true, message: '受け取り可能なアリーナ報酬はありません。', claimed_gold: 0 });
        }

        // 2. 所持金（ゴールド）の加算額集計
        let totalGold = 0;
        const itemsToGrant: string[] = []; // item_slugの配列
        const keysToGrant: Record<number, number> = {}; // item_id -> quantity

        for (const r of rewards) {
            totalGold += r.gold_reward ?? 0;
            
            // アイテム報酬 (未鑑定アイテム UR などの slug リスト)
            if (r.items_reward && Array.isArray(r.items_reward)) {
                r.items_reward.forEach((slug: string) => itemsToGrant.push(slug));
            }
            
            // 鍵報酬 (key_id -> quantity のマッピング)
            if (r.keys_reward && typeof r.keys_reward === 'object') {
                for (const [keyIdStr, qty] of Object.entries(r.keys_reward)) {
                    const keyId = parseInt(keyIdStr, 10);
                    const count = Number(qty);
                    keysToGrant[keyId] = (keysToGrant[keyId] || 0) + count;
                }
            }
        }

        // 3. ゴールド加算処理
        if (totalGold > 0) {
            const { data: profile } = await supabaseServer
                .from('user_profiles')
                .select('gold')
                .eq('id', userId)
                .single();

            const currentGold = profile?.gold ?? 0;
            await supabaseServer
                .from('user_profiles')
                .update({ gold: currentGold + totalGold })
                .eq('id', userId);
        }

        // 4. 鍵アイテムの付与 (BASIC/ACADEMY 鍵。重複時は数量加算 upsert ロジック)
        for (const [keyId, qty] of Object.entries(keysToGrant)) {
            const itemId = Number(keyId);
            const quantity = Number(qty);

            const { data: existingKey } = await supabaseServer
                .from('inventory')
                .select('id, quantity')
                .eq('user_id', userId)
                .eq('item_id', itemId)
                .maybeSingle();

            if (existingKey) {
                await supabaseServer
                    .from('inventory')
                    .update({ quantity: existingKey.quantity + quantity })
                    .eq('id', existingKey.id);
            } else {
                await supabaseServer
                    .from('inventory')
                    .insert({
                        user_id: userId,
                        item_id: itemId,
                        quantity: quantity,
                        is_equipped: false,
                        is_skill: false
                    });
            }
        }

        // 5. 一般未鑑定アイテム（UR）の付与 (個別のレコードとして新規インサート)
        // ※ UR未鑑定アイテムのアイテムID (itemsテーブルのID) をマスタから特定する
        if (itemsToGrant.length > 0) {
            // 例: 'item_unidentified_ur' などのスラグ名から item_id を解決
            const { data: dbItems } = await supabaseServer
                .from('items')
                .select('id, slug')
                .in('slug', itemsToGrant);
            
            if (dbItems && dbItems.length > 0) {
                const slugMap = new Map(dbItems.map(i => [i.slug, i.id]));
                
                // アイテム付与
                for (const slug of itemsToGrant) {
                    const itemId = slugMap.get(slug);
                    if (itemId) {
                        await supabaseServer
                            .from('inventory')
                            .insert({
                                user_id: userId,
                                item_id: itemId,
                                quantity: 1,
                                is_equipped: false,
                                is_skill: false
                            });
                    }
                }
            }
        }

        // 6. 報酬を受け取り済みに更新 (is_claimed = true)
        const rewardIds = rewards.map(r => r.id);
        const { error: claimErr } = await supabaseServer
            .from('pvp_reward_logs')
            .update({ is_claimed: true })
            .in('id', rewardIds);

        if (claimErr) {
            console.error('[pvp/claim-rewards] Claim flag update failed:', claimErr);
        }

        return NextResponse.json({
            success: true,
            message: 'アリーナ報酬を一括で受け取りました！',
            claimed_gold: totalGold,
            claimed_items_count: itemsToGrant.length,
            claimed_keys_count: Object.values(keysToGrant).reduce((a, b) => a + b, 0)
        });

    } catch (e: any) {
        console.error('[pvp/claim-rewards] API Error:', e.message);
        return NextResponse.json({ error: e.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
