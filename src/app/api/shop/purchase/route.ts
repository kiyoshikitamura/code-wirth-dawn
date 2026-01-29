import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEMO_USER_ID } from '@/utils/constants';

export async function POST(req: Request) {
    try {
        const { item_id, price } = await req.json();

        // 1. Validate User & Check Funds
        // We use the fixed DEMO_USER_ID for this prototype phase.
        const userId = '00000000-0000-0000-0000-000000000000'; // Matches DEMO_USER_ID in constants

        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('gold')
            .eq('id', userId)
            .single();

        if (profileError || !userProfile) {
            return NextResponse.json({ error: "ユーザー情報が見つかりません" }, { status: 404 });
        }

        if (Number(userProfile.gold) < Number(price)) {
            return NextResponse.json({ error: "金貨が足りません" }, { status: 400 });
        }
        // Let's assume the client sends valid request, OR we can't really check gold server-side yet without a user table change.
        // WAIT: The valid SQL schema provided doesn't have a 'users.gold' column. 
        // So we just process the "Purchase" by adding to inventory. 
        // Client side will deduct gold. 

        // 2. Skill Check & Consumable Stacking
        // First check if user already has this item
        const { data: existingItem, error: fetchError } = await supabase
            .from('inventory')
            .select('*')
            .is('user_id', null) // Matching our prototype logic
            .eq('item_id', item_id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        // Fetch item details to know type
        const { data: itemDetails, error: itemError } = await supabase
            .from('items')
            .select('item_type, stock_limit')
            .eq('id', item_id)
            .single();

        if (itemError) throw itemError;

        // Stock Check
        if (itemDetails.stock_limit !== null && itemDetails.stock_limit <= 0) {
            return NextResponse.json({ error: "在庫切れです。" }, { status: 400 });
        }

        // Helper to decrement stock
        const decrementStock = async () => {
            if (itemDetails.stock_limit !== null) {
                await supabase
                    .from('items')
                    .update({ stock_limit: itemDetails.stock_limit - 1 })
                    .eq('id', item_id);
            }
        };

        if (itemDetails.item_type === 'skill') {
            if (existingItem) {
                return NextResponse.json({ error: "習得済みです。" }, { status: 400 });
            }
            // Insert new skill
            const { data, error } = await supabase
                .from('inventory')
                .insert([{
                    item_id: item_id,
                    is_equipped: false,
                    is_skill: true,
                    quantity: 1
                }])
                .select();
            if (error) throw error;
            await decrementStock();
            return NextResponse.json({ success: true, inventory_entry: data[0] });

        } else if (itemDetails.item_type === 'consumable') {
            // Stack logic
            if (existingItem) {
                const newQuantity = (existingItem.quantity || 1) + 1;
                const { data, error } = await supabase
                    .from('inventory')
                    .update({ quantity: newQuantity })
                    .eq('id', existingItem.id)
                    .select();
                if (error) throw error;
                await decrementStock();
                return NextResponse.json({ success: true, inventory_entry: data[0] });
            } else {
                // First purchase
                const { data, error } = await supabase
                    .from('inventory')
                    .insert([{
                        item_id: item_id,
                        is_equipped: false, // Auto-equip logic? User didn't specify, assume false
                        is_skill: false,
                        quantity: 1
                    }])
                    .select();
                if (error) throw error;
                await decrementStock();
                return NextResponse.json({ success: true, inventory_entry: data[0] });
            }
        }

        // Fallback or weapon
        const { data, error } = await supabase
            .from('inventory')
            .insert([{
                item_id: item_id,
                is_equipped: false,
                quantity: 1
            }])
            .select();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }
        await decrementStock();

        // Deduct Gold
        const { error: goldError } = await supabase
            .from('user_profiles')
            .update({ gold: Number(userProfile.gold) - Number(price) })
            .eq('id', userId);

        if (goldError) {
            console.error("Gold deduction failed:", goldError);
        }

        return NextResponse.json({ success: true, inventory_entry: data[0] });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
