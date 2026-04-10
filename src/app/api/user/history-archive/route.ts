import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
        }

        // 1. Fetch Personal Quest History
        const { data: quests, error: qError } = await supabase
            .from('user_completed_quests')
            .select(`
                id,
                completed_at,
                accumulated_days_at_completion,
                scenarios (
                    id,
                    title,
                    location_id,
                    locations (name)
                )
            `)
            .eq('user_id', userId)
            .order('completed_at', { ascending: false });

        if (qError) throw qError;

        // 2. Fetch World History (Global)
        const { data: worldHistory, error: wError } = await supabase
            .from('world_states_history')
            .select(`
                *,
                location:locations(name)
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (wError) throw wError;

        // 3. Fetch Lineage of Heroes (Graveyard)
        const { data: lineage, error: lError } = await supabase
            .from('retired_characters')
            .select(`
                *,
                location:locations(name)
            `)
            .eq('user_id', userId)
            .order('death_date', { ascending: false });

        if (lError) throw lError;

        // 4. 出禁拠点リスト (spec_v15.1 §4 Tab1 フレーバー統計)
        // reputations.score < 0 の拠点を集計
        const { data: bannedReps, error: brError } = await supabase
            .from('reputations')
            .select('score, location_name')
            .eq('user_id', userId)
            .lt('score', 0)
            .order('score', { ascending: true });

        if (brError) console.warn('[HistoryArchive] banned reps fetch failed:', brError.message);

        return NextResponse.json({
            chronicle: quests,
            world_history: worldHistory,
            lineage: lineage,
            banned_locations: bannedReps || []
        });
    } catch (err: any) {
        console.error('History Archive API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
