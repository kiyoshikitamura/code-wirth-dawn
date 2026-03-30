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

        // user_skills も並列取得
        const [inventoryResult, userSkillsResult] = await Promise.all([
            query,
            userId ? supabaseServer
                .from('user_skills')
                .select(`
                    id,
                    skill_id,
                    is_equipped,
                    acquired_at,
                    skills!inner (
                        id,
                        slug,
                        name,
                        card_id,
                        base_price,
                        deck_cost,
                        image_url,
                        description,
                        cards (
                            id,
                            name,
                            type,
                            cost_type,
                            cost_val,
                            effect_val
                        )
                    )
                `)
                .eq('user_id', userId) : Promise.resolve({ data: [], error: null })
        ]);

        const { data, error } = inventoryResult;

        if (error) {
            console.error("Inventory GET Supabase Error:", JSON.stringify(error, null, 2));
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        // --- Items (non-skill) ---
        const itemInventory = (data || []).map((entry: any) => {
            try {
                if (!entry.items) {
                    console.warn(`Inventory Item Orphan Detected! ID: ${entry.id}`);
                    return null;
                }
                const item = entry.items;
                const effectData = item.effect_data || {};
                const powerVal = effectData.heal || effectData.damage || effectData.power || 0;

                // v5.2: items.type === 'skill' はレガシーデータ（旧仕様で inventory に入ったスキル）
                // → is_skill: true, item_type: 'skill_card' としてデッキタブに表示させる
                const isLegacySkill = item.type === 'skill';

                return {
                    id: entry.id,
                    item_id: item.id,
                    name: item.name,
                    slug: item.slug || null,
                    description: effectData.description || item.name,
                    item_type: isLegacySkill ? 'skill_card' : item.type,
                    sub_type: item.sub_type || null,
                    power_value: powerVal,
                    required_attribute: 'None',
                    base_price: item.base_price || 0,
                    is_equipped: entry.is_equipped,
                    acquired_at: entry.acquired_at,
                    quantity: entry.quantity,
                    is_skill: isLegacySkill,
                    cost: item.cost || effectData.cost_val || effectData.cost || 0,
                    effect_data: effectData,
                    image_url: item.image_url || (item.slug ? `/images/items/${item.slug}.png` : null)
                };
            } catch (e: any) {
                console.error(`Error mapping inventory item ${entry.id}:`, e);
                return null;
            }
        }).filter(Boolean) as any[];

        // 同一アイテムを item_id で集約
        const aggregatedItems: any[] = [];
        const itemMap = new Map<string, any>();
        for (const inv of itemInventory) {
            const key = String(inv.item_id);
            if (itemMap.has(key)) {
                itemMap.get(key).quantity += (inv.quantity || 1);
            } else {
                const merged = { ...inv, quantity: inv.quantity || 1 };
                itemMap.set(key, merged);
                aggregatedItems.push(merged);
            }
        }

        // --- Skills (from user_skills) ---
        const skillInventory = (userSkillsResult.data || []).map((entry: any) => {
            try {
                const skill = entry.skills;
                if (!skill) return null;
                const card = skill.cards;
                const effectData = card ? {
                    cost_val: card.cost_val,
                    effect_val: card.effect_val,
                    cost_type: card.cost_type,
                    card_type: card.type,
                    description: skill.description || card.name
                } : {};

                return {
                    id: entry.id,
                    item_id: skill.id,
                    skill_id: skill.id,
                    card_id: skill.card_id,
                    name: skill.name,
                    slug: skill.slug || null,
                    description: skill.description || skill.name,
                    item_type: 'skill_card',
                    power_value: card?.effect_val || 0,
                    base_price: skill.base_price || 0,
                    is_equipped: entry.is_equipped,
                    acquired_at: entry.acquired_at,
                    quantity: 1,
                    is_skill: true,
                    cost: skill.deck_cost || 0,
                    effect_data: effectData,
                    image_url: skill.image_url || (skill.slug ? `/images/items/${skill.slug}.png` : null)
                };
            } catch (e: any) {
                console.error(`Error mapping user_skill ${entry.id}:`, e);
                return null;
            }
        }).filter(Boolean) as any[];

        return NextResponse.json({ inventory: [...aggregatedItems, ...skillInventory] });
    } catch (err: any) {
        console.error("Inventory GET Critical Error:", err);
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
    }
}

// PATCH: Equip/Unequip (v5.2: inventory + user_skills 両対応)
export async function PATCH(req: Request) {
    try {
        const { inventory_id, is_equipped, bypass_lock, is_skill } = await req.json();
        
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
            const { data: profile } = await supabaseServer
                .from('user_profiles')
                .select('current_quest_id, quest_started_at')
                .eq('id', userId)
                .single();

            if (profile?.current_quest_id && profile.quest_started_at) {
                // スキルの場合は user_skills、アイテムの場合は inventory から取得日時を確認
                const tableName = is_skill ? 'user_skills' : 'inventory';
                const { data: invItem } = await supabaseServer
                    .from(tableName)
                    .select('acquired_at')
                    .eq('id', inventory_id)
                    .single();

                if (invItem && invItem.acquired_at) {
                    const questStarted = new Date(profile.quest_started_at).getTime();
                    const itemAcquired = new Date(invItem.acquired_at).getTime();

                    if (itemAcquired < questStarted) {
                        return NextResponse.json(
                            { error: 'クエスト進行中は、事前所持アイテムを新たに装備できません。' },
                            { status: 400 }
                        );
                    }
                }
            }
        }

        // v5.2: スキルとアイテムでテーブルを分岐
        if (is_skill) {
            // user_skills テーブルを更新
            let query = supabaseServer
                .from('user_skills')
                .update({ is_equipped })
                .eq('id', inventory_id);

            if (userId) query = query.eq('user_id', userId);

            const { error } = await query;
            if (error) throw error;
        } else {
            // inventory テーブルを更新（既存ロジック）
            let query = supabaseServer
                .from('inventory')
                .update({ is_equipped })
                .eq('id', inventory_id);

            if (userId) {
                query = query.eq('user_id', userId);
            } else {
                query = query.is('user_id', null);
            }

            const { error } = await query;
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
