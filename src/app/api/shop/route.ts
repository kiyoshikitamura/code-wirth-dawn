import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseService } from '@/lib/supabase-service';
import { ItemDB, UserProfileDB } from '@/types/game';
import { DEMO_USER_ID } from '@/utils/constants';

// Helper to get user profile (Prototype: try to find by ID if passed, else first or demo)
async function getUserProfile(req: Request) {
    let targetUserId = DEMO_USER_ID;

    // Attempt to get user from Auth (if token passed)
    const authHeader = req.headers.get('authorization');
    console.log(`[Shop] Auth Header: ${authHeader ? (authHeader.substring(0, 10) + '...') : 'Missing'}`);

    if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
            console.error("Auth User Error:", error.message);
            throw new Error("Authentication failed: " + error.message);
        }
        if (user) {
            console.log(`[Shop] Resolved User via Auth: ${user.id}`);
            targetUserId = user.id;
        } else {
            throw new Error("Authentication failed: User not found");
        }
    } else {
        console.warn("[Shop] No Auth Header, using DEMO_USER_ID");
    }

    const { data: profile } = await supabase
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

        // 1. Get Location Context
        let prosperityLevel = 3;
        let rulingNation = 'Neutral';
        let locationName = 'Unknown';

        if (profile.current_location_id) {
            const { data: loc } = await supabase.from('locations').select('*').eq('id', profile.current_location_id).single();
            if (loc) {
                prosperityLevel = loc.prosperity_level || 3;
                rulingNation = loc.ruling_nation_id || 'Neutral';
                locationName = loc.name;
            }
        }

        // 2. Inflation Logic
        const inflationMap: Record<number, number> = { 5: 1.0, 4: 1.0, 3: 1.2, 2: 1.5, 1: 3.0 };
        let priceMultiplier = inflationMap[prosperityLevel] || 1.0;

        const isNewbie = (profile.level || 1) <= 5;
        if (isNewbie) priceMultiplier = 1.0;

        // 3. Fetch Items
        const { data: items, error } = await supabase.from('items').select('*');
        if (error) throw error;
        const allItems = items as ItemDB[];

        // 4. Filtering Logic
        const filteredItems = allItems.filter(item => {
            if (questId && item.quest_req_id === questId) return true;
            if (item.quest_req_id && item.quest_req_id !== questId) return false;
            if (item.min_prosperity > prosperityLevel) return false;

            const tags = item.nation_tags || [];
            const nationTag = `loc_${rulingNation.toLowerCase()}`;
            const isNationMatch = tags.includes('loc_all') || tags.includes(nationTag);
            if (!isNationMatch) return false;

            if (item.is_black_market) {
                const isRuined = prosperityLevel === 1;
                const isDark = (profile.alignment?.evil || 0) > 20;
                if (!isRuined && !isDark) return false;
            }
            return true;
        }).map(item => {
            let multiplier = priceMultiplier;
            if (item.is_black_market && isNewbie) multiplier = inflationMap[prosperityLevel] || 1.0;
            return {
                ...item,
                current_price: Math.floor(item.base_price * multiplier),
                is_quest_exclusive: (questId && item.quest_req_id === questId)
            };
        });

        return NextResponse.json({
            items: filteredItems,
            meta: {
                location: locationName,
                prosperity: prosperityLevel,
                inflation: priceMultiplier,
                ruling_nation: rulingNation,
                is_newbie_protected: isNewbie
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

        if (profile.id === DEMO_USER_ID) {
            const authHeader = req.headers.get('authorization');
            if (!authHeader || authHeader.indexOf('Bearer') === -1) {
                return NextResponse.json({ error: "Login required to purchase." }, { status: 401 });
            }
        }

        // 1. Fetch Item
        const { data: itemData, error: itemError } = await supabase
            .from('items')
            .select('*')
            .eq('id', item_id)
            .single();

        if (itemError || !itemData) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        const item = itemData as ItemDB;

        // 2. Calculate Price
        let prosperityLevel = 3;
        if (profile.current_location_id) {
            const { data: loc } = await supabase.from('locations').select('prosperity_level').eq('id', profile.current_location_id).maybeSingle();
            if (loc) prosperityLevel = loc.prosperity_level || 3;
        }

        const inflationMap: Record<number, number> = { 5: 1.0, 4: 1.0, 3: 1.2, 2: 1.5, 1: 3.0 };
        let priceMultiplier = inflationMap[prosperityLevel] || 1.0;

        // Newbie protection: match GET handler logic
        const isNewbie = (profile.level || 1) <= 5;
        if (isNewbie) priceMultiplier = 1.0;

        const finalPrice = Math.floor(item.base_price * priceMultiplier);

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
            const { count } = await supabase.from('inventory').select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id)
                .eq('item_id', item.id);
            if (count && count > 0) {
                return NextResponse.json({ error: '既に習得済みです。' }, { status: 400 });
            }
        }

        // 5. Transaction using Service Role (Bypass RLS)
        // A. Deduct Gold
        const { error: goldError } = await supabaseService
            .from('user_profiles')
            .update({ gold: profile.gold - finalPrice })
            .eq('id', profile.id);

        if (goldError) throw goldError;

        // B. Add to Inventory
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
            await supabaseService.from('user_profiles').update({ gold: profile.gold }).eq('id', profile.id);
            return NextResponse.json({ error: 'Transaction failed', details: invError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, new_gold: profile.gold - finalPrice });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

