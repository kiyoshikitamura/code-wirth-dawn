import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseService } from '@/lib/supabase-service';
import { DEMO_USER_ID } from '@/utils/constants';

// Reuse exact same auth pattern as shop/route.ts POST (which works)
async function getUserProfile(req: Request) {
    let targetUserId = DEMO_USER_ID;

    const authHeader = req.headers.get('authorization');
    console.log(`[Sell] Auth Header: ${authHeader ? (authHeader.substring(0, 10) + '...') : 'Missing'}`);

    if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
            console.error("[Sell] Auth User Error:", error.message);
            throw new Error("Authentication failed: " + error.message);
        }
        if (user) {
            console.log(`[Sell] Resolved User via Auth: ${user.id}`);
            targetUserId = user.id;
        } else {
            throw new Error("Authentication failed: User not found");
        }
    } else {
        console.warn("[Sell] No Auth Header, using DEMO_USER_ID");
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
            .eq('item_id', Number(item_id))
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
        const sellPrice = Math.floor((item?.base_price || 0) / 2);
        const totalSellValue = sellPrice * quantity;
        console.log(`[Sell] Item: ${item?.name}, base_price: ${item?.base_price}, sellPrice: ${sellPrice}, qty: ${quantity}, total: ${totalSellValue}`);

        // 4. Update inventory (only sell requested quantity from THIS specific row)

        if (invItem.quantity > quantity) {
            // Reduce quantity
            const { error: updateError } = await supabaseService
                .from('inventory')
                .update({ quantity: invItem.quantity - quantity })
                .eq('id', invItem.id);
            if (updateError) throw updateError;
            console.log(`[Sell] Reduced qty from ${invItem.quantity} to ${invItem.quantity - quantity}`);
        } else {
            // Delete the row (selling all remaining)
            const { error: deleteError } = await supabaseService
                .from('inventory')
                .delete()
                .eq('id', invItem.id);
            if (deleteError) throw deleteError;
            console.log(`[Sell] Deleted inventory row ${invItem.id}`);
        }

        // 5. Add gold to user profile
        const { error: goldError } = await supabaseService
            .from('user_profiles')
            .update({ gold: profile.gold + totalSellValue })
            .eq('id', profile.id);

        if (goldError) throw goldError;
        console.log(`[Sell] Gold updated: ${profile.gold} -> ${profile.gold + totalSellValue}`);

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
