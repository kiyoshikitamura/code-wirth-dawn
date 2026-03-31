import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';

// Helper to get authenticated user ID
async function getUserId(req: Request): Promise<string> {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) return user.id;
    }
    const xUserId = req.headers.get('x-user-id');
    if (xUserId) return xUserId;
    throw new Error('Authentication required');
}

// GET: 装備中のアイテム一覧
export async function GET(req: Request) {
    try {
        const userId = await getUserId(req);

        const { data, error } = await supabaseService
            .from('equipped_items')
            .select(`
                id,
                slot,
                item_id,
                equipped_at,
                items!inner (
                    id, slug, name, type, sub_type, base_price, effect_data
                )
            `)
            .eq('user_id', userId);

        if (error) throw error;

        const equipped = (data || []).map((e: any) => ({
            id: e.id,
            slot: e.slot,
            item_id: e.item_id,
            equipped_at: e.equipped_at,
            item: e.items ? {
                ...e.items,
                image_url: e.items.slug ? `/images/items/${e.items.slug}.png` : null
            } : null
        }));

        // ステータスボーナス合計を計算
        const bonus = { atk: 0, def: 0, hp: 0 };
        for (const eq of equipped) {
            if (eq.item?.effect_data) {
                bonus.atk += eq.item.effect_data.atk_bonus || 0;
                bonus.def += eq.item.effect_data.def_bonus || 0;
                bonus.hp += eq.item.effect_data.hp_bonus || 0;
            }
        }

        return NextResponse.json({ equipped, bonus });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST: 装備品を装着する
export async function POST(req: Request) {
    try {
        const userId = await getUserId(req);
        const { inventory_id, slot } = await req.json();

        if (!inventory_id || !slot) {
            return NextResponse.json({ error: 'inventory_id and slot are required' }, { status: 400 });
        }

        if (!['weapon', 'armor', 'accessory'].includes(slot)) {
            return NextResponse.json({ error: 'Invalid slot. Must be weapon, armor, or accessory' }, { status: 400 });
        }

        // 1. インベントリからアイテム検証
        const { data: invItem, error: invError } = await supabaseService
            .from('inventory')
            .select('id, item_id, user_id, items!inner(id, type, sub_type, effect_data, name)')
            .eq('id', inventory_id)
            .eq('user_id', userId)
            .single();

        if (invError || !invItem) {
            return NextResponse.json({ error: 'Item not found in inventory' }, { status: 404 });
        }

        const item = (invItem as any).items;
        if (item.type !== 'equipment') {
            return NextResponse.json({ error: 'This item is not equipment' }, { status: 400 });
        }

        // sub_type とスロットの整合性チェック
        if (item.sub_type && item.sub_type !== slot) {
            return NextResponse.json({ error: `This item belongs to the ${item.sub_type} slot, not ${slot}` }, { status: 400 });
        }

        // 2. 既存の装備を外す (UPSERT)
        const { data: existing } = await supabaseService
            .from('equipped_items')
            .select('id, item_id')
            .eq('user_id', userId)
            .eq('slot', slot)
            .maybeSingle();

        if (existing) {
            // 既に同じアイテムが装備されている場合はスキップ
            if (existing.item_id === invItem.item_id) {
                return NextResponse.json({ success: true, message: 'Already equipped' });
            }
            // 既存装備を解除
            await supabaseService
                .from('equipped_items')
                .delete()
                .eq('id', existing.id);
        }

        // 3. 新しい装備を装着
        const { error: equipError } = await supabaseService
            .from('equipped_items')
            .insert({
                user_id: userId,
                item_id: invItem.item_id,
                slot: slot,
                equipped_at: new Date().toISOString()
            });

        if (equipError) throw equipError;

        return NextResponse.json({ success: true, item_name: item.name, slot });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE: 装備品を外す
export async function DELETE(req: Request) {
    try {
        const userId = await getUserId(req);
        const { searchParams } = new URL(req.url);
        const slot = searchParams.get('slot');

        if (!slot) {
            return NextResponse.json({ error: 'slot query parameter is required' }, { status: 400 });
        }

        const { error } = await supabaseService
            .from('equipped_items')
            .delete()
            .eq('user_id', userId)
            .eq('slot', slot);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
