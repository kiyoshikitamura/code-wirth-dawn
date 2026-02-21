import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Service Role client to bypass RLS for API operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: Fetch Inventory
export async function POST(req: Request) {
    try {
        const { item_slug, quantity = 1 } = await req.json();
        const userId = req.headers.get('x-user-id');

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
                    slug,
                    type,
                    base_price,
                    effect_data
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
                    description: item.name, // Description missing in DB, use name or lookup
                    item_type: item.type, // DB: type -> Frontend: item_type
                    power_value: powerVal,
                    required_attribute: 'None', // Missing in DB
                    base_price: item.base_price || 0,
                    is_equipped: entry.is_equipped,
                    acquired_at: entry.acquired_at,
                    quantity: entry.quantity,
                    is_skill: entry.is_skill
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
        const { inventory_id, is_equipped } = await req.json();
        const userId = req.headers.get('x-user-id');

        let query = supabase
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
