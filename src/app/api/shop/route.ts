import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { ItemDB, UserProfileDB, SkillDB } from '@/types/game';

// Helper to get user profile 
async function getUserProfile(req: Request) {
    let targetUserId: string;
    const authHeader = req.headers.get('authorization');

    if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            console.warn("[Shop API] Authentication failed (JWT). Deprecated x-user-id fallback rejected.");
            throw new Error("Authentication failed. JWT is required."); // Throwing an error to be caught by the try/catch in GET/POST
        }
        targetUserId = user.id;
    } else {
        console.warn("[Shop API] Missing authorization header. Deprecated x-user-id fallback rejected.");
        throw new Error("Login required for shop usage."); // Throwing an error to be caught by the try/catch in GET/POST
    }

    const { data: profile } = await supabaseService
        .from('user_profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

    if (profile) {
        console.log(`[Shop] Profile: ${profile.id} | Gold: ${profile.gold} | Loc: ${profile.current_location_id}`);
    } else {
        console.error(`[Shop] Profile NOT FOUND for ID: ${targetUserId}`);
    }

    return profile as UserProfileDB;
}

// GET: List Items (Dynamic Shop)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const questId = searchParams.get('quest_id');

        const profile = await getUserProfile(req);
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 1. Get Location Context, Embargo, Items — 並列実行で高速化
        let prosperityLevel = 3;
        let rulingNation = 'Neutral';
        let locationName = 'Unknown';
        let isEmbargoed = false;

        // まずlocationを取得してnameを確定
        if (profile.current_location_id) {
            const { data: locData } = await supabaseService.from('locations').select('*').eq('id', profile.current_location_id).single();
            if (locData) {
                prosperityLevel = locData.prosperity_level || 3;
                rulingNation = locData.ruling_nation_id || 'Neutral';
                locationName = locData.name;
            }
        }

        // 並列: reputations と items と skills を同時取得
        const [repResult, itemsResult, skillsResult] = await Promise.all([
            locationName !== 'Unknown'
                ? supabaseService.from('reputations').select('score').eq('user_id', profile.id).eq('location_name', locationName).maybeSingle()
                : Promise.resolve({ data: null, error: null }),
            supabaseService.from('items').select('*'),
            supabaseService.from('skills').select('*, cards(*)')
        ]);

        if (repResult.data && (repResult.data.score || 0) < 0) {
            isEmbargoed = true;
        }
        if (itemsResult.error) throw itemsResult.error;
        const allItems = itemsResult.data as ItemDB[];
        const allSkills = (skillsResult.data || []) as any[];

        // 2. Inflation Logic
        // inflationMap: 繁栄度ごとの価格乗数（仕様: spec_v6_shop_system.md §5）
        const inflationMap: Record<number, number> = { 5: 1.0, 4: 1.0, 3: 1.2, 2: 1.5, 1: 3.0 };
        const priceMultiplier = inflationMap[prosperityLevel] || 1.0;

        // 初心者保護フラグのみ保持（割引はmap()内でインフレ後に適用）
        const isNewbie = (profile.level || 1) <= 5;

        // 3. Helper: nation_tags フィルタ共通ロジック
        const nationTag = `loc_${rulingNation.toLowerCase()}`;
        const matchesNation = (tags: string[] | null) => {
            if (!tags || tags.length === 0) return true;
            // 文字列 'any' をタグとして含む場合は常にマッチ
            if (tags.includes('any')) return true;
            if (rulingNation === 'Neutral') return tags.includes('loc_all');
            return tags.includes('loc_all') || tags.includes(nationTag);
        };

        // 4. Items Filtering Logic
        const isRuined = prosperityLevel === 1;
        const playerLevel = profile.level || 1;
        const filteredItems = allItems.filter(item => {
            // クエスト専売アイテムは常に表示
            if (questId && item.quest_req_id === questId) return true;
            if (item.quest_req_id && item.quest_req_id !== questId) return false;

            // 崩壊拠点では闇市アイテム以外を非表示
            if (isRuined && !item.is_black_market) return false;

            if (item.min_prosperity > prosperityLevel) return false;

            // nation_tags処理: DB配列 or CSV文字列に対応
            const tags = Array.isArray(item.nation_tags) ? item.nation_tags : [];
            if (!matchesNation(tags)) return false;

            if (item.is_black_market) {
                const isDark = (profile.alignment?.evil || 0) > 20;
                if (!isRuined && !isDark) return false;
            }

            return true;
        }).map(item => {
            let price = Math.floor(item.base_price * priceMultiplier);
            if (isNewbie && !item.is_black_market) price = Math.floor(price * 0.5);
            return {
                ...item,
                // slugベースの画像URLを自動設定
                image_url: item.image_url || (item.slug ? `/images/items/${item.slug}.png` : null),
                current_price: price,
                is_quest_exclusive: (questId && item.quest_req_id === questId),
                _source: 'item' as const
            };
        });

        // 5. Skills Filtering Logic
        const filteredSkills = allSkills.filter(skill => {
            if (isRuined && !skill.is_black_market) return false;
            if ((skill.min_prosperity || 1) > prosperityLevel) return false;
            
            const tags = Array.isArray(skill.nation_tags) ? skill.nation_tags : [];
            if (!matchesNation(tags)) return false;

            if (skill.is_black_market) {
                const isDark = (profile.alignment?.evil || 0) > 20;
                if (!isRuined && !isDark) return false;
            }

            // スキルカードはLv3以降に解禁
            if (playerLevel < 3) return false;
            const deckCap = profile.max_deck_cost || 10;
            const cardCost = skill.deck_cost || 0;
            if (cardCost > deckCap + 2) return false;

            return true;
        }).map(skill => {
            let price = Math.floor(skill.base_price * priceMultiplier);
            if (isNewbie && !skill.is_black_market) price = Math.floor(price * 0.5);
            return {
                id: skill.id,
                slug: skill.slug,
                name: skill.name,
                type: 'skill_card' as const,
                base_price: skill.base_price,
                cost: skill.deck_cost,
                card_id: skill.card_id,
                nation_tags: skill.nation_tags,
                min_prosperity: skill.min_prosperity,
                is_black_market: skill.is_black_market,
                image_url: skill.image_url || (skill.slug ? `/images/items/${skill.slug}.png` : null),
                effect_data: skill.cards || {},
                description: skill.description,
                current_price: price,
                _source: 'skill' as const
            };
        });

        // 6. 統合してソート（混在表示）
        const allShopItems = [...filteredItems, ...filteredSkills].sort((a, b) => a.current_price - b.current_price);

        // rumoredItemsは初回リリースでは常に非表示
        const rumoredItems: any[] = [];


        return NextResponse.json({
            items: allShopItems,
            rumored_items: rumoredItems,
            meta: {
                location: locationName,
                prosperity: prosperityLevel,
                inflation: priceMultiplier,
                ruling_nation: rulingNation,
                is_newbie_protected: isNewbie,
                is_embargoed: isEmbargoed
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST: Buy Item or Skill
export async function POST(req: Request) {
    try {
        const { item_id, _source } = await req.json();
        const profile = await getUserProfile(req);
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 0.5 Check Embargo Mode
        if (profile.current_location_id) {
            const { data: locForRep } = await supabaseService.from('locations').select('name').eq('id', profile.current_location_id).maybeSingle();
            if (locForRep?.name) {
                const { data: repData } = await supabaseService.from('reputations').select('score').eq('user_id', profile.id).eq('location_name', locForRep.name).maybeSingle();
                if (repData && (repData.score || 0) < 0) {
                    return NextResponse.json({ error: '出禁状態: この拠点での名声が低すぎるため、取引を拒否されました。' }, { status: 403 });
                }
            }
        }

        // 分岐: スキル購入 vs アイテム購入
        if (_source === 'skill') {
            return await handleSkillPurchase(profile, item_id);
        } else {
            return await handleItemPurchase(profile, item_id);
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// スキル購入処理
async function handleSkillPurchase(profile: UserProfileDB, skillId: number) {
    // 1. Fetch Skill
    const { data: skillData, error: skillError } = await supabaseService
        .from('skills')
        .select('*')
        .eq('id', skillId)
        .single();

    if (skillError || !skillData) return NextResponse.json({ error: 'Skill not found' }, { status: 404 });

    // 2. Calculate Price
    let prosperityLevel = 3;
    if (profile.current_location_id) {
        const { data: loc } = await supabaseService.from('locations').select('prosperity_level').eq('id', profile.current_location_id).maybeSingle();
        if (loc) prosperityLevel = loc.prosperity_level || 3;
    }
    const inflationMap: Record<number, number> = { 5: 1.0, 4: 1.0, 3: 1.2, 2: 1.5, 1: 3.0 };
    const priceMultiplier = inflationMap[prosperityLevel] || 1.0;
    const isNewbie = (profile.level || 1) <= 5;
    let finalPrice = Math.floor(skillData.base_price * priceMultiplier);
    if (isNewbie && !skillData.is_black_market) finalPrice = Math.floor(finalPrice * 0.5);

    // 3. Check Gold
    if (profile.gold < finalPrice) {
        return NextResponse.json({ error: '金貨が足りません！' }, { status: 400 });
    }

    // 4. Duplicate Check
    const { count } = await supabaseService.from('user_skills').select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('skill_id', skillId);
    if (count && count > 0) {
        return NextResponse.json({ error: '既に習得済みです。' }, { status: 400 });
    }

    // 5. Transaction
    const { error: goldError } = await supabaseService
        .rpc('increment_gold', { p_user_id: profile.id, p_amount: -finalPrice });
    if (goldError) throw goldError;

    const { error: skillInsertError } = await supabaseService
        .from('user_skills')
        .insert({
            user_id: profile.id,
            skill_id: skillId,
            is_equipped: false,
            acquired_at: new Date().toISOString()
        });

    if (skillInsertError) {
        // Refund
        await supabaseService.rpc('increment_gold', { p_user_id: profile.id, p_amount: finalPrice });
        return NextResponse.json({ error: 'Transaction failed', details: skillInsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, new_gold: profile.gold - finalPrice });
}

// アイテム購入処理
async function handleItemPurchase(profile: UserProfileDB, itemId: number) {
    // 1. Fetch Item
    const { data: itemData, error: itemError } = await supabaseService
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();

    if (itemError || !itemData) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    const item = itemData as ItemDB;

    // 2. Calculate Price
    let prosperityLevel = 3;
    if (profile.current_location_id) {
        const { data: loc } = await supabaseService.from('locations').select('prosperity_level').eq('id', profile.current_location_id).maybeSingle();
        if (loc) prosperityLevel = loc.prosperity_level || 3;
    }
    const inflationMap: Record<number, number> = { 5: 1.0, 4: 1.0, 3: 1.2, 2: 1.5, 1: 3.0 };
    const priceMultiplier = inflationMap[prosperityLevel] || 1.0;
    const isNewbie = (profile.level || 1) <= 5;
    let finalPrice = Math.floor(item.base_price * priceMultiplier);
    if (isNewbie && !item.is_black_market) finalPrice = Math.floor(finalPrice * 0.5);

    // 3. Check Gold
    if (profile.gold < finalPrice) {
        return NextResponse.json({ error: '金貨が足りません！' }, { status: 400 });
    }

    // 4. Handle Special Items (e.g. Capital Pass)
    if (item.slug === 'capital_pass') {
        const currentDays = profile.accumulated_days || 0;
        const newExpiry = currentDays + 30;
        const updatedPasses = { ...(profile.pass_expires_at || {}) } as Record<string, number>;
        const capitals = ['Roland', 'Markand', 'Karyu', 'Yato'];
        for (const cap of capitals) {
            updatedPasses[cap] = Math.max(updatedPasses[cap] || 0, newExpiry);
        }
        const { error: passUpdateError } = await supabaseService
            .from('user_profiles')
            .update({ pass_expires_at: updatedPasses })
            .eq('id', profile.id);
        if (passUpdateError) {
            await supabaseService.rpc('increment_gold', { p_user_id: profile.id, p_amount: finalPrice });
            return NextResponse.json({ error: 'Transaction failed', details: passUpdateError.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, new_gold: profile.gold - finalPrice, message: '全首都共通の30日通行許可証を購入しました。' });
    }

    // 5. Transaction
    const { error: goldError } = await supabaseService
        .rpc('increment_gold', { p_user_id: profile.id, p_amount: -finalPrice });
    if (goldError) throw goldError;

    // 6. Add to Inventory
    const { error: invError } = await supabaseService
        .from('inventory')
        .insert({
            user_id: profile.id,
            item_id: item.id,
            quantity: 1,
            is_equipped: false,
            is_skill: false,
            acquired_at: new Date().toISOString()
        });

    if (invError) {
        await supabaseService.rpc('increment_gold', { p_user_id: profile.id, p_amount: finalPrice });
        return NextResponse.json({ error: 'Transaction failed', details: invError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, new_gold: profile.gold - finalPrice });
}

