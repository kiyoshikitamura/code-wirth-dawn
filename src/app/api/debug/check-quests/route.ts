import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase-admin';

// Diagnostic endpoint to check quest data directly
export async function GET() {
    try {
        // 1. Check total scenarios count
        const { data: allScenarios, error: e1 } = await supabase
            .from('scenarios')
            .select('id, slug, title, quest_type, location_tags, requirements')
            .limit(20);

        // 2. Check quest_type distribution
        const { data: normalOnly, error: e2 } = await supabase
            .from('scenarios')
            .select('id, slug, title, quest_type')
            .eq('quest_type', 'normal')
            .limit(5);

        const { data: specialOnly, error: e3 } = await supabase
            .from('scenarios')
            .select('id, slug, title, quest_type')
            .eq('quest_type', 'special')
            .limit(5);

        // 3. Check with IN filter (same as quest API)
        const { data: inFilter, error: e4 } = await supabase
            .from('scenarios')
            .select('id, slug, title, quest_type')
            .in('quest_type', ['normal', 'special'])
            .limit(5);

        return NextResponse.json({
            all_scenarios_sample: allScenarios,
            all_errors: { e1: e1?.message, e2: e2?.message, e3: e3?.message, e4: e4?.message },
            normal_sample: normalOnly,
            special_sample: specialOnly,
            in_filter_sample: inFilter,
            counts: {
                all: allScenarios?.length,
                normal: normalOnly?.length,
                special: specialOnly?.length,
                in_filter: inFilter?.length
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
