import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { getAuthenticatedProfile, checkEmbargo, AuthError } from '@/lib/shopAuth';
import { getSkillRarity } from '@/lib/rarity';

export const dynamic = 'force-dynamic';

// 排出プール定義
const ACADEMY_POOLS = {
    SR: [3101, 3116, 3119],
    R: [3107, 3109, 3112, 3113, 3124, 3125, 3139],
    U: [3102, 3103, 3105, 3110, 3114, 3115, 3118, 3120, 3126, 3131],
    C: [3104, 3106, 3108, 3111, 3117, 3122, 3123, 3127, 3128, 3130, 3133, 3134, 3135, 3136, 3137, 3138, 3140]
};

const BASIC_POOLS = {
    SR: [3021, 3022, 3035, 3041, 3042, 3043, 3045],
    R: [3023, 3024, 3025, 3029, 3031, 3037, 3039, 3044],
    U: [3027, 3028, 3030, 3032, 3033, 3034, 3036, 3038, 3040, 3062, 3065, 3066, 3067],
    C: [3011, 3012, 3013, 3014, 3015, 3016, 3017, 3018, 3019, 3020, 3026, 3061]
};

// ヘルパー：確率に基づく1枚のロール
function rollCard(guaranteedRare: boolean, pools: typeof ACADEMY_POOLS): { rarity: 'SR' | 'R' | 'U' | 'C'; skillId: number } {
    const rand = Math.random() * 100;
    let rarity: 'SR' | 'R' | 'U' | 'C' = 'C';
    
    if (guaranteedRare) {
        if (rand < 20) {
            rarity = 'SR';
        } else {
            rarity = 'R';
        }
    } else {
        if (rand < 3) {
            rarity = 'SR';
        } else if (rand < 15) { // 3 + 12
            rarity = 'R';
        } else if (rand < 40) { // 15 + 25
            rarity = 'U';
        } else {
            rarity = 'C';
        }
    }
    
    const pool = pools[rarity];
    const skillId = pool[Math.floor(Math.random() * pool.length)];
    return { rarity, skillId };
}

// POST: パック購入（ゴールドまたは鍵消費）
export async function POST(req: Request) {
    try {
        // 1. 認証とリクエスト読み込み
        const profile = await getAuthenticatedProfile(req);
        
        let body: any = {};
        try {
            body = await req.json();
        } catch (_) {}

        const packSeries = body.pack_series === 'basic' ? 'basic' : 'chaos_and_rebellion';
        const useKey = !!body.use_key;

        // 2. 名声出禁チェック
        await checkEmbargo(profile);

        // 2.5 ハブ拠点チェック (ハブ拠点では魔術学院は利用できません)
        const { data: hubState } = await supabaseService
            .from('user_hub_states')
            .select('is_in_hub')
            .eq('user_id', profile.id)
            .maybeSingle();

        if (hubState?.is_in_hub) {
            return NextResponse.json({ error: 'ハブ拠点では魔術学院は利用できません。' }, { status: 400 });
        }

        // シリーズ設定
        const config = packSeries === 'basic' ? {
            price: 3000,
            refund: 300,
            key_id: 76,
            key_slug: 'item_basic_key',
            pools: BASIC_POOLS,
            log_series: 'basic'
        } : {
            price: 5000,
            refund: 500,
            key_id: 77,
            key_slug: 'item_academy_key',
            pools: ACADEMY_POOLS,
            log_series: 'chaos_and_rebellion'
        };

        // 3. 鍵またはゴールドの残高チェックと消費
        let keyInventoryId: string | null = null;
        
        if (useKey) {
            // 鍵チェック
            const { data: keyInv, error: keyInvError } = await supabaseService
                .from('inventory')
                .select('id, quantity')
                .eq('user_id', profile.id)
                .eq('item_id', config.key_id)
                .maybeSingle();

            if (keyInvError || !keyInv || (keyInv.quantity || 0) <= 0) {
                return NextResponse.json({ error: '対象のパック開封用鍵を所持していません。' }, { status: 400 });
            }
            keyInventoryId = keyInv.id;

            // アトミックに鍵を1枚減らす
            const newQty = (keyInv.quantity || 1) - 1;
            if (newQty <= 0) {
                const { error: delError } = await supabaseService
                    .from('inventory')
                    .delete()
                    .eq('id', keyInventoryId);
                if (delError) throw delError;
            } else {
                const { error: updError } = await supabaseService
                    .from('inventory')
                    .update({ quantity: newQty })
                    .eq('id', keyInventoryId);
                if (updError) throw updError;
            }
        } else {
            // 通常ゴールドチェック
            if (profile.gold < config.price) {
                return NextResponse.json({ error: 'ゴールドが不足しています。' }, { status: 400 });
            }
        }
        
        // 4. プレイヤーの所持済みスキルを取得
        const { data: ownedSkillsResult, error: ownedSkillsError } = await supabaseService
            .from('user_skills')
            .select('skill_id')
            .eq('user_id', profile.id);
            
        if (ownedSkillsError) {
            // 失敗時は鍵を消費していた場合、ロールバック
            if (useKey && keyInventoryId) {
                const { data: existing } = await supabaseService.from('inventory').select('id, quantity').eq('id', keyInventoryId).maybeSingle();
                if (existing) {
                    await supabaseService.from('inventory').update({ quantity: (existing.quantity || 0) + 1 }).eq('id', keyInventoryId);
                } else {
                    await supabaseService.from('inventory').insert({ id: keyInventoryId, user_id: profile.id, item_id: config.key_id, quantity: 1 });
                }
            }
            throw ownedSkillsError;
        }
        
        const ownedSkillIdsSet = new Set<number>((ownedSkillsResult || []).map(s => Number(s.skill_id)));
        
        // 5. 5枚ロールする
        const rolled: { rarity: 'SR' | 'R' | 'U' | 'C'; skillId: number }[] = [];
        for (let i = 0; i < 4; i++) {
            rolled.push(rollCard(false, config.pools));
        }
        rolled.push(rollCard(true, config.pools)); // 5枚目はレアリティR以上確定
        
        // 6. 重複救済とキャッシュバック計算
        const trackingSet = new Set<number>(ownedSkillIdsSet);
        let refundGold = 0;
        const insertSkillIds: number[] = [];
        
        const results = rolled.map(roll => {
            const isDuplicate = trackingSet.has(roll.skillId);
            if (isDuplicate) {
                refundGold += config.refund;
            } else {
                trackingSet.add(roll.skillId);
                insertSkillIds.push(roll.skillId);
            }
            return {
                skill_id: roll.skillId,
                rarity: roll.rarity,
                is_duplicate: isDuplicate
            };
        });
        
        // ゴールド減算トランザクション（鍵消費の場合は純利益（キャッシュバック）のみ加算、またはゴールド消費時の差し引き減算）
        const netCost = useKey ? 0 : config.price;
        const finalCostOrBenefit = netCost - refundGold; // 正の値ならゴールド消費、負の値ならゴールド増加（キャッシュバック分）
        
        const { error: goldError } = await supabaseService
            .rpc('increment_gold', { p_user_id: profile.id, p_amount: -finalCostOrBenefit });
            
        if (goldError) {
            console.error('[Buy Pack API] Gold deduction failed:', goldError);
            // 鍵のロールバック
            if (useKey && keyInventoryId) {
                const { data: existing } = await supabaseService.from('inventory').select('id, quantity').eq('id', keyInventoryId).maybeSingle();
                if (existing) {
                    await supabaseService.from('inventory').update({ quantity: (existing.quantity || 0) + 1 }).eq('id', keyInventoryId);
                } else {
                    await supabaseService.from('inventory').insert({ id: keyInventoryId, user_id: profile.id, item_id: config.key_id, quantity: 1 });
                }
            }
            return NextResponse.json({ error: 'ゴールドの更新に失敗しました。所持金が不足している可能性があります。' }, { status: 400 });
        }
        
        // 8. 新規スキルの登録
        if (insertSkillIds.length > 0) {
            const inserts = insertSkillIds.map(sid => ({
                user_id: profile.id,
                skill_id: sid,
                is_equipped: false
            }));
            
            const { error: insertError } = await supabaseService
                .from('user_skills')
                .insert(inserts);
                
            if (insertError) {
                console.error('[Buy Pack API] Skills insertion failed:', insertError);
                // ロールバック処理
                if (useKey && keyInventoryId) {
                    const { data: existing } = await supabaseService.from('inventory').select('id, quantity').eq('id', keyInventoryId).maybeSingle();
                    if (existing) {
                        await supabaseService.from('inventory').update({ quantity: (existing.quantity || 0) + 1 }).eq('id', keyInventoryId);
                    } else {
                        await supabaseService.from('inventory').insert({ id: keyInventoryId, user_id: profile.id, item_id: config.key_id, quantity: 1 });
                    }
                } else {
                    await supabaseService.rpc('increment_gold', { p_user_id: profile.id, p_amount: finalCostOrBenefit });
                }
                return NextResponse.json({ error: 'スキルの登録に失敗しました。' }, { status: 500 });
            }
        }

        // 8.5 購入ログの記録
        try {
            const { error: logError } = await supabaseService
                .from('academy_pack_logs')
                .insert({
                    user_id: profile.id,
                    pack_series: config.log_series,
                    gold_spent: useKey ? 0 : finalCostOrBenefit,
                    refund_gold: refundGold
                });
            if (logError) {
                console.error('[Buy Pack API] Failed to write academy_pack_logs:', logError);
            }
        } catch (logExc) {
            console.error('[Buy Pack API] Exception writing academy_pack_logs:', logExc);
        }
        
        // 9. クライアント返却用カード詳細情報の取得
        const rolledIds = results.map(r => r.skill_id);
        const { data: skillDetails, error: detailsError } = await supabaseService
            .from('skills')
            .select(`
                id,
                name,
                slug,
                image_url,
                description,
                cards (
                    name,
                    description,
                    image_url
                )
            `)
            .in('id', rolledIds);
            
        if (detailsError) {
            console.error('[Buy Pack API] Details fetch failed:', detailsError);
        }
        
        const detailsMap = new Map<number, any>();
        for (const detail of (skillDetails || [])) {
            detailsMap.set(Number(detail.id), detail);
        }
        
        const cardsResponse = results.map(r => {
            const detail = detailsMap.get(r.skill_id);
            return {
                id: r.skill_id,
                name: detail?.name || '未知の教本',
                slug: detail?.slug || 'unknown_book',
                image_url: detail?.cards?.image_url || detail?.image_url || '/images/items/book_focus.png',
                description: detail?.cards?.description || detail?.description || '',
                rarity: r.rarity,
                isDuplicate: r.is_duplicate
            };
        });
        
        // 最新ゴールド取得
        const { data: finalProfile } = await supabaseService
            .from('user_profiles')
            .select('gold')
            .eq('id', profile.id)
            .single();
            
        return NextResponse.json({
            success: true,
            cards: cardsResponse,
            refund: refundGold,
            new_gold: finalProfile?.gold ?? (profile.gold - finalCostOrBenefit)
        });
        
    } catch (err: any) {
        console.error('[Buy Pack API] Error:', err);
        const status = err instanceof AuthError ? err.status : 500;
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status });
    }
}

// GET: パック内の収録カード一覧の取得
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const packSeries = searchParams.get('pack_series') === 'basic' ? 'basic' : 'chaos_and_rebellion';
        
        const pools = packSeries === 'basic' ? BASIC_POOLS : ACADEMY_POOLS;
        const allIds = [
            ...pools.SR,
            ...pools.R,
            ...pools.U,
            ...pools.C
        ];

        const { data: skillDetails, error: detailsError } = await supabaseService
            .from('skills')
            .select(`
                id,
                name,
                slug,
                image_url,
                description,
                cards (
                    id,
                    slug,
                    name,
                    type,
                    cost_type,
                    cost_val,
                    effect_val,
                    ap_cost,
                    target_type,
                    effect_id,
                    image_url,
                    description
                )
            `)
            .in('id', allIds);

        if (detailsError) {
            throw detailsError;
        }

        // ID順にソートし、レアリティ情報をマージして返却する
        const skillsResponse = (skillDetails || []).map((detail: any) => {
            const skillId = Number(detail.id);
            const rarity = getSkillRarity(skillId);
            const card = detail.cards;
            const effectData = card ? {
                cost_val: card.cost_val,
                effect_val: card.effect_val,
                cost_type: card.cost_type,
                card_type: card.type,
                ap_cost: card.ap_cost ?? 1,
                target_type: card.target_type,
                effect_id: card.effect_id || null,
                image_url: card.image_url || null,
                description: detail.description || card.description || card.name
            } : {};

            return {
                id: skillId,
                name: detail.name,
                slug: detail.slug,
                image_url: card?.image_url || detail.image_url || '/images/items/book_focus.png',
                description: card?.description || detail.description || '',
                ap_cost: card?.ap_cost || 1,
                card_type: card?.type || 'Skill',
                rarity,
                effect_data: effectData
            };
        });

        // ソート順：SR -> R -> U -> C、かつその中ではID昇順にする
        const rarityWeight = { SR: 4, R: 3, U: 2, C: 1 };
        skillsResponse.sort((a, b) => {
            const weightA = rarityWeight[a.rarity] || 0;
            const weightB = rarityWeight[b.rarity] || 0;
            if (weightA !== weightB) {
                return weightB - weightA; // 高レアリティ優先
            }
            return a.id - b.id; // 同レアリティ内ではID順
        });

        return NextResponse.json({
            success: true,
            cards: skillsResponse
        });

    } catch (err: any) {
        console.error('[Buy Pack API GET] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
