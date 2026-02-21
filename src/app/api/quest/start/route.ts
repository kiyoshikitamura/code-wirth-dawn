
import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase-admin';
import { setQuestLock } from '@/lib/questLock';

/**
 * POST /api/quest/start
 * Initiates a quest: sets deck lock and records current quest.
 *
 * Body: { user_id, quest_id }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { user_id, quest_id } = body;

        if (!user_id || !quest_id) {
            return NextResponse.json({ error: 'Missing user_id or quest_id' }, { status: 400 });
        }

        // Verify user exists and is not already in a quest
        const { data: user, error: uError } = await supabase
            .from('user_profiles')
            .select('id, current_quest_id, hp, max_hp')
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

        // Verify quest exists
        const { data: quest, error: qError } = await supabase
            .from('scenarios')
            .select('id, title, slug, quest_type')
            .eq('id', quest_id)
            .single();

        if (qError || !quest) {
            return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
        }

        // Set quest lock (Spec v3.3 §4.2: Deck Locking)
        await setQuestLock(user_id, String(quest_id));

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
