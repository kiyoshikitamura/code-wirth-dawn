process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer as supabaseService } from '@/lib/supabase-admin';

/**
 * GET /api/quest-log
 * Returns all non-UGC quests with user completion status.
 * Used by the Quest Log modal in the hub.
 */
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
        const userId = user.id;

        // Parallel fetch: quest master + user completions
        const [questsRes, completedRes] = await Promise.all([
            supabaseService
                .from('scenarios')
                .select('id, slug, title, description, quest_type, rec_level, difficulty, client_name, rewards, requirements, script_data, impact')
                .in('quest_type', ['normal', 'special'])
                .not('slug', 'like', 'ugc_%')
                .order('id', { ascending: true }),
            supabaseService
                .from('user_completed_quests')
                .select('scenario_id')
                .eq('user_id', userId),
        ]);

        if (questsRes.error) throw questsRes.error;

        const completedIds = new Set((completedRes.data || []).map((r: any) => r.scenario_id));
        const allQuests = questsRes.data || [];

        // Build response — hide details for uncompleted quests
        const quests = allQuests.map((q: any) => {
            const isCompleted = completedIds.has(q.id);
            const rewards = q.rewards || {};
            const isMain = q.slug?.startsWith('main_ep');

            return {
                id: q.id,
                slug: q.slug,
                quest_type: q.quest_type,
                // Categorize: main / special / normal
                category: isMain ? 'main' : q.quest_type,
                completed: isCompleted,
                // Show details only for completed quests
                title: isCompleted ? q.title : null,
                description: isCompleted ? q.description : null,
                rec_level: q.rec_level || 1,
                difficulty: q.difficulty,
                client_name: isCompleted ? (q.client_name || 'ギルド') : null,
                short_flavor: isCompleted ? (q.script_data?.short_description || q.description || '') : null,
                long_flavor: isCompleted ? (q.script_data?.nodes?.start?.text || q.description || '') : null,
                // Rewards (visible for completed quests)
                reward_gold: isCompleted ? (rewards.gold || 0) : null,
                reward_exp: isCompleted ? (rewards.exp || 0) : null,
                reward_reputation: isCompleted ? (rewards.reputation || 0) : null,
                reward_items: isCompleted ? (rewards.items || []) : null,
                reward_alignment: isCompleted ? (rewards.alignment_shift || null) : null,
                reward_vitality: isCompleted ? (rewards.vitality_cost || 0) : null,
                reward_npc: isCompleted ? (rewards.npc_reward || null) : null,
                impacts: isCompleted ? q.impact : null,
            };
        });

        // Sort by id
        quests.sort((a: any, b: any) => a.id - b.id);

        const total = quests.length;
        const completed = quests.filter((q: any) => q.completed).length;

        return NextResponse.json({ total, completed, quests });
    } catch (e: any) {
        console.error('[QuestLog API] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
