process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        // [Security] JWT認証のみ — x-user-id フォールバックを廃止 (v27.1)
        const authHeader = req.headers.get('authorization');
        let targetUserId = '';

        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error || !user) {
                console.error("[Consume API] Auth Error:", error?.message);
                return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
            }
            targetUserId = user.id;
        } else {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await req.json();
        const { item_id, quantity = 1 } = body;

        console.log("[Consume API] Body parsed:", body);

        if (!item_id) {
            return NextResponse.json({ error: "Missing item_id" }, { status: 400 });
        }

        // Find the inventory item(s) to consume
        const { data: invItems, error: invError } = await supabaseService
            .from('inventory')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('item_id', item_id);

        if (invError) {
            return NextResponse.json({ error: invError.message }, { status: 500 });
        }

        const totalQty = invItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

        if (totalQty < quantity) {
            return NextResponse.json({ error: 'Not enough items', current_quantity: totalQty }, { status: 400 });
        }

        // Consume item
        let remainingToConsume = quantity;
        for (const invItem of invItems || []) {
            if (remainingToConsume <= 0) break;

            if (invItem.quantity <= remainingToConsume) {
                // Delete this row
                const { error: delError } = await supabaseService
                    .from('inventory')
                    .delete()
                    .eq('id', invItem.id);
                if (delError) throw delError;
                remainingToConsume -= invItem.quantity;
            } else {
                // Reduce quantity
                const { error: updError } = await supabaseService
                    .from('inventory')
                    .update({ quantity: invItem.quantity - remainingToConsume })
                    .eq('id', invItem.id);
                if (updError) throw updError;
                remainingToConsume = 0;
            }
        }

        return NextResponse.json({ success: true, consumed: quantity });

    } catch (e: any) {
        console.error("[ConsumeItem] Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
