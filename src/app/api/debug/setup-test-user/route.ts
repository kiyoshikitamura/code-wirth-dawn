process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (process.env.VERCEL_ENV === 'production') {
        return NextResponse.json(
            { error: 'Debug routes are not available in production' },
            { status: 403 }
        );
    }

    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const userId = url.searchParams.get('userId');

    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: 'Missing Supabase Configuration' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    try {
        console.log(`[setup-test-user] Initializing debug state for user=${userId}`);

        // 1. Update alignment to Order 70 / Chaos 30
        const { error: profileError } = await supabase
            .from('user_profiles')
            .update({
                order_pts: 70,
                chaos_pts: 30,
                justice_pts: 50,
                evil_pts: 50
            })
            .eq('id', userId);

        if (profileError) {
            return NextResponse.json({ error: 'Failed to update user profile', details: profileError }, { status: 500 });
        }

        // 2. Clear old test items (IDs: 346, 347, 4001)
        const testItemIds = [346, 347, 4001];
        const { error: deleteError } = await supabase
            .from('inventory')
            .delete()
            .eq('user_id', userId)
            .in('item_id', testItemIds);

        if (deleteError) {
            return NextResponse.json({ error: 'Failed to clear old inventory items', details: deleteError }, { status: 500 });
        }

        // 3. Grant test items (Blue x1, Red x2, Unidentified Chest x1)
        const itemsToInsert = [
            { user_id: userId, item_id: 346, quantity: 1, is_equipped: false, is_skill: false },
            { user_id: userId, item_id: 347, quantity: 2, is_equipped: false, is_skill: false },
            { user_id: userId, item_id: 4001, quantity: 1, is_equipped: false, is_skill: false }
        ];

        const { error: insertError } = await supabase
            .from('inventory')
            .insert(itemsToInsert);

        if (insertError) {
            return NextResponse.json({ error: 'Failed to grant test items', details: insertError }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Successfully set up test user ${userId} with Order 70 / Chaos 30 and granted Blue x1, Red x2, and Chest x1.`,
        });

    } catch (e: any) {
        console.error('[setup-test-user] Error:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
