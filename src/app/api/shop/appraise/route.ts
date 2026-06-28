process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { getAuthenticatedProfile, checkEmbargo, AuthError } from '@/lib/shopAuth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const UNAPPRAISED_IDS: Record<number, { slug: string; rarity: string; costRange: [number, number] }> = {
    706: { slug: 'item_unappraised_n', rarity: 'N', costRange: [1000, 2000] },
    707: { slug: 'item_unappraised_r', rarity: 'R', costRange: [2000, 4000] },
    708: { slug: 'item_unappraised_sr', rarity: 'SR', costRange: [4000, 7000] },
    709: { slug: 'item_unappraised_ur', rarity: 'UR', costRange: [7000, 10000] }
};

// CSVからプールをロードする関数
function loadAppraisalPool(poolType: string): { slug: string; weight: number }[] {
    const csvPath = path.join(process.cwd(), 'src/data/csv/appraisal_pools.csv');
    if (!fs.existsSync(csvPath)) {
        throw new Error('マスターデータ appraisal_pools.csv が見つかりません。');
    }
    const text = fs.readFileSync(csvPath, 'utf8');
    const lines = text.trim().split('\n');
    const pool: { slug: string; weight: number }[] = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.split(',');
        if (cols.length < 3) continue;
        
        const rowType = cols[0].trim().toUpperCase();
        const rowSlug = cols[1].trim();
        const rowWeight = parseInt(cols[2].trim(), 10);
        
        if (rowType === poolType.toUpperCase() && rowSlug && !isNaN(rowWeight)) {
            pool.push({ slug: rowSlug, weight: rowWeight });
        }
    }
    return pool;
}

// 重み付きランダム抽選
function selectItemByWeightedRandom(pool: { slug: string; weight: number }[]): string {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
        throw new Error('抽選プールの合計確率（重み）が0以下です。');
    }
    
    let rand = Math.floor(Math.random() * totalWeight);
    for (const item of pool) {
        if (rand < item.weight) {
            return item.slug;
        }
        rand -= item.weight;
    }
    return pool[pool.length - 1].slug;
}

export async function POST(req: Request) {
    try {
        const { item_id } = await req.json();
        const profile = await getAuthenticatedProfile(req);
        
        // 1. 出禁チェック
        await checkEmbargo(profile);
        
        // 2. ハブ拠点チェック
        const { data: hubState } = await supabaseService
            .from('user_hub_states')
            .select('is_in_hub')
            .eq('user_id', profile.id)
            .maybeSingle();

        if (hubState?.is_in_hub) {
            return NextResponse.json({ error: 'ハブ拠点では鑑定は利用できません。' }, { status: 400 });
        }
        
        const targetId = Number(item_id);
        const appraiseConfig = UNAPPRAISED_IDS[targetId];
        if (!appraiseConfig) {
            return NextResponse.json({ error: '無効な未鑑定アイテムです。' }, { status: 400 });
        }
        
        // 3. インベントリ所持チェック
        const { data: existingUnappraisedRows, error: checkError } = await supabaseService
            .from('inventory')
            .select('id, quantity')
            .eq('user_id', profile.id)
            .eq('item_id', targetId)
            .eq('is_equipped', false); // 装備されていない未鑑定アイテムのみ

        if (checkError) throw checkError;

        const totalUnappraisedQty = (existingUnappraisedRows || []).reduce((sum, row) => sum + (row.quantity || 1), 0);
        if (totalUnappraisedQty <= 0) {
            return NextResponse.json({ error: '鑑定対象の未鑑定アイテムを所持していません。' }, { status: 400 });
        }
        
        // 4. 鑑定料を乱数で決定
        const [minCost, maxCost] = appraiseConfig.costRange;
        const appraiseCost = Math.floor(Math.random() * (maxCost - minCost + 1)) + minCost;
        
        // 5. 所持金チェック
        if (profile.gold < appraiseCost) {
            return NextResponse.json({ error: `ゴールドが不足しています。（鑑定料: ${appraiseCost} G / 所持金: ${profile.gold} G）` }, { status: 400 });
        }
        
        // 6. CSVから抽選プールのロード
        let pool: { slug: string; weight: number }[] = [];
        try {
            pool = loadAppraisalPool(appraiseConfig.rarity);
        } catch (e: any) {
            console.error('[Appraise API] CSV load failed:', e);
            return NextResponse.json({ error: '鑑定プールデータの読み込みに失敗しました。' }, { status: 500 });
        }
        
        if (pool.length === 0) {
            return NextResponse.json({ error: `レアリティ「${appraiseConfig.rarity}」の鑑定プールが空です。` }, { status: 500 });
        }
        
        // 7. 重み付き抽選の実行
        let resultSlug = '';
        try {
            resultSlug = selectItemByWeightedRandom(pool);
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 500 });
        }
        
        // 8. 抽選結果のアイテム情報を取得
        const { data: itemData, error: itemError } = await supabaseService
            .from('items')
            .select('id, slug, name, type, sub_type, base_price, description, rarity, effect_data')
            .eq('slug', resultSlug)
            .single();
            
        if (itemError || !itemData) {
            console.error('[Appraise API] Result item not found in DB:', resultSlug, itemError);
            return NextResponse.json({ error: '鑑定結果のアイテムがマスターデータに存在しません。' }, { status: 500 });
        }
        
        // 9. 所持上限チェック
        const limitMap: Record<string, number> = {
            consumable: 10,
            equipment: 3
        };
        const limit = limitMap[itemData.type] ?? 1; // それ以外（skillやkey_itemなど）は1個上限
        
        const { data: existingResultRows, error: countError } = await supabaseService
            .from('inventory')
            .select('id, quantity')
            .eq('user_id', profile.id)
            .eq('item_id', itemData.id);
            
        if (countError) throw countError;
        
        const totalResultQty = (existingResultRows || []).reduce((sum, row) => sum + (row.quantity || 1), 0);
        if (totalResultQty + 1 > limit) {
            return NextResponse.json({ 
                error: `鑑定した結果「${itemData.name}」になりましたが、所持上限（最大${limit}個）を超えるため鑑定できません。品整理をしてから再度お試しください。`
            }, { status: 400 });
        }
        
        // 10. トランザクション：ゴールドの減算
        const { error: goldDeductError } = await supabaseService
            .rpc('increment_gold', { p_user_id: profile.id, p_amount: -appraiseCost });
            
        if (goldDeductError) {
            console.error('[Appraise API] Gold deduction failed:', goldDeductError);
            return NextResponse.json({ error: 'ゴールドの減算に失敗しました。所持金が不足している可能性があります。' }, { status: 400 });
        }
        
        // 11. トランザクション：未鑑定アイテムを1個消費
        // rowの走査（sell/route.ts と同様のロジック）
        let consumed = false;
        for (const row of existingUnappraisedRows || []) {
            if (consumed) break;
            const rowQty = row.quantity || 1;
            if (rowQty <= 1) {
                const { error: delError } = await supabaseService
                    .from('inventory')
                    .delete()
                    .eq('id', row.id);
                if (delError) {
                    // ロールバック
                    await supabaseService.rpc('increment_gold', { p_user_id: profile.id, p_amount: appraiseCost });
                    throw delError;
                }
                consumed = true;
            } else {
                const { error: updError } = await supabaseService
                    .from('inventory')
                    .update({ quantity: rowQty - 1 })
                    .eq('id', row.id);
                if (updError) {
                    // ロールバック
                    await supabaseService.rpc('increment_gold', { p_user_id: profile.id, p_amount: appraiseCost });
                    throw updError;
                }
                consumed = true;
            }
        }
        
        // 12. トランザクション：鑑定結果アイテムの付与
        const { error: insertError } = await supabaseService
            .from('inventory')
            .insert({
                user_id: profile.id,
                item_id: itemData.id,
                quantity: 1,
                is_equipped: false,
                is_skill: false,
                acquired_at: new Date().toISOString()
            });
            
        if (insertError) {
            console.error('[Appraise API] Item grant failed:', insertError);
            // ロールバック (未鑑定アイテムの差し戻しとゴールド返金)
            await supabaseService.rpc('increment_gold', { p_user_id: profile.id, p_amount: appraiseCost });
            // 未鑑定アイテムの差し戻し（簡易的に新規インサートか、減らした行へのUPDATE。簡易的に新規追加）
            await supabaseService.from('inventory').insert({
                user_id: profile.id,
                item_id: targetId,
                quantity: 1,
                is_equipped: false,
                is_skill: false,
                acquired_at: new Date().toISOString()
            });
            return NextResponse.json({ error: '鑑定結果アイテムの付与に失敗しました。' }, { status: 500 });
        }
        
        // 13. 図鑑記録
        try {
            await supabaseService
                .from('user_item_history')
                .insert({ user_id: profile.id, item_id: itemData.id });
        } catch (histErr) {
            console.warn('[Appraise API] Item history recording failed:', histErr);
        }
        
        // 最新のゴールド残高を取得
        const { data: finalProfile } = await supabaseService
            .from('user_profiles')
            .select('gold')
            .eq('id', profile.id)
            .single();
            
        return NextResponse.json({
            success: true,
            item: {
                id: itemData.id,
                slug: itemData.slug,
                name: itemData.name,
                type: itemData.type,
                sub_type: itemData.sub_type,
                base_price: itemData.base_price,
                description: itemData.description,
                rarity: itemData.rarity,
                effect_data: itemData.effect_data,
                image_url: itemData.slug ? `/images/items/${itemData.slug}.png` : null
            },
            cost: appraiseCost,
            new_gold: finalProfile?.gold ?? (profile.gold - appraiseCost)
        });
        
    } catch (e: any) {
        console.error('[Appraise API Error]', e);
        if (e instanceof AuthError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        return NextResponse.json({ error: '内部サーバーエラーが発生しました。' }, { status: 500 });
    }
}
