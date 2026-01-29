import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Scenario } from '@/types/game';

export async function GET(req: Request) {
    try {
        // 1. Fetch User Profile to get Current Location
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('*, locations(*)')
            .limit(1);

        const profile = profiles?.[0];
        const userTitle = profile?.title_name || '名もなき旅人';
        const currentLocationName = profile?.locations?.name || '名もなき旅人の拠所';

        // 2. Get World State for Current Location
        const { data: worldComp } = await supabase
            .from('world_states')
            .select('status, attribute_name')
            .eq('location_name', currentLocationName)
            .maybeSingle();

        // Default if fail
        const currentStatus = worldComp?.status || '繁栄';
        const currentAttribute = worldComp?.attribute_name || '至高の平穏';

        // 2. Fetch Scenarios from DB
        const { data: dbScenarios, error: scError } = await supabase
            .from('scenarios')
            .select('*');

        if (scError) throw scError;

        // 3. Filter and Map
        const availableScenarios = (dbScenarios || [])
            .filter((s: any) => {
                const statusMatch = s.required_status === 'ANY' || !s.required_status || s.required_status === currentStatus;
                const attributeMatch = s.required_attribute === 'ANY' || !s.required_attribute || s.required_attribute === currentAttribute;
                const titleMatch = s.required_title === 'ANY' || !s.required_title || s.required_title === userTitle;
                return statusMatch && attributeMatch && titleMatch;
            })
            .map((s: any) => ({
                id: s.id,
                title: s.title,
                description: s.description,
                client_name: s.client_name,
                required_status: s.required_status,
                required_attribute: s.required_attribute,
                required_title: s.required_title,
                reward_gold: s.reward_gold,
                // Pass through raw columns
                order_impact: s.order_impact,
                chaos_impact: s.chaos_impact,
                justice_impact: s.justice_impact,
                evil_impact: s.evil_impact,
                // Construct helper object for frontend
                impacts: {
                    order: s.order_impact || 0,
                    chaos: s.chaos_impact || 0,
                    justice: s.justice_impact || 0,
                    evil: s.evil_impact || 0
                }
            }));

        return NextResponse.json(availableScenarios);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
