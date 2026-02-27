import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseService } from '@/lib/supabase-service';

// Helper to get user profile
async function getUserProfile(req: Request) {
    let targetUserId: string | null = null;

    const authHeader = req.headers.get('authorization');
    const xUserId = req.headers.get('x-user-id');

    if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            console.error("[Sell] Auth User Error:", error?.message);
            // Fall back to x-user-id if available
            if (xUserId) {
                targetUserId = xUserId;
            } else {
                throw new Error("Authentication failed: " + (error?.message || 'User not found'));
            }
        } else {
            targetUserId = user.id;
            if (xUserId && xUserId !== targetUserId) {
                targetUserId = xUserId;
            }
        }
    } else if (xUserId) {
        targetUserId = xUserId;
    } else {
        throw new Error("Authentication failed: No token provided");
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

    if (!profile) {
        console.error(`[Sell] Profile NOT FOUND for ID: ${targetUserId}`);
        throw new Error("User profile not found");
    }

    console.log(`[Sell] Profile: ${profile.id} | Gold: ${profile.gold}`);
    return profile;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { item_id, quantity = 1 } = body;
        console.log(`[Sell] Request body:`, JSON.stringify(body));

        // 1. Authenticate user
        const profile = await getUserProfile(req);

        // 2. Find the inventory item with joined item data
        // Use supabaseService to bypass RLS
        // NOTE: There may be multiple inventory rows for the same item_id
        // (purchase API inserts a new row each time). Use .limit(1) to grab one.
        console.log(`[Sell] Looking for item_id=${item_id} (type: ${typeof item_id}) for user=${profile.id}`);

        const { data: invItems, error: invError } = await supabaseService
            .from('inventory')
            .select('*, items(*)')
            .eq('user_id', profile.id)
            .eq('item_id', item_id)
            .limit(1);

        const invItem = invItems?.[0];
        console.log(`[Sell] Query result:`, invItem ? `Found id=${invItem.id}, qty=${invItem.quantity}` : 'Not found', invError?.message || '');

        if (invError || !invItem) {
            return NextResponse.json({
                error: 'Item not owned',
                debug: { item_id, item_id_type: typeof item_id, user_id: profile.id, dbError: invError?.message }
            }, { status: 404 });
        }

        // 3. Calculate sell price (base_price / 2)
        const item = invItem.items as any;
        const isUgc = invItem.is_ugc === true;
        const sellPrice = isUgc ? 1 : Math.floor((item?.base_price || 0) / 2);
        const totalSellValue = sellPrice * quantity;
        console.log(`[Sell] Item: ${item?.name}, base_price: ${item?.base_price}, sellPrice: ${sellPrice}, qty: ${quantity}, total: ${totalSellValue}`);

        // Check for Betrayal
        let isBetrayal = false;
        if ((item?.type === 'key_item' || item?.type === 'trade_good' || item?.type === 'consumable') && profile.current_quest_id) {
            // Note: Also checking 'consumable' if it happens to be strictly typed there but acts as a quest item.
            const { data: quest } = await supabaseService
                .from('scenarios')
                .select('*')
                .eq('id', profile.current_quest_id)
                .single();

            if (quest) {
                const qStr = JSON.stringify(quest);
                if (qStr.includes(`"item_id":${item_id}`) || qStr.includes(`"item_id":"${item_id}"`) || quest.requirements?.has_item == item_id) {
                    isBetrayal = true;
                    console.log(`[Sell] Betrayal detected for item ${item_id} in quest ${profile.current_quest_id}`);
                }
            }
        }

        // 4. Update inventory (only sell requested quantity from THIS specific row)
        if (invItem.quantity > quantity) {
            const { error: updateError } = await supabaseService.from('inventory').update({ quantity: invItem.quantity - quantity }).eq('id', invItem.id);
            if (updateError) throw updateError;
        } else {
            const { error: deleteError } = await supabaseService.from('inventory').delete().eq('id', invItem.id);
            if (deleteError) throw deleteError;
        }

        // Betrayal Penalty
        if (isBetrayal && profile.current_location_id) {
            const { data: repData } = await supabaseService
                .from('reputations')
                .select('*')
                .eq('user_id', profile.id)
                .eq('location_id', profile.current_location_id)
                .maybeSingle();

            if (repData) {
                await supabaseService
                    .from('reputations')
                    .update({ reputation_score: (repData.reputation_score || 0) - 50 })
                    .eq('id', repData.id);
            }
        }

        // 5. Add gold to user profile, and clear quest if betrayal
        const updateData: any = { gold: profile.gold + totalSellValue };
        if (isBetrayal) {
            updateData.current_quest_id = null;
            updateData.current_quest_state = null;
        }

        const { error: goldError } = await supabaseService
            .from('user_profiles')
            .update(updateData)
            .eq('id', profile.id);

        if (goldError) throw goldError;

        if (isBetrayal) {
            return NextResponse.json({
                success: true,
                trigger_fail: true,
                message: "裏切り",
                sold_price: totalSellValue,
                new_gold: profile.gold + totalSellValue
            });
        }

        return NextResponse.json({
            success: true,
            sold_price: totalSellValue,
            new_gold: profile.gold + totalSellValue
        });

    } catch (e: any) {
        console.error("[Sell] Error:", e);
        if (e.message?.includes('Authentication')) {
            return NextResponse.json({ error: e.message }, { status: 401 });
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
