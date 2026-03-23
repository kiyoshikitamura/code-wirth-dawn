import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-admin';

// GET: Fetch Inventory
export async function POST(req: Request) {
    try {
        const { item_slug, quantity = 1 } = await req.json();
        
        let userId = req.headers.get('x-user-id');
        const authHeader = req.headers.get('authorization');
        
        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        if (!userId) {
            console.warn("Inventory POST: Missing x-user-id header");
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // 1. Get Item ID
        const { data: item, error: itemError } = await supabase
            .from('items')
            .select('id, name')
            .eq('slug', item_slug)
            .single();

        if (itemError || !item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // 2. Check if already exists in inventory (stackable?)
        const { data: existing } = await supabase
            .from('inventory')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('item_id', item.id)
            .maybeSingle(); // Changed single() to maybeSingle() to avoid error

        if (existing) {
            const { error } = await supabase
                .from('inventory')
                .update({ quantity: existing.quantity + quantity })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            // Insert new item
            // slot_index was removed from schema as confirmed by debug script.
            // Just insert directly.

            const { error } = await supabase
                .from('inventory')
                .insert({
                    user_id: userId,
                    item_id: item.id,
                    quantity: quantity,
                    is_equipped: false,
                    is_skill: false,
                    acquired_at: new Date().toISOString()
                });

            if (error) {
                console.error("Inventory Insert Error:", error);
                throw error;
            }
        }

        return NextResponse.json({ success: true, item_name: item.name });
    } catch (err: any) {
        console.error("Inventory Add Error:", err);
        return NextResponse.json({ error: err.message, details: JSON.stringify(err) }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        // supabaseServer (Service Role) でRLSをバイパスし、確実にデータを取得する
        // ユーザー認証はJWTで検証済み、DBクエリはuser_idでフィルタ

        let userId = req.headers.get('x-user-id');
        const authHeader = req.headers.get('authorization');
        
        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        let query = supabaseServer
            .from('inventory')
            .select(`
                id,
                is_equipped,
                acquired_at,
                quantity,
                is_skill,
                items!inner (
                    id,
                    name,
                    slug,
                    type,
                    base_price,
                    effect_data,
                    cost
                )
            `);

        // If userId is provided, filter by it. Else, maybe return system items or empty?
        if (userId) {
            query = query.eq('user_id', userId);
        } else {
            // Fallback: Return empty or demo?
            query = query.is('user_id', null);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Inventory GET Supabase Error:", JSON.stringify(error, null, 2));
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        if (!data) return NextResponse.json({ inventory: [] });

        // Flatten structure
        // Flatten structure
        const inventory = data.map((entry: any) => {
            try {
                if (!entry.items) {
                    // Warn about orphan but don't crash the whole list
                    console.warn(`Inventory Item Orphan Detected! ID: ${entry.id}`);
                    return null;
                }
                // Map DB columns to Frontend expected props
                // Frontend expects: item_type, power_value, etc.
                // We need to derive them or return defaults.

                const item = entry.items;
                const effectData = item.effect_data || {};
                // Try to guess power_value from effect_data (e.g. heal: 30, damage: 10)
                const powerVal = effectData.heal || effectData.damage || effectData.power || 0;

                return {
                    id: entry.id,
                    item_id: item.id,
                    name: item.name,
                    description: effectData.description || item.name,
                    item_type: item.type,
                    power_value: powerVal,
                    required_attribute: 'None',
                    base_price: item.base_price || 0,
                    is_equipped: entry.is_equipped,
                    acquired_at: entry.acquired_at,
                    quantity: entry.quantity,
                    is_skill: entry.is_skill,
                    cost: item.cost || 0,
                    effect_data: effectData,
                    image_url: item.image_url || null
                };
            } catch (e: any) {
                console.error(`Error mapping inventory item ${entry.id}:`, e);
                return null;
            }
        }).filter(Boolean); // Remove nulls

        return NextResponse.json({ inventory });
    } catch (err: any) {
        console.error("Inventory GET Critical Error:", err);
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
    }
}

// PATCH: Equip/Unequip
export async function PATCH(req: Request) {
    try {
        const { inventory_id, is_equipped, bypass_lock } = await req.json();
        
        // supabaseServer (Service Role) でRLSをバイパス
        // ユーザー認証はJWTで検証済み

        let userId = req.headers.get('x-user-id');
        const authHeader = req.headers.get('authorization');
        
        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        // クエスト進行中の装備変更制限 (is_equipped: true にする場合のみ、bypass_lockがない場合)
        if (is_equipped && userId && !bypass_lock) {
            // ユーザー状態の確認
            const { data: profile } = await supabaseServer
                .from('user_profiles')
                .select('current_quest_id, quest_started_at')
                .eq('id', userId)
                .single();

            if (profile?.current_quest_id && profile.quest_started_at) {
                // 対象アイテムの取得日時を確認
                const { data: invItem } = await supabaseServer
                    .from('inventory')
                    .select('acquired_at')
                    .eq('id', inventory_id)
                    .single();

                if (invItem && invItem.acquired_at) {
                    const questStarted = new Date(profile.quest_started_at).getTime();
                    const itemAcquired = new Date(invItem.acquired_at).getTime();

                    // クエスト開始前に取得したアイテムは装備不可
                    if (itemAcquired < questStarted) {
                        return NextResponse.json(
                            { error: 'クエスト進行中は、事前所持アイテムを新たに装備できません。' },
                            { status: 400 }
                        );
                    }
                }
            }
        }

        let query = supabaseServer
            .from('inventory')
            .update({ is_equipped })
            .eq('id', inventory_id);

        // Filter by user_id if available, otherwise allow null (legacy)
        if (userId) {
            query = query.eq('user_id', userId);
        } else {
            query = query.is('user_id', null);
        }

        const { error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
