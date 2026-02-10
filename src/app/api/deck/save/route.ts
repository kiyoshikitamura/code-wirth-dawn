
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

export async function POST(req: Request) {
    try {
        const userId = req.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { inventory_ids } = await req.json();

        if (!Array.isArray(inventory_ids)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // 1. Fetch User Cap
        const { data: user, error: uError } = await supabase
            .from('user_profiles')
            .select('max_deck_cost')
            .eq('id', userId)
            .single();

        if (uError || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const maxCost = user.max_deck_cost || 10;

        // 2. Fetch Items & Calculate Cost
        // We only care about the items the being equipped.
        // We verify ownership by filtering by user_id implied in query if we had RLS, 
        // but with Service Role we must filter manually OR rely on inventory_ids being unique UUIDs and just check if they belong to user?
        // Better: Select from inventory where id in list AND user_id = userId.

        // If list is empty (clearing deck), cost is 0.
        let currentCost = 0;
        if (inventory_ids.length > 0) {
            const { data: deckItems, error: iError } = await supabase
                .from('inventory')
                .select(`
                    id,
                    items (
                        id,
                        cost
                    )
                `)
                .in('id', inventory_ids)
                .eq('user_id', userId); // Security check ownership

            if (iError) throw iError;

            // Check if all requested IDs were found (ownership check)
            if (!deckItems || deckItems.length !== inventory_ids.length) {
                return NextResponse.json({ error: 'Invalid items or ownership' }, { status: 400 });
            }

            // Sum Cost
            currentCost = deckItems.reduce((sum, inv: any) => sum + (inv.items?.cost || 0), 0);
        }

        // 3. Validate
        if (currentCost > maxCost) {
            return NextResponse.json({
                error: `Deck cost limit exceeded. Current: ${currentCost}, Max: ${maxCost}`
            }, { status: 400 });
        }

        // 4. Update Database
        // Transaction-like approach:
        // A. Reset all skills for this user to unequipped
        // B. Set requested IDs to equipped

        // Using Service Role, we can do this.
        // Step A:
        const { error: resetError } = await supabase
            .from('inventory')
            .update({ is_equipped: false })
            .eq('user_id', userId)
            .eq('is_skill', true); // Only affect cards/skills

        if (resetError) throw resetError;

        // Step B (if any)
        if (inventory_ids.length > 0) {
            const { error: updateError } = await supabase
                .from('inventory')
                .update({ is_equipped: true })
                .in('id', inventory_ids);

            if (updateError) throw updateError;
        }

        return NextResponse.json({
            success: true,
            cost: currentCost,
            max_cost: maxCost
        });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
