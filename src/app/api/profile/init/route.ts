import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, hasServiceKey } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title_name, gender, age, gold, current_location_id } = body;

        // Use Admin client to bypass RLS for this specific initialization step
        // This is crucial for "Demo Mode" or initial setup where Auth might not be strictly 1:1
        const client = hasServiceKey && supabaseAdmin ? supabaseAdmin : supabase;

        // Find the profile to update.
        // Logic matches GET /api/profile: Find any profile or specific one if Auth exists.
        // For this local single-player style:
        const { data: profiles } = await client
            .from('user_profiles')
            .select('id')
            .limit(1);

        const profileId = profiles?.[0]?.id;

        if (!profileId) {
            return NextResponse.json({ error: 'No profile found to initialize' }, { status: 404 });
        }

        const updates: any = {
            title_name,
            gender,
            age: age || 20,
            accumulated_days: 0,
            gold: gold || 1000
        };

        if (current_location_id) updates.current_location_id = current_location_id;

        const { error } = await client
            .from('user_profiles')
            .update(updates)
            .eq('id', profileId);

        if (error) throw error;

        return NextResponse.json({ success: true, id: profileId });

    } catch (err: any) {
        console.error("Profile Init Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
