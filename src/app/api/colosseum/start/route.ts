import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase-admin';
import { supabase as anonSupabase } from '@/lib/supabase';
import { setQuestLock } from '@/lib/questLock';

/**
 * POST /api/colosseum/start
 * Starts a Colosseum challenge for the user.
 * Body: { difficulty: 'easy' | 'normal' | 'hard' }
 */
export async function POST(req: Request) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Server Configuration Error: Missing Admin Client' }, { status: 500 });
        }

        const body = await req.json();
        const { difficulty } = body;

        if (!difficulty || !['easy', 'normal', 'hard'].includes(difficulty)) {
            return NextResponse.json({ error: 'Invalid or missing difficulty' }, { status: 400 });
        }

        // [Security] JWT Authentication
        let user_id: string | null = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error: authErr } = await anonSupabase.auth.getUser(token);
            if (!authErr && user) user_id = user.id;
        }

        if (!user_id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Fetch user profile and location name
        const { data: user, error: uError } = await supabase
            .from('user_profiles')
            .select('id, gold, level, current_quest_id, current_location_id, accumulated_days')
            .eq('id', user_id)
            .single();

        if (uError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already in a quest
        if (user.current_quest_id) {
            return NextResponse.json({
                error: 'すでに他のクエストが進行中です。先に諦めるか完了してください。',
                current_quest_id: user.current_quest_id
            }, { status: 409 });
        }

        // Calculate cost based on difficulty
        // Easy: Lv * 10G, Normal: Lv * 30G, Hard: Lv * 50G
        const userLevel = user.level || 1;
        let costMultiplier = 10;
        let diffLabel = 'Easy';
        if (difficulty === 'normal') {
            costMultiplier = 30;
            diffLabel = 'Normal';
        } else if (difficulty === 'hard') {
            costMultiplier = 50;
            diffLabel = 'Hard';
        }
        const goldCost = userLevel * costMultiplier;

        // Check user's gold balance
        const currentGold = user.gold || 0;
        if (currentGold < goldCost) {
            return NextResponse.json({
                error: `ゴールドが不足しています。必要: ${goldCost}G, 所持: ${currentGold}G`
            }, { status: 400 });
        }

        // Deduct gold
        const { error: deductError } = await supabase
            .from('user_profiles')
            .update({ gold: currentGold - goldCost })
            .eq('id', user_id);

        if (deductError) {
            console.error('[Colosseum Start] Failed to deduct gold:', deductError);
            return NextResponse.json({ error: 'ゴールドの消費に失敗しました。' }, { status: 500 });
        }

        // Set quest lock (sets current_quest_id = 'colosseum_{difficulty}')
        const colosseumQuestId = `colosseum_${difficulty}`;
        await setQuestLock(user_id, colosseumQuestId);

        // Fetch location name for chronicle
        let locationName = null;
        if (user.current_location_id) {
            const { data: locData } = await supabase
                .from('locations')
                .select('name')
                .eq('id', user.current_location_id)
                .maybeSingle();
            if (locData) {
                locationName = locData.name;
            }
        }

        // Ensure user has colosseum stats initialized
        const { error: statsError } = await supabase
            .from('colosseum_user_stats')
            .upsert({ user_id }, { onConflict: 'user_id' });

        if (statsError) {
            console.warn('[Colosseum Start] Failed to initialize colosseum stats:', statsError);
        }

        // Record start event in user_chronicles
        const { error: chronicleError } = await supabase
            .from('user_chronicles')
            .insert({
                user_id,
                event_type: 'quest_start',
                accumulated_days: user.accumulated_days || 0,
                location_id: user.current_location_id,
                location_name: locationName,
                title: `コロシアム挑戦 (${diffLabel})`,
                description: `闘技場でバルガス支配人の受付を通し、コロシアム（難易度: ${diffLabel}）への挑戦を開始した。`,
                param_changes: { gold: -goldCost }
            });

        if (chronicleError) {
            console.error('[Colosseum Start] Failed to insert user_chronicles:', chronicleError);
        }

        return NextResponse.json({
            success: true,
            quest_id: colosseumQuestId,
            quest_title: `コロシアム (${diffLabel})`,
            locked: true,
            message: 'コロシアム挑戦開始。装備・デッキの変更はロックされました。'
        });

    } catch (e: any) {
        console.error("Colosseum Start Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
