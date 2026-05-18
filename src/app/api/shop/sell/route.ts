import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { getAuthenticatedProfile, checkEmbargo, AuthError } from '@/lib/shopAuth';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { item_id, quantity = 1 } = body;
        console.log(`[Sell] Request body:`, JSON.stringify(body));

        // 1. 認証（共通モジュール）
        const profile = await getAuthenticatedProfile(req);

        // 1.5 出禁チェック + 繁栄度取得（闇市売却ボーナス用）
        await checkEmbargo(profile);

        let prosperityLevel = 3;
        if (profile.current_location_id) {
            const { data: loc } = await supabaseService
                .from('locations')
                .select('name, prosperity_level')
                .eq('id', profile.current_location_id)
                .maybeSingle();
            if (loc) prosperityLevel = loc.prosperity_level || 3;
        }

        // 2. インベントリからアイテム検索（join items）
        console.log(`[Sell] Looking for item_id=${item_id} (type: ${typeof item_id}) for user=${profile.id}`);

        const { data: invItems, error: invError } = await supabaseService
            .from('inventory')
            .select('*, items(*)')
            .eq('user_id', profile.id)
            .eq('item_id', item_id)
            .limit(1);

        const invItem = invItems?.[0];
        console.log(`[Sell] Query result:`, invItem ? `Found id=${invItem.id}, qty=${invItem.quantity}` : 'Not found', invError?.message || '');

        if (invError || !invItem) {
            return NextResponse.json({
                error: '指定のアイテムを所持していません。',
                debug: { item_id, item_id_type: typeof item_id, user_id: profile.id, dbError: invError?.message }
            }, { status: 404 });
        }

        // 2.5 スキルアイテムの売却防止
        const item = invItem.items as any;
        if (item?.type === 'skill' || item?.is_skill === true) {
            return NextResponse.json({ error: '売却不可: このスキルは売却できません。' }, { status: 400 });
        }

        // 3. 売却価格計算
        const isUgc = invItem.is_ugc === true;
        const isRuined = prosperityLevel === 1;
        const sellPrice = isUgc ? 1
            : isRuined ? Math.floor((item?.base_price || 0) * 1.5)
                : Math.floor((item?.base_price || 0) / 2);
        const totalSellValue = sellPrice * quantity;
        console.log(`[Sell] Item: ${item?.name}, base_price: ${item?.base_price}, prosperity: ${prosperityLevel}, isRuined: ${isRuined}, sellPrice: ${sellPrice}, qty: ${quantity}, total: ${totalSellValue}`);

        // 4. 裏切りチェック
        let isBetrayal = false;
        if ((item?.type === 'key_item' || item?.type === 'trade_good' || item?.type === 'consumable') && (profile as any).current_quest_id) {
            const { data: quest } = await supabaseService
                .from('scenarios')
                .select('*')
                .eq('id', (profile as any).current_quest_id)
                .single();

            if (quest) {
                const qStr = JSON.stringify(quest);
                if (qStr.includes(`"item_id":${item_id}`) || qStr.includes(`"item_id":"${item_id}"`) || quest.requirements?.has_item == item_id) {
                    isBetrayal = true;
                    console.log(`[Sell] Betrayal detected for item ${item_id} in quest ${(profile as any).current_quest_id}`);
                }
            }
        }

        // 5. インベントリ更新
        if (invItem.quantity > quantity) {
            const { error: updateError } = await supabaseService.from('inventory').update({ quantity: invItem.quantity - quantity }).eq('id', invItem.id);
            if (updateError) throw updateError;
        } else {
            const { error: deleteError } = await supabaseService.from('inventory').delete().eq('id', invItem.id);
            if (deleteError) throw deleteError;
        }

        // 6. 裏切りペナルティ
        if (isBetrayal && profile.current_location_id) {
            const { data: locForRep } = await supabaseService.from('locations').select('name').eq('id', profile.current_location_id).maybeSingle();
            if (locForRep?.name) {
                const { data: repData } = await supabaseService
                    .from('reputations')
                    .select('*')
                    .eq('user_id', profile.id)
                    .eq('location_name', locForRep.name)
                    .maybeSingle();

                if (repData) {
                    await supabaseService.from('reputations')
                        .update({ score: (repData.score || 0) - 50 })
                        .eq('id', repData.id);
                }
            }
        }

        // 7. ゴールド加算（RPC で原子的に処理 — レースコンディション防止）
        const { error: goldError } = await supabaseService
            .rpc('increment_gold', { p_user_id: profile.id, p_amount: totalSellValue });
        if (goldError) throw goldError;

        // 裏切り時はクエストクリア
        if (isBetrayal) {
            await supabaseService.from('user_profiles')
                .update({ current_quest_id: null, current_quest_state: null })
                .eq('id', profile.id);

            return NextResponse.json({
                success: true,
                trigger_fail: true,
                message: "裏切り",
                sold_price: totalSellValue,
                new_gold: profile.gold + totalSellValue,
                prosperity_level: prosperityLevel,
            });
        }

        return NextResponse.json({
            success: true,
            sold_price: totalSellValue,
            new_gold: profile.gold + totalSellValue,
            prosperity_level: prosperityLevel,
        });

    } catch (e: any) {
        console.error("[Sell] Error:", e);
        if (e instanceof AuthError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
