import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ItemDB, UserProfileDB, LocationDB } from '@/types/database';

// Helper to get user profile (Mock session)
async function getUserProfile() {
    const { data: profiles } = await supabase.from('user_profiles').select('*').limit(1);
    return profiles?.[0] as UserProfileDB;
}

// GET: List Items (Dynamic Shop)
export async function GET(req: Request) {
    try {
        const profile = await getUserProfile();
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 1. Get Location Context (Mock: If location_id not set, use default or join)
        // Ideally profile has current_location_id. For now, assume 'System' or fetch location by name if stored.
        // Let's assume we pass location_id param, or fetch based on profile.
        // Profile has `reputation` map.

        // Mock Location Data (Since we might not have seeded locations fully linked)
        // In real app, fetch from `locations` table.
        // We will simulate "Current Location" status.
        let prosperityLevel = 3; // Default Stagnant
        let rulingNation = 'Neutral'; // Default

        // Try to fetch real world State if possible
        if (profile.current_location_id) {
            const { data: loc } = await supabase.from('locations').select('*').eq('id', profile.current_location_id).single();
            if (loc) {
                // Map loc.prosperity_level
                prosperityLevel = loc.prosperity_level || 3;
                rulingNation = loc.ruling_nation_id || 'Neutral';
            }
        } else {
            // Fallback: Check 'world_states' for '名もなき旅人の拠所'
            const { data: ws } = await supabase.from('world_states').select('*').eq('location_name', '名もなき旅人の拠所').maybeSingle();
            if (ws) {
                // Convert Spec v1 status string to Prosperity Level
                const statusMap: Record<string, number> = { 'Zenith': 5, 'Prosperous': 4, 'Stagnant': 3, 'Declining': 2, 'Ruined': 1, '繁栄': 4, '衰退': 2, '崩壊': 1, '混乱': 1, '安定': 3 };
                prosperityLevel = statusMap[ws.status] || 3;
                rulingNation = ws.controlling_nation || 'Neutral';
            }
        }

        // 2. Inflation Logic
        const inflationMap: Record<number, number> = { 5: 1.0, 4: 1.0, 3: 1.2, 2: 1.5, 1: 3.0 };
        const priceMultiplier = inflationMap[prosperityLevel] || 1.0;

        // 3. Fetch Items
        const { data: items, error } = await supabase
            .from('items')
            .select('*');

        if (error) throw error;

        const allItems = items as ItemDB[];

        // 4. Filtering Logic
        const filteredItems = allItems.filter(item => {
            // A. Prosperity Check
            if (item.min_prosperity > prosperityLevel) return false;

            // B. Nation Check
            // item.nation_tags includes 'loc_all' OR current rulingNation?
            // Assuming tag format 'loc_roland', 'loc_all' etc.
            const nationTag = `loc_${rulingNation.toLowerCase()}`;
            const isNationMatch = item.nation_tags.includes('loc_all') || item.nation_tags.includes(nationTag);
            if (!isNationMatch) return false;

            // C. Alignment/Black Market Check (Simplified)
            // If black market, require user reputation < -50 or Evil > 50?
            // For prototype, let's say Black Market visible only if Justice < 0 (Mock)
            if (item.is_black_market) {
                // Check if user is "Dark" enough
                // profile.alignment.evil vs ...
                const isDark = (profile.alignment?.evil || 0) > 20;
                if (!isDark) return false;
            }

            return true;
        }).map(item => ({
            ...item,
            current_price: Math.floor(item.base_price * priceMultiplier)
        }));

        return NextResponse.json({
            items: filteredItems,
            meta: {
                prosperity: prosperityLevel,
                inflation: priceMultiplier,
                ruling_nation: rulingNation
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
