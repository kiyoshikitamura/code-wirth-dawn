process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';

export async function GET(req: Request) {
    try {
        // Auth
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.length <= 7) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
        }

        // Security check
        if (userId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Fetch Personal Chronicle Logs
        const { data: quests, error: qError } = await supabaseService
            .from('user_chronicles')
            .select(`
                *,
                locations (name)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (qError) throw qError;

        // 2. Fetch World History (Global)
        const { data: worldHistory, error: wError } = await supabaseService
            .from('world_states_history')
            .select(`
                *,
                location:locations!world_states_history_location_id_fkey(name)
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (wError) throw wError;

        // 3. Fetch Lineage of Heroes (Graveyard)
        const { data: lineage, error: lError } = await supabaseService
            .from('retired_characters')
            .select(`
                *,
                location:locations(name)
            `)
            .eq('user_id', userId)
            .order('death_date', { ascending: false });

        if (lError) throw lError;

        // 4. 出禁拠点リスト (reputations.score < 0)
        const { data: bannedReps, error: brError } = await supabaseService
            .from('reputations')
            .select('score, location_name')
            .eq('user_id', userId)
            .lte('score', -300)
            .order('score', { ascending: true });

        if (brError) console.warn('[HistoryArchive] banned reps fetch failed:', brError.message);

        // 5. 統合タイムラインの作成（Chronicle Timeline）
        const timeline: any[] = [];

        // 5a. 個人ログの追加 (user_chronicles)
        if (quests) {
            quests.forEach((c: any) => {
                const isQuestEvent = c.event_type.startsWith('quest_');
                timeline.push({
                    id: c.id,
                    type: 'chronicle',
                    event_type: c.event_type,
                    title: c.title,
                    description: c.description,
                    accumulated_days: c.accumulated_days,
                    location_name: isQuestEvent ? (c.location_name || c.locations?.name || '旅の途中') : '旅の途中',
                    param_changes: c.param_changes || {},
                    is_major_event: c.is_major_event || false,
                    share_text: c.share_text,
                    created_at: c.created_at
                });
            });
        }

        // 5b. 世界の出来事の追加 (world_states_history)
        if (worldHistory) {
            worldHistory.forEach((w: any) => {
                timeline.push({
                    id: w.id,
                    type: 'world',
                    event_type: 'world_event',
                    title: w.event_type === 'alignment_change' ? '覇権シフト' : '世界情勢の変化',
                    description: w.message,
                    accumulated_days: null,
                    location_name: w.location?.name || '世界のどこか',
                    param_changes: {
                        old_value: w.old_value,
                        new_value: w.new_value,
                        event_type: w.event_type
                    },
                    is_major_event: true,
                    share_text: `【世界の記録】${w.message} #WirthDawn #CWD`,
                    created_at: w.created_at
                });
            });
        }

        // 5c. 英霊の追加 (retired_characters)
        if (lineage) {
            lineage.forEach((l: any) => {
                const cause = l.cause_of_death || '';
                const isRetirement = cause.toLowerCase().includes('retire') || cause.includes('引退');
                timeline.push({
                    id: l.id,
                    type: 'hero',
                    event_type: isRetirement ? 'hero_retire' : 'hero_death',
                    title: isRetirement ? `英霊昇華: ${l.name}の引退` : `英霊昇華: ${l.name}の最期`,
                    description: isRetirement
                        ? `『${l.name}』。Lv.${l.snapshot?.final_level || 1}。無事に引退し、英霊の系譜に名を残した。（理由: ${cause}）`
                        : `『${l.name}』。Lv.${l.snapshot?.final_level || 1}。${l.age_days}日間の旅を経て英霊となった。（死因: ${cause}）`,
                    accumulated_days: l.age_days,
                    location_name: l.location?.name || '不明な地',
                    param_changes: {
                        final_level: l.snapshot?.final_level || 1,
                        final_gold: l.snapshot?.final_gold || 0,
                        cause: cause,
                        quests_count: l.completed_quests_count || 0
                    },
                    is_major_event: true,
                    share_text: isRetirement 
                        ? `【英霊の系譜】我が名は『${l.name}』。この度、無事に引退し英霊となった！誰か私の残影を雇ってくれ。 #WirthDawn #CWD #英雄の引退`
                        : `【英霊の系譜】我が名は『${l.name}』。${l.age_days}日間の壮絶な旅を終え、英霊として名を刻む。 #WirthDawn #CWD #英雄の最期`,
                    created_at: l.death_date
                });
            });
        }

        // リアル時間 (created_at) の降順でソート
        timeline.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json({
            chronicle: quests || [],
            world_history: worldHistory || [],
            lineage: lineage || [],
            banned_locations: bannedReps || [],
            timeline
        });
    } catch (err: any) {
        console.error('History Archive API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
