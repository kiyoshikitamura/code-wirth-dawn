import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEMO_USER_ID } from '@/utils/constants';

// GET: Fetch Inventory
export async function GET(req: Request) {
    try {
        // Join inventory with items
        const { data, error } = await supabase
            .from('inventory')
            .select(`
                id,
                is_equipped,
                acquired_at,
                quantity,
                is_skill,
                items (
                    id,
                    name,
                    description,
                    item_type,
                    power_value,
                    required_attribute
                )
            `)
            // .eq('user_id', DEMO_USER_ID); // Commented out to match purchase Logic
            .is('user_id', null);

        if (error) throw error;

        // Flatten structure for frontend
        const inventory = data.map((entry: any) => ({
            id: entry.id,
            item_id: entry.items.id,
            name: entry.items.name,
            description: entry.items.description,
            item_type: entry.items.item_type,
            power_value: entry.items.power_value,
            required_attribute: entry.items.required_attribute,
            is_equipped: entry.is_equipped,
            acquired_at: entry.acquired_at,
            quantity: entry.quantity,
            is_skill: entry.is_skill
        }));

        return NextResponse.json({ inventory });
    } catch (err: any) {
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
