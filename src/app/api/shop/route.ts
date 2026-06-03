import { NextResponse } from 'next/server';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';
import { ItemDB, UserProfileDB, SkillDB } from '@/types/game';
import { getUserAlignmentPcts, isDarkMarketEligible } from '@/lib/alignment';
import { getAuthenticatedProfile, checkEmbargo, getInflationMultiplier, AuthError } from '@/lib/shopAuth';

// GET: List Items (Dynamic Shop)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const questId = searchParams.get('quest_id');

        const profile = await getAuthenticatedProfile(req);

        // 1. Get Location Context, Embargo, Items — 並列実行で高速化
        let prosperityLevel = 3;
        let rulingNation = 'Neutral';
        let locationName = 'Unknown';
        let isEmbargoed = false;

        // まずlocationを取得してnameを確定
        // v4.2: world_states.controlling_nation（動的支配国）を優先参照。ruling_nation_idは初期国家（静的）のためフォールバック用。
        if (profile.current_location_id) {
            const { data: locData } = await supabaseService.from('locations').select('id, name, slug, prosperity_level, ruling_nation_id').eq('id', profile.current_location_id).single();
            if (locData) {
                prosperityLevel = locData.prosperity_level || 3;
                locationName = locData.name;

                // world_states は location_name (TEXT FK) でリレーションされるため、別クエリで取得
                const { data: ws } = await supabaseService.from('world_states')
                    .select('controlling_nation')
                    .eq('location_name', locData.name)
                    .maybeSingle();
                rulingNation = ws?.controlling_nation || locData.ruling_nation_id || 'Neutral';
            }
        }

        // 通行許可証の slug 一覧
        const PASS_SLUGS = ['item_pass_roland', 'item_pass_karyu', 'item_pass_yato', 'item_pass_markand'];

        // 並列: reputations, items, skills, cards, 通行許可証, 所持済み通行許可証 を同時取得
        const [repResult, itemsResult, skillsResult, cardsResult, passResult, ownedPassResult] = await Promise.all([
            locationName !== 'Unknown'
                ? supabaseService.from('reputations').select('score').eq('user_id', profile.id).eq('location_name', locationName).maybeSingle()
                : Promise.resolve({ data: null, error: null }),
            supabaseService.from('items').select('id, slug, name, type, sub_type, base_price, description, effect_data, nation_tags, min_prosperity, is_black_market, quest_req_id').neq('type', 'skill').neq('type', 'key_item').neq('type', 'material'), // v2.9.3d: スキル・キーアイテム・素材を除外（装備品は枠数制限付きで表示）
            supabaseService.from('skills').select('id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url'),
            supabaseService.from('cards').select('id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description'),
            // 通行許可証は全道具屋で表示するため別途取得
            supabaseService.from('items').select('id, slug, name, type, base_price, description, effect_data, nation_tags, min_prosperity, is_black_market').in('slug', PASS_SLUGS),
            // ユーザーが既に所持している通行許可証を確認
            supabaseService.from('inventory').select('item_id, items!inner(slug)').eq('user_id', profile.id).in('items.slug', PASS_SLUGS)
        ]);

        if (repResult.data && (repResult.data.score || 0) < 0) {
            isEmbargoed = true;
        }
        if (itemsResult.error) throw itemsResult.error;
        if (skillsResult.error) {
            console.error('[Shop API] Skills query error:', JSON.stringify(skillsResult.error));
        }
        const allItems = itemsResult.data as ItemDB[];
        const allSkills = (skillsResult.data || []) as any[];
        // cards を id -> card オブジェクトの Map に変換
        const cardsMap = new Map<number, any>();
        for (const card of (cardsResult.data || [])) {
            cardsMap.set(card.id, card);
        }
        console.log(`[Shop API] Skills fetched: ${allSkills.length}, Cards fetched: ${cardsResult.data?.length || 0}, Location: ${locationName}, Prosperity: ${prosperityLevel}, Nation: ${rulingNation}`);
        const passItems = (passResult.data || []) as ItemDB[];
        const ownedPassSlugs = new Set((ownedPassResult.data || []).map((inv: any) => inv.items?.slug).filter(Boolean));

        // 2. Inflation Logic
        // inflationMap: 繁栄度ごとの価格乗数（仕様: spec_v6_shop_system.md §5）
        const inflationMap: Record<number, number> = { 5: 1.0, 4: 1.0, 3: 1.2, 2: 1.5, 1: 3.0 };
        const priceMultiplier = inflationMap[prosperityLevel] || 1.0;


        // 3. Helper: nation_tags フィルタ共通ロジック
        // DB国家名 → CSVタグ名のマッピング（クエストAPI location/quests/route.ts と同一）
        const nationSlugToLocationTag: Record<string, string> = {
            'Roland': 'loc_holy_empire',
            'Markand': 'loc_marcund',
            'Yato': 'loc_yatoshin',
            'Karyu': 'loc_haryu',
        };
        const nationTag = nationSlugToLocationTag[rulingNation] || `loc_${rulingNation.toLowerCase()}`;
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
        // v2.9.3e: ボスドロップ専用装備をショップから除外
        // v2.9.3m: 効果未実装のフレーバーアイテムも除外
        const SHOP_EXCLUDE_SLUGS = new Set([
            // ボスドロップ専用
            'item_white_robe', 'item_thief_blade', 'item_pirate_hat', 'item_mino_axe',
            'item_dragon_blood',
            // ストーリー限定装備（クエスト報酬専用）
            'story_gawain_gauntlet', 'story_dragon_fang', 'story_heroic_mail', 'story_dawn_blade',
            // スポットクエスト報酬装備
            'spot_eclipse_bind', 'spot_god_robe',
            'spot_magatama_1', 'spot_magatama_2', 'spot_magatama_3', 'spot_magatama_4',
            'spot_yato_talisman',
            'spot_orb_seiryu', 'spot_orb_byakko', 'spot_orb_suzaku', 'spot_orb_genbu',
            'spot_divine_glaive', 'spot_desert_curse', 'spot_sand_cleaver',
            // クエスト報酬素材・交易品（ショップ販売不可）
            'item_bear_pelt', 'item_supply_box', 'item_healing_herb',
            'item_tengu_fan', 'item_bandit_treasure',
            // 特殊入手のみ（ショップ販売不可）
            'item_royal_decree',
        ]);
        const filteredItems = allItems.filter(item => {
            // 除外リストのアイテムはショップに並べない
            if (item.slug && SHOP_EXCLUDE_SLUGS.has(item.slug)) return false;
            // base_price=0 の装備品はクエスト限定報酬のためショップに並べない
            if (item.type === 'equipment' && (item.base_price || 0) <= 0) return false;
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
                const isDark = isDarkMarketEligible(getUserAlignmentPcts(profile as any));
                if (!isRuined && !isDark) return false;
            }

            return true;
        }).map(item => {
            let price = Math.floor(item.base_price * priceMultiplier);
            return {
                ...item,
                image_url: item.slug ? `/images/items/${item.slug}.png` : null,
                current_price: price,
                is_quest_exclusive: (questId && item.quest_req_id === questId),
                _source: 'item' as const
            };
        });

        // 4b. 通行許可証をショップに追加（全道具屋共通、国・繁栄度フィルタ無視）
        const filteredPasses = passItems.map(item => {
            let price = Math.floor(item.base_price * priceMultiplier);
            const isOwned = ownedPassSlugs.has(item.slug);
            return {
                ...item,
                type: 'key_item' as const,
                image_url: item.slug ? `/images/items/${item.slug}.png` : null,
                current_price: price,
                is_owned: isOwned,
                _source: 'item' as const
            };
        });

        // 5. Skills Filtering Logic
        const filteredSkills = allSkills.filter(skill => {
            // base_price=0 のスキルはクエスト報酬専用のためショップに並べない
            if ((skill.base_price || 0) <= 0) return false;
            if (isRuined && !skill.is_black_market) {
                console.log(`[Shop] SKIP skill ${skill.slug}: isRuined && not black market`);
                return false;
            }
            if ((skill.min_prosperity || 1) > prosperityLevel) {
                console.log(`[Shop] SKIP skill ${skill.slug}: min_prosperity=${skill.min_prosperity} > prosperityLevel=${prosperityLevel}`);
                return false;
            }
            
            const tags = Array.isArray(skill.nation_tags) ? skill.nation_tags : (skill.nation_tags ? [skill.nation_tags] : []);
            if (!matchesNation(tags)) {
                console.log(`[Shop] SKIP skill ${skill.slug}: nation_tags=${JSON.stringify(skill.nation_tags)} doesn't match rulingNation=${rulingNation}`);
                return false;
            }

            if (skill.is_black_market) {
                const isDark = isDarkMarketEligible(getUserAlignmentPcts(profile as any));
                if (!isRuined && !isDark) {
                    console.log(`[Shop] SKIP skill ${skill.slug}: black market but not dark/ruined`);
                    return false;
                }
            }

            // スキルカードはデッキコスト上限+2以内のものを表示
            const deckCap = profile.max_deck_cost || 10;
            const cardCost = skill.deck_cost || 0;
            if (cardCost > deckCap + 2) {
                console.log(`[Shop] SKIP skill ${skill.slug}: deck_cost=${cardCost} > deckCap+2=${deckCap+2}`);
                return false;
            }

            return true;
        }).map(skill => {
            let price = Math.floor(skill.base_price * priceMultiplier);
            const card = cardsMap.get(skill.card_id);
            const cardDesc = card?.description || null;
            const effectData = card ? {
                power: card.effect_val || 0,
                ap_cost: card.ap_cost ?? 0,
                deck_cost: skill.deck_cost ?? 0,
                card_type: card.type,
                target_type: card.target_type,
                effect_id: card.effect_id || null,
                description: cardDesc,
            } : { description: cardDesc };
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
                effect_data: effectData,
                description: cardDesc,
                current_price: price,
                _source: 'skill' as const
            };
        });

        // 6. v2.9.3d: カテゴリ別枠数制限付きランダム陳列
        // 消耗品5, スキル5, 武器3, 防具3, アクセサリ3, 通行許可証1, 交易品2 = 最大22点
        const shuffleAndPick = <T>(arr: T[], n: number): T[] => {
            const shuffled = [...arr].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, n);
        };

        const consumables = filteredItems.filter(i => i.type === 'consumable');
        const tradeGoods = filteredItems.filter(i => i.type === 'trade_good');
        const weapons = filteredItems.filter(i => i.type === 'equipment' && (i as any).sub_type === 'weapon');
        const armors = filteredItems.filter(i => i.type === 'equipment' && (i as any).sub_type === 'armor');
        const accessories = filteredItems.filter(i => i.type === 'equipment' && (i as any).sub_type === 'accessory');
        // クエスト専売アイテムは枠制限の対象外（常に表示）
        const questExclusives = filteredItems.filter(i => i.is_quest_exclusive);

        const pickedConsumables = shuffleAndPick(consumables, 5);
        const pickedSkills = shuffleAndPick(filteredSkills, 5);
        const pickedWeapons = shuffleAndPick(weapons, 3);
        const pickedArmors = shuffleAndPick(armors, 3);
        const pickedAccessories = shuffleAndPick(accessories, 3);
        const pickedPasses = shuffleAndPick(filteredPasses, 1);
        const pickedTradeGoods = shuffleAndPick(tradeGoods, 2);

        // カテゴリ優先ソート（武器→防具→アクセサリ→スキル→通行許可証→消耗品→交易品）
        const CATEGORY_ORDER: Record<string, number> = {
            'weapon': 0,
            'armor': 1,
            'accessory': 2,
            'skill_card': 3,
            'key_item': 4,
            'consumable': 5,
            'trade_good': 6,
        };
        const getCategoryOrder = (item: any): number => {
            if (item.type === 'equipment' && item.sub_type) return CATEGORY_ORDER[item.sub_type] ?? 99;
            if (item._source === 'skill' || item.type === 'skill_card') return CATEGORY_ORDER['skill_card'];
            return CATEGORY_ORDER[item.type] ?? 99;
        };

        const allShopItems = [
            ...questExclusives,
            ...pickedWeapons,
            ...pickedArmors,
            ...pickedAccessories,
            ...pickedSkills,
            ...pickedPasses,
            ...pickedConsumables,
            ...pickedTradeGoods
        ].sort((a, b) => {
            const catA = getCategoryOrder(a);
            const catB = getCategoryOrder(b);
            if (catA !== catB) return catA - catB;
            return a.current_price - b.current_price;
        });

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
                is_embargoed: isEmbargoed
            },
            debug: {
                skills_raw_count: allSkills.length,
                skills_filtered_count: pickedSkills.length,
                consumables_pool: consumables.length,
                trade_goods_pool: tradeGoods.length,
                skills_error: skillsResult.error ? JSON.stringify(skillsResult.error) : null,
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
        const profile = await getAuthenticatedProfile(req);

        // 出禁チェック（共通モジュール）
        await checkEmbargo(profile);

        // 分岐: スキル購入 vs アイテム購入
        if (_source === 'skill') {
            return await handleSkillPurchase(profile, item_id);
        } else {
            return await handleItemPurchase(profile, item_id);
        }

    } catch (e: any) {
        if (e instanceof AuthError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// スキル購入処理
async function handleSkillPurchase(profile: UserProfileDB, skillId: number) {
    // 1. Fetch Skill
    const { data: skillData, error: skillError } = await supabaseService
        .from('skills')
        .select('id, slug, name, base_price, deck_cost, card_id, nation_tags, min_prosperity, is_black_market')
        .eq('id', skillId)
        .single();

    if (skillError || !skillData) return NextResponse.json({ error: 'Skill not found' }, { status: 404 });

    // 2. Calculate Price (L1 v27.3: 共通関数を使用)
    const { multiplier: priceMultiplier } = await getInflationMultiplier(profile.current_location_id);
    let finalPrice = Math.floor(skillData.base_price * priceMultiplier);

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
            is_equipped: false
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
        .select('id, slug, name, type, sub_type, base_price, description, effect_data, nation_tags, min_prosperity, is_black_market, quest_req_id')
        .eq('id', itemId)
        .single();

    if (itemError || !itemData) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    const item = itemData as ItemDB;

    // 2. Calculate Price (L1 v27.3: 共通関数を使用)
    const { multiplier: priceMultiplier, prosperityLevel } = await getInflationMultiplier(profile.current_location_id);
    let finalPrice = Math.floor(item.base_price * priceMultiplier);

    // 2b. 通行許可証の重複購入チェック
    const PASS_SLUGS = ['item_pass_roland', 'item_pass_karyu', 'item_pass_yato', 'item_pass_markand'];
    if (item.slug && PASS_SLUGS.includes(item.slug)) {
        const { count } = await supabaseService
            .from('inventory')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .eq('item_id', item.id);
        if (count && count > 0) {
            return NextResponse.json({ error: 'この通行許可証は既に所持しています。' }, { status: 400 });
        }
    }

    // 2c. v25: 消耗品の所持上限チェック（最大10個）
    if (item.type === 'consumable') {
        const { data: existingRows } = await supabaseService
            .from('inventory')
            .select('id, quantity')
            .eq('user_id', profile.id)
            .eq('item_id', item.id);

        const totalQty = (existingRows || []).reduce((sum: number, row: any) => sum + (row.quantity || 1), 0);
        if (totalQty >= 10) {
            return NextResponse.json({ error: `「${item.name}」は最大10個までしか所持できません。` }, { status: 400 });
        }
    }

    // 2d. 装備品の所持上限チェック（同一アイテム最大3個）
    if (item.type === 'equipment') {
        const { data: existingRows } = await supabaseService
            .from('inventory')
            .select('id, quantity')
            .eq('user_id', profile.id)
            .eq('item_id', item.id);

        const totalQty = (existingRows || []).reduce((sum: number, row: any) => sum + (row.quantity || 1), 0);
        if (totalQty >= 3) {
            return NextResponse.json({ error: `「${item.name}」は最大3個までしか所持できません。` }, { status: 400 });
        }
    }

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

    // Collection: Record item acquisition in history
    try {
        await supabaseService
            .from('user_item_history')
            .insert({ user_id: profile.id, item_id: item.id });
    } catch (histErr) {
        console.warn('[Shop] Item history recording failed:', histErr);
    }

    return NextResponse.json({ success: true, new_gold: profile.gold - finalPrice });
}

