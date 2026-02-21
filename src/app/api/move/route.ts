import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseService } from '@/lib/supabase-service';
import { DEMO_USER_ID } from '@/utils/constants';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { target_location_name, target_location_slug } = await req.json();

        if (!target_location_name && !target_location_slug) {
            return NextResponse.json({ error: 'Target location is required' }, { status: 400 });
        }

        // 1. Get User Profile (Secure)
        const supabaseAuth = supabase;
        // Note: In Next.js App Router, cookies() should be used for server-side auth ideally, 
        // but here we just check if the request has a header or we use the basic client to getInstance.
        // Actually, for API routes, we should use createRouteHandlerClient or just use getUser with the token from header.
        // But for this legacy code, let's just use the logic:

        let targetUserId = DEMO_USER_ID;

        // Attempt to get user from Auth (if token passed)
        const authHeader = req.headers.get('authorization');
        console.log(`[Move] Auth Header: ${authHeader ? (authHeader.substring(0, 10) + '...') : 'Missing'}`);

        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error) {
                console.error("[Move] Auth User Error:", error.message);
                return NextResponse.json({ error: "Authentication failed: " + error.message }, { status: 401 });
            }
            if (user) {
                console.log(`[Move] Resolved User via Auth: ${user.id}`);
                targetUserId = user.id;
            } else {
                return NextResponse.json({ error: "Authentication failed: User not found" }, { status: 401 });
            }
        } else {
            // Strict Mode: Move requires Auth
            return NextResponse.json({ error: "Login required for travel" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', targetUserId)
            .single();

        // Strict Check against Demo Fallback (Redundant if we return 401 above, but safe)
        if (targetUserId === DEMO_USER_ID) {
            return NextResponse.json({ error: "Demo user cannot travel" }, { status: 401 });
        }

        if (profile) {
            console.log(`[Move] Profile: ${profile.id} | Loc: ${profile.current_location_id}`);
        } else {
            console.error(`[Move] Profile NOT FOUND for ID: ${targetUserId}`);
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Explicitly fetch Current Location to avoid join issues
        let currentLocation: any = null;
        if (profile.current_location_id) {
            const { data: loc } = await supabase.from('locations').select('*').eq('id', profile.current_location_id).single();
            currentLocation = loc;
        }

        // 2. Get Target Location
        let query = supabase.from('locations').select('*');
        if (target_location_slug) {
            query = query.eq('slug', target_location_slug);
        } else {
            query = query.eq('name', target_location_name);
        }

        const { data: targetData, error: targetError } = await query.single();

        if (targetError || !targetData) {
            return NextResponse.json({ error: 'Target location not found' }, { status: 404 });
        }

        // 3. Calculate Days using neighbors
        let daysToTravel = 1;
        if (currentLocation) {
            const neighbors = currentLocation.neighbors || {};
            if (neighbors[targetData.slug]) {
                console.log(`[Move] Valid route: ${currentLocation.slug} -> ${targetData.slug} (${neighbors[targetData.slug]} days)`);
                daysToTravel = Number(neighbors[targetData.slug]);
            } else if (currentLocation.slug === 'loc_hub' || targetData.type === 'Capital') {
                console.log(`[Move] Valid descent: Hub -> ${targetData.slug}`);
                daysToTravel = 1;
            } else {
                console.warn(`[Move] Invalid Route: ${currentLocation.slug} -> ${targetData.slug}. Neighbors:`, Object.keys(neighbors));
                return NextResponse.json({
                    error: 'Direct route not found between these locations.',
                    debug: {
                        current: currentLocation.slug,
                        target: targetData.slug,
                        neighbors: Object.keys(neighbors),
                        userId: profile.id
                    }
                }, { status: 400 });
            }
        }

        // 4. Update Time & Age
        let newTotalDays = (profile.accumulated_days || 0) + daysToTravel;
        let newAge = profile.age || 20;

        if (newTotalDays >= 365) {
            const yearsPassed = Math.floor(newTotalDays / 365);
            newAge += yearsPassed;
            newTotalDays = newTotalDays % 365;
        }

        // 5. Update DB (Use Service Role for reliability)
        // A. Update User Profile
        const { error: updateProfileError } = await supabaseService
            .from('user_profiles')
            .update({
                current_location_id: targetData.id,
                accumulated_days: newTotalDays,
                age: newAge
            })
            .eq('id', profile.id);

        if (updateProfileError) throw updateProfileError;

        // B. Update World State (Global Time synchronization)
        const { data: globalState } = await supabase
            .from('world_states')
            .select('total_days_passed')
            .order('total_days_passed', { ascending: false })
            .limit(1);

        const currentGlobalDays = globalState?.[0]?.total_days_passed || 0;
        const newGlobalDays = currentGlobalDays + daysToTravel;

        // Update target location's world state
        await supabaseService
            .from('world_states')
            .upsert({
                location_name: targetData.name,
                total_days_passed: newGlobalDays
            }, { onConflict: 'location_name' });

        return NextResponse.json({
            success: true,
            travel_days: daysToTravel,
            new_age: newAge,
            current_date: {
                total_days: newGlobalDays,
                display: `World Year ${100 + Math.floor(newGlobalDays / 365)}`
            }
        });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

