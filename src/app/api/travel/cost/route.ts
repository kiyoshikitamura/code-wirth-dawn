import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { target_location_slug } = body;

        if (!target_location_slug) {
            return NextResponse.json({ error: 'Target location slug is required' }, { status: 400 });
        }

        // 1. Authenticate User
        let userId: string | null = null;
        const authHeader = req.headers.get('authorization');
        const xUserId = req.headers.get('x-user-id');

        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error || !user) {
                if (xUserId) {
                    userId = xUserId;
                } else {
                    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
                }
            } else {
                userId = user.id;
                if (xUserId && xUserId !== userId) {
                    userId = xUserId;
                }
            }
        } else if (xUserId) {
            userId = xUserId;
        } else {
            return NextResponse.json({ error: "Authentication required for travel cost" }, { status: 401 });
        }

        const { data: user } = await supabase
            .from('user_profiles')
            .select('id, current_location_id')
            .eq('id', userId)
            .single();

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
