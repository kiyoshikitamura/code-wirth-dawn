import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEMO_USER_ID } from '@/utils/constants';

// GET: Fetch Inventory
export async function GET(req: Request) {
    try {
        // Get user_id from header (custom or standard)
        const userId = req.headers.get('x-user-id');

        let query = supabase
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
                    description,
                    item_type,
                    power_value,
                    required_attribute,
                    cost
                )
            `);

        // If userId is provided, filter by it. Else, maybe return system items or empty?
        if (userId) {
            query = query.eq('user_id', userId);
        } else {
            // Fallback: Return empty or demo?
            // Existing logic was .is('user_id', null), likely for "Guest" or "Template".
            // We keep it safe:
            query = query.is('user_id', null);
        }

        const { data, error } = await query;

        if (error) {
            console.error(error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) return NextResponse.json({ inventory: [] });

        // Flatten structure
        const inventory = data.map((entry: any) => {
            if (!entry.items) return null; // Safety check
            return {
                id: entry.id,
                item_id: entry.items.id,
                name: entry.items.name,
                description: entry.items.description,
                item_type: entry.items.item_type,
                power_value: entry.items.power_value,
                required_attribute: entry.items.required_attribute,
                cost: entry.items.cost || 0,
                is_equipped: entry.is_equipped,
                acquired_at: entry.acquired_at,
                quantity: entry.quantity,
                is_skill: entry.is_skill
            };
        }).filter(Boolean); // Remove nulls

        return NextResponse.json({ inventory });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH: Equip/Unequip
export async function PATCH(req: Request) {
    try {
        const { inventory_id, is_equipped } = await req.json();

        const { error } = await supabase
            .from('inventory')
            .update({ is_equipped })
            .eq('id', inventory_id)
            .is('user_id', null);
        // .eq('user_id', DEMO_USER_ID);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
