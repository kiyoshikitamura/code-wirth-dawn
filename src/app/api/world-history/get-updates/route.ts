import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
        }

        // 1. Get user's last seen history reference
        const { data: viewData, error: viewError } = await supabase
            .from('user_world_views')
            .select('last_seen_history_id')
            .eq('user_id', userId)
            .maybeSingle();

        if (viewError) throw viewError;

        let query = supabase
            .from('world_states_history')
            .select(`
                *,
                location:locations(name)
            `)
            .order('created_at', { ascending: false })
            .limit(10); // Limit to latest 10 news items

        // 2. Fetch history
        const { data: history, error: historyError } = await query;
        if (historyError) throw historyError;

        if (!history || history.length === 0) {
            return NextResponse.json({ news: [] });
        }

        // 3. Filter for "new" news
        // If they have never seen anything, we show the latest item as news
        // If they have seen, we show everything newer than last_seen_history_id

        let newNews = history;
        const lastSeenId = viewData?.last_seen_history_id;

        if (lastSeenId) {
            const index = history.findIndex(h => h.id === lastSeenId);
            if (index !== -1) {
                // Everything before the index (since it's descending) is new
                newNews = history.slice(0, index);
            }
        } else {
            // First time: just show the single most recent one to avoid overwhelm
            newNews = [history[0]];
        }

        return NextResponse.json({ news: newNews });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { user_id, last_seen_history_id } = await req.json();

        if (!user_id || !last_seen_history_id) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const { error } = await supabase
            .from('user_world_views')
            .upsert({
                user_id,
                last_seen_history_id,
                last_checked_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
