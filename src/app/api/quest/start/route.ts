
import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase-admin';
import { supabase as anonSupabase } from '@/lib/supabase';
import { setQuestLock } from '@/lib/questLock';
import { QuestService } from '@/services/questService';

/**
 * POST /api/quest/start
 * Initiates a quest: sets deck lock and records current quest.
 *
 * Body: { user_id, quest_id }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { quest_id } = body;

        // [Security] JWT認証必須化 — body.user_idを信頼しない
        let user_id: string | null = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error: authErr } = await anonSupabase.auth.getUser(token);
            if (!authErr && user) user_id = user.id;
        }

        if (!user_id || !quest_id) {
            return NextResponse.json({ error: 'Missing quest_id or authentication required' }, { status: 401 });
        }

        // Verify user exists and is not already in a quest
        const { data: user, error: uError } = await supabase
            .from('user_profiles')
            .select('id, current_quest_id, hp, max_hp, level')
            .eq('id', user_id)
            .single();

        if (uError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.current_quest_id) {
            return NextResponse.json({
                error: 'Already in a quest. Complete or abandon current quest first.',
                current_quest_id: user.current_quest_id
            }, { status: 409 });
        }

        // Verify quest exists (公式 → UGC v2 フォールバック)
        let quest: any = null;
        const { data: officialQuest, error: qError } = await supabase
            .from('scenarios')
            .select('id, title, slug, quest_type')
            .eq('id', quest_id)
            .single();

        if (officialQuest) {
            quest = officialQuest;
        } else {
            // UGC v2: ugc_scenarios から検索
            const { data: ugcQuest, error: ugcErr } = await supabase
                .from('ugc_scenarios')
                .select('id, title, slug, scenario_type')
                .eq('id', quest_id)
                .eq('status', 'published')
                .single();

            if (ugcErr || !ugcQuest) {
                return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
            }
            quest = { ...ugcQuest, quest_type: 'ugc' };
        }

        // UGC最低受注レベル制限（Lv5）
        const isUgc = quest.quest_type === 'ugc';
        const userLevel = user.level || 1;
        if (isUgc && userLevel < 5) {
            return NextResponse.json({
                error: 'UGCクエストを受注するにはレベル5以上である必要があります。'
            }, { status: 403 });
        }

        // 受注前提条件 (requirements) のサーバーサイド事前検証
        const validation = await QuestService.validateRequirements(supabase, user_id, quest.requirements);
        if (!validation.valid) {
            return NextResponse.json({
                error: 'Quest prerequisites not met: ' + validation.reason
            }, { status: 403 });
        }

        // Set quest lock (Spec v3.3 §4.2: Deck Locking)
        await setQuestLock(user_id, String(quest_id));

        // Record quest activity log (Spec Dashboard Extensions)
        const { error: logErr } = await supabase
            .from('quest_activity_logs')
            .insert({
                user_id,
                scenario_id: quest_id,
                action: 'start'
            });
        if (logErr) {
            console.error('[Quest Start] Failed to write quest_activity_logs:', logErr);
        }

        return NextResponse.json({
            success: true,
            quest_id: quest.id,
            quest_title: quest.title,
            locked: true,
            initial_hp: user.hp || user.max_hp,
            message: 'クエスト開始。装備・デッキの変更はロックされました。'
        });

    } catch (e: any) {
        console.error("Quest Start Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
