import { NextResponse } from 'next/server';
import { supabaseServer as supabaseAdmin } from '@/lib/supabase-admin';
import { ShadowService } from '@/services/shadowService';

export async function GET(req: Request) {
    try {
        const hirerId = '3e7f2815-ab1e-48c1-931b-ba664c142a9c';
        const shadowId = 'af2848d0-40f2-4f75-bd2b-ac633184107c';
        const locationId = 'a4b2251d-0ba3-47e0-94d9-5fe28737ac5e';

        // 1. Fetch raw profile values
        const { data: shadowProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', shadowId)
            .single();

        const { data: hirerProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', hirerId)
            .single();

        // 2. Fetch raw equipped items
        const { data: equipped } = await supabaseAdmin
            .from('equipped_items')
            .select(`
                slot,
                items (
                    name, effect_data
                )
            `)
            .eq('user_id', shadowId);

        // 3. Call findShadowsAtLocation
        const shadowService = new ShadowService(supabaseAdmin);
        const shadows = await shadowService.findShadowsAtLocation(locationId, hirerId);

        const targetShadowResult = shadows.find(s => s.profile_id === shadowId);

        return NextResponse.json({
            success: true,
            debug_info: {
                hirer_found: !!hirerProfile,
                shadow_found: !!shadowProfile,
                shadow_location_matches: shadowProfile?.current_location_id === locationId,
                shadow_updated_recently: shadowProfile?.updated_at 
                    ? new Date(shadowProfile.updated_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
                    : false,
                shadow_updated_at: shadowProfile?.updated_at,
                now_minus_24h: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                raw_equipped_count: equipped?.length || 0,
                raw_equipped: equipped
            },
            shadows_length: shadows.length,
            target_in_list: !!targetShadowResult,
            target_data: targetShadowResult || null
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
