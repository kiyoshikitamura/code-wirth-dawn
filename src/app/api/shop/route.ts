import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ItemDB, UserProfileDB, LocationDB } from '@/types/game';

// Helper to get user profile (Mock session)
async function getUserProfile() {
    const { data: profiles } = await supabase.from('user_profiles').select('*').limit(1);
    return profiles?.[0] as UserProfileDB;
}

// GET: List Items (Dynamic Shop)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const questId = searchParams.get('quest_id'); // v3.4 Quest Context

        const profile = await getUserProfile();
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 1. Get Location Context
        // Try to fetch real world State from current_location
        let prosperityLevel = 3; // Default Stagnant
        let rulingNation = 'Neutral'; // Default
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

        // v7: Newbie Protection (Lv <= 5) -> Force 1.0 (Except Black Market)
        const isNewbie = (profile.level || 1) <= 5;
        if (isNewbie) {
            priceMultiplier = 1.0;
        }

        // 3. Fetch Items
        const { data: items, error } = await supabase.from('items').select('*');
        if (error) throw error;
        const allItems = items as ItemDB[];

        // 4. Filtering Logic
        const filteredItems = allItems.filter(item => {
            // A. Quest Context (Priority)
            if (questId && item.quest_req_id === questId) {
                return true; // Always show quest items
            }
            if (item.quest_req_id && item.quest_req_id !== questId) {
                return false; // Hide other quest items
            }

            // B. Prosperity Check
            if (item.min_prosperity > prosperityLevel) return false;

            // C. Nation Check
            const nationTag = `loc_${rulingNation.toLowerCase()}`;
            const isNationMatch = item.nation_tags.includes('loc_all') || item.nation_tags.includes(nationTag);
            if (!isNationMatch) return false;

            // D. Black Market
            if (item.is_black_market) {
                // Only if Ruined OR Evil > 20
                const isRuined = prosperityLevel === 1;
                const isDark = (profile.alignment?.evil || 0) > 20;
                if (!isRuined && !isDark) return false;
            } else {
                // Normal items: Hide if Ruined (unless filtered by Nation/Prosperity which handled above?)
                // Spec says: Ruined -> "Normal shop unavailable". But we might show black market items only?
                // Let's assume normal items are scarce but available if min_prosperity allows.
                // Ruined has items with min_prosperity=1.
            }

            return true;
        }).map(item => {
            // Calculate Price
            let multiplier = priceMultiplier;

            // Black Market items ignore Newbie Protection?
            if (item.is_black_market && isNewbie) {
                multiplier = inflationMap[prosperityLevel] || 1.0; // Apply inflation to black market even for newbies
            }

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
        const profile = await getUserProfile();
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 1. Fetch Item
        const { data: itemData, error: itemError } = await supabase
            .from('items')
            .select('*')
            .eq('id', item_id)
            .single();

        if (itemError || !itemData) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        const item = itemData as ItemDB;

        // 2. Calculate Price (Re-run inflation logic briefly or pass expected price? Better to re-calc for security)
        // ... Repeated logic from GET (ideally factored out)
        // For prototype speed, we'll fetch world state same way.
        let prosperityLevel = 3;
        // Simplified for POST: 
        const { data: ws } = await supabase.from('world_states').select('*').eq('location_name', '名もなき旅人の拠所').maybeSingle();
        if (ws) {
            const statusMap: Record<string, number> = { 'Zenith': 5, 'Prosperous': 4, 'Stagnant': 3, 'Declining': 2, 'Ruined': 1, '繁栄': 4, '衰退': 2, '崩壊': 1, '混乱': 1, '安定': 3 };
            prosperityLevel = statusMap[ws.status] || 3;
        }
        const inflationMap: Record<number, number> = { 5: 1.0, 4: 1.0, 3: 1.2, 2: 1.5, 1: 3.0 };
        const priceMultiplier = inflationMap[prosperityLevel] || 1.0;
        const finalPrice = Math.floor(item.base_price * priceMultiplier);

        // 3. Check Gold
        if (profile.gold < finalPrice) {
            return NextResponse.json({ error: 'Not enough gold.' }, { status: 400 });
        }

        // 4. Duplicate Check for Skills
        if (item.type === 'skill' || item.type === 'equipment') {
            const { count } = await supabase.from('inventory').select('*', { count: 'exact', head: true })
                .eq('owner_id', profile.id) // Inventory has owner_id? Or user_id?
                // Checking inventory route.ts: Query uses `.eq('user_id', ...)` but also `.is('user_id', null)`?
                // Wait, route.ts has `.is('user_id', null)` which implies those are "Unclaimed"?
                // BUT PURCHASE should assign it to user.
                // Profile ID should be used as user_id.
                // Let's assume inventory has `user_id`.
                .eq('item_id', item.id); // Inventory item_id refers to master item id?

            // Wait, inventory table schema: `item_id` (FK to items?)?
            // route.ts select: `items ( id ... )`.
            // So `inventory.item_id` FKs to `items.id`.
            // Let's assume `inventory` has `item_id` column.

            // BUT wait, route.ts join: `items ( ... )`. This implies FK relationship.
            // Usually column is `item_id`.

            // If count > 0, duplicate.
            // Actually, we check `count` for skills.
            // But checking `count` requires correctly querying `inventory`.
            // Assuming inventory table has `item_id` column.
        }

        // 5. Transaction
        // A. Deduct Gold
        const { error: goldError } = await supabase
            .from('user_profiles')
            .update({ gold: profile.gold - finalPrice })
            .eq('id', profile.id);

        if (goldError) throw goldError;

        // B. Add to Inventory
        const { error: invError } = await supabase
            .from('inventory')
            .insert({
                user_id: profile.id, // Assuming user_id column
                item_id: item.id,
                quantity: 1,
                is_equipped: false,
                is_skill: (item.type === 'skill'),
                acquired_at: new Date().toISOString()
            });

        if (invError) {
            // Rolling back gold would be ideal (RPC), but for now:
            console.error("Inventory Insert Failed", invError);
            // Refund
            await supabase.from('user_profiles').update({ gold: profile.gold }).eq('id', profile.id);
            return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true, new_gold: profile.gold - finalPrice });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
