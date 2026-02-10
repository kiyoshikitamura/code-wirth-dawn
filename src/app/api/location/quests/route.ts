
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const locationId = searchParams.get('locationId'); // e.g., '101' or 'loc_start'

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // 1. Fetch User Profile & Inventory (for has_item check)
        const { data: user, error: uError } = await supabase
            .from('user_profiles')
            .select(`
                *,
                inventory_items ( item_id, quantity )
            `)
            .eq('id', userId)
            .single();

        if (uError || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 2. Fetch World State (for prosperity/nation checks)
        // If locationId is provided, fetch specific location state.
        // If not, fetch global or current location from user.
        const currentLoc = locationId || user.current_location_id;
        const { data: worldState, error: wError } = await supabase
            .from('world_states')
            .select('*')
            //.eq('location_id', currentLoc) // Assuming world_states is keyed by location_id or similar
            .maybeSingle(); // For now, just get one or modify query to match location

        // 3. Fetch All Potential Quests (or filtered by basic criteria)
        // We fetch more than 6 to filter in memory for complex logic
        const { data: quests, error: qError } = await supabase
            .from('scenarios')
            .select('*')
            .limit(50); // Fetch a batch to process

        if (qError) throw qError;

        // 4. Filtering & Scoring
        const validQuests = quests.filter((q: any) => {
            if (!q.trigger_condition) return true;

            const conds = q.trigger_condition.split('|');
            for (const c of conds) {
                const [key, val] = c.split(':');

                // Nation Check
                if (key === 'nation') {
                    // Logic to check if current location's nation matches 'val'
                    // Requires join with location master data or world state
                    // Skipping strict check for now or assume simple match
                }
                // Prosperity Check
                else if (key === 'prosp') {
                    const currentProsp = worldState?.prosperity_level || 50; // Default
                    if (val.endsWith('+')) {
                        const min = parseInt(val);
                        if (currentProsp < min) return false;
                    } else if (val.endsWith('-')) {
                        const max = parseInt(val);
                        if (currentProsp > max) return false;
                    }
                }
                // Item Check
                else if (key === 'has_item') {
                    const itemId = parseInt(val);
                    const has = user.inventory_items?.some((i: any) => i.item_id === itemId && i.quantity > 0);
                    if (!has) return false;
                }
                // Alignment Check
                else if (key === 'align') {
                    // e.g. align:Law > check if user.alignment_law > X?
                    // Simplified: check if user alignment matches string
                }
            }
            return true;
        });

        // Scoring
        const scoredQuests = validQuests.map((q: any) => {
            let score = 0;

            // Urgency
            if (q.is_urgent) score += 100;

            // Level Match
            const diff = Math.abs((q.rec_level || 1) - (user.level || 1));
            if (diff <= 2) score += 20;
            else if (diff <= 5) score += 10;

            // Alignment (Bonus for matching)
            // Implementation pending alignment numeric system details

            return { ...q, _score: score };
        });

        // 5. Select Top 6
        scoredQuests.sort((a: any, b: any) => b._score - a._score);
        const selected = scoredQuests.slice(0, 6);

        return NextResponse.json({ quests: selected });

    } catch (e: any) {
        console.error("Quest API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
