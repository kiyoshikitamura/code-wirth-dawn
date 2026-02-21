import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEMO_USER_ID } from '@/utils/constants';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { target_location_slug } = body;

        if (!target_location_slug) {
            return NextResponse.json({ error: 'Target location slug is required' }, { status: 400 });
        }

        // 1. Identify User (Favor Demo User or first profile)
        const { data: profiles } = await supabase.from('user_profiles').select('id, current_location_id').limit(2);
        const user = profiles?.find(p => p.id === DEMO_USER_ID) || profiles?.[0];

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 2. Get Current Location Name (for response)
        const { data: currentLoc } = await supabase
            .from('locations')
            .select('name, slug, neighbors')
            .eq('id', user.current_location_id)
            .single();

        if (!currentLoc) return NextResponse.json({ error: 'Current location not found' }, { status: 404 });

        const fromSlug = currentLoc.slug;
        const toSlug = target_location_slug;

        if (fromSlug === toSlug) {
            return NextResponse.json({ from: currentLoc.name, to: currentLoc.name, days: 0 });
        }

        // 3. Get Target Location
        const { data: targetLoc } = await supabase
            .from('locations')
            .select('name')
            .eq('slug', toSlug)
            .single();

        if (!targetLoc) return NextResponse.json({ error: 'Target location not found' }, { status: 404 });

        // 4. Check Neighbors
        const neighbors = currentLoc.neighbors || {};
        if (neighbors[toSlug]) {
            return NextResponse.json({
                from: currentLoc.name,
                to: targetLoc.name,
                days: Number(neighbors[toSlug])
            });
        }

        // Error if not neighbors
        return NextResponse.json({ error: 'No direct travel route defined between these locations.' }, { status: 400 });

    } catch (e: any) {
        console.error('Travel cost API error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
