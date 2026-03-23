import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { ItemDB, UserProfileDB } from '@/types/game';

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

        // 並列: locations、reputations、items を同時取得
        const [locResult, repResult, itemsResult] = await Promise.all([
            profile.current_location_id
                ? supabaseService.from('locations').select('*').eq('id', profile.current_location_id).single()
                : Promise.resolve({ data: null, error: null }),
            profile.current_location_id
                ? supabaseService.from('reputations').select('reputation_score').eq('user_id', profile.id).eq('location_id', profile.current_location_id).maybeSingle()
                : Promise.resolve({ data: null, error: null }),
            supabaseService.from('items').select('*')
        ]);

        if (locResult.data) {
            prosperityLevel = locResult.data.prosperity_level || 3;
            rulingNation = locResult.data.ruling_nation_id || 'Neutral';
            locationName = locResult.data.name;
        }
        if (repResult.data && (repResult.data.reputation_score || 0) < 0) {
            isEmbargoed = true;
        }
        if (itemsResult.error) throw itemsResult.error;
        const allItems = itemsResult.data as ItemDB[];

        // 2. Inflation Logic
        // inflationMap: 繁栄度ごとの価格乗数（仕様: spec_v6_shop_system.md §5）
        const inflationMap: Record<number, number> = { 5: 1.0, 4: 1.0, 3: 1.2, 2: 1.5, 1: 3.0 };
        const priceMultiplier = inflationMap[prosperityLevel] || 1.0;

        // 初心者保護フラグのみ保持（割引はmap()内でインフレ後に適用）
        const isNewbie = (profile.level || 1) <= 5;

        // 4. Filtering Logic
        const isRuined = prosperityLevel === 1;
        const filteredItems = allItems.filter(item => {
            // クエスト専売アイテムは常に表示
            if (questId && item.quest_req_id === questId) return true;
            if (item.quest_req_id && item.quest_req_id !== questId) return false;

            // タスク2: 崩壊拠点（Prosperity=1）では闇市アイテム以外を非表示
            if (isRuined && !item.is_black_market) return false;

            if (item.min_prosperity > prosperityLevel) return false;

            const tags = item.nation_tags || [];
            // [Logic-Expert] nation_tags\u304c\u7a7a/null\u306e\u30a2\u30a4\u30c6\u30e0\u306f\u300c\u3069\u3053\u3067\u3082\u8ca9\u58f2\u300d\u3068\u307f\u306a\u3059
            if (tags.length === 0) return true;

            const nationTag = `loc_${rulingNation.toLowerCase()}`;
            // [Logic-Expert] ruling_nation\u304cNeutral\uff08\u521d\u671f\u62e0\u70b9\u7b49\uff09\u306e\u5834\u5408\u306f
            // loc_all\u30bf\u30b0\u306e\u307f\u8868\u793a\u3059\u308b
            const isNationMatch = rulingNation === 'Neutral'
                ? tags.includes('loc_all')
                : tags.includes('loc_all') || tags.includes(nationTag);
            if (!isNationMatch) return false;

            if (item.is_black_market) {
                const isDark = (profile.alignment?.evil || 0) > 20;
                if (item.slug === 'item_elixir_forbidden') {
                    if (!isRuined) return false;
                } else {
                    if (!isRuined && !isDark) return false;
                }
            }

            // レベルベースの出現条件
            const playerLevel = profile.level || 1;
            const itemAny = item as any;
            if (itemAny.min_level && playerLevel < itemAny.min_level) return false;

            // スキルカードはLv3以降に解禁（序盤の商品数を絞る）
            if (item.type === 'skill' || itemAny.type === 'skill_card') {
                if (playerLevel < 3) return false;
                const deckCap = profile.max_deck_cost || 10;
                const cardCost = itemAny.cost || itemAny.effect_data?.cost_val || itemAny.cost_val || 0;
                if (cardCost > deckCap + 2) return false;
            }

            return true;
        }).map(item => {
            // タスク1: インフレ係数を先に適用し、その後に初心者保護割引を乗算する
            let price = Math.floor(item.base_price * priceMultiplier);
            // 闇市アイテム（禁術の秘薬等）は初心者保護の対象外（強力なゴールドシンクのため）
            if (isNewbie && !item.is_black_market) price = Math.floor(price * 0.5);
            return {
                ...item,
                current_price: price,
                is_quest_exclusive: (questId && item.quest_req_id === questId)
            };
        });

        // [Logic-Expert] rumoredItemsは初回リリースでは常に非表示 (UI側でも描画を除去済み)。
        // Service Role修正で実際の国家名が返るようになりリグレッションが発生したため、
        // API側でも確実に空配列を返す。
        const rumoredItems: any[] = [];


        return NextResponse.json({
            items: filteredItems,
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

// POST: Buy Item
export async function POST(req: Request) {
    try {
        const { item_id } = await req.json();
        const profile = await getUserProfile(req);
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 0.5 Check Embargo Mode
        if (profile.current_location_id) {
            const { data: repData } = await supabaseService.from('reputations').select('reputation_score').eq('user_id', profile.id).eq('location_id', profile.current_location_id).maybeSingle();
            if (repData && (repData.reputation_score || 0) < 0) {
                return NextResponse.json({ error: '出禁状態: この拠点での名声が低すぎるため、取引を拒否されました。' }, { status: 403 });
            }
        }

        // 1. Fetch Item
        const { data: itemData, error: itemError } = await supabaseService
            .from('items')
            .select('*')
            .eq('id', item_id)
            .single();

        if (itemError || !itemData) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        const item = itemData as ItemDB;

        // 2. Calculate Price (仕様: spec_v6_shop_system.md §3.2 / §5)
        let prosperityLevel = 3;
        if (profile.current_location_id) {
            const { data: loc } = await supabaseService.from('locations').select('prosperity_level').eq('id', profile.current_location_id).maybeSingle();
            if (loc) prosperityLevel = loc.prosperity_level || 3;
        }

        // タスク1: インフレ係数を先に確定し、その後に初心者割引を適用する（GETと同一ロジック）
        const inflationMap: Record<number, number> = { 5: 1.0, 4: 1.0, 3: 1.2, 2: 1.5, 1: 3.0 };
        const priceMultiplier = inflationMap[prosperityLevel] || 1.0;
        const isNewbie = (profile.level || 1) <= 5;

        // インフレ後の価格を算出し、初心者保護は闇市アイテム以外に適用
        let finalPrice = Math.floor(item.base_price * priceMultiplier);
        if (isNewbie && !item.is_black_market) finalPrice = Math.floor(finalPrice * 0.5);

        // 3. Check Gold
        if (profile.gold < finalPrice) {
            return NextResponse.json({
                error: '金貨が足りません！',
                debug: {
                    required: finalPrice,
                    current: profile.gold,
                    userId: profile.id
                }
            }, { status: 400 });
        }

        // 4. Duplicate Check for Skills
        if (item.type === 'skill') {
            const { count } = await supabaseService.from('inventory').select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id)
                .eq('item_id', item.id);
            if (count && count > 0) {
                return NextResponse.json({ error: '既に習得済みです。' }, { status: 400 });
            }
        }

        // 5. Transaction using Service Role (Bypass RLS)
        const { error: goldError } = await supabaseService
            .rpc('increment_gold', { p_user_id: profile.id, p_amount: -finalPrice });

        if (goldError) throw goldError;

        // 6. Handle Special Items (e.g. Capital Pass)
        if (item.slug === 'capital_pass') {
            const currentDays = profile.accumulated_days || 0;
            // Grants generic 30-day pass to all capitals for simplicity, or we can check location.
            // Assuming giving access to all capitals if a general pass is bought.
            const newExpiry = currentDays + 30;
            const updatedPasses = { ...(profile.pass_expires_at || {}) } as Record<string, number>;
            
            // To be precise, we fetch capitals and set expiry for them. Or just set a wildcard '*'
            // Let's set it for the known capitals: loc_roland, loc_markand, loc_holy_empire, loc_yato
            const capitals = ['loc_roland', 'loc_markand', 'loc_holy_empire', 'loc_yato'];
            for (const cap of capitals) {
                updatedPasses[cap] = Math.max(updatedPasses[cap] || 0, newExpiry);
            }

            const { error: passUpdateError } = await supabaseService
                .from('user_profiles')
                .update({ pass_expires_at: updatedPasses })
                .eq('id', profile.id);

            if (passUpdateError) {
                console.error("Pass Update Failed", passUpdateError);
                await supabaseService.rpc('increment_gold', { p_user_id: profile.id, p_amount: finalPrice });
                return NextResponse.json({ error: 'Transaction failed', details: passUpdateError.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, new_gold: profile.gold - finalPrice, message: '全首都共通の30日通行許可証を購入しました。' });
        }

        // B. Add to Inventory (Normal Items)
        const { error: invError } = await supabaseService
            .from('inventory')
            .insert({
                user_id: profile.id,
                item_id: item.id,
                quantity: 1,
                is_equipped: false,
                is_skill: (item.type === 'skill'),
                acquired_at: new Date().toISOString()
            });

        if (invError) {
            console.error("Inventory Insert Failed", invError);
            // Refund
            await supabaseService.rpc('increment_gold', { p_user_id: profile.id, p_amount: finalPrice });
            return NextResponse.json({ error: 'Transaction failed', details: invError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, new_gold: profile.gold - finalPrice });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

