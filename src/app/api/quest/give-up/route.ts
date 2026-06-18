import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        // [Security] JWT認証必須化
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // ユーザープロフィール取得（VIT減少用）
        const { data: currentProfile } = await supabaseServer
            .from('user_profiles')
            .select('vitality, current_location_id, current_quest_id')
            .eq('id', userId)
            .single();

        // 1. プロフィール更新: ロック解除 + VIT -1
        const currentVit = currentProfile?.vitality ?? 100;
        const { error } = await supabaseServer
            .from('user_profiles')
            .update({
                current_quest_id: null,
                current_quest_state: null,
                vitality: Math.max(0, currentVit - 1),
            })
            .eq('id', userId);

        if (error) throw error;

        // Record quest activity log (Spec Dashboard Extensions)
        try {
            if (currentProfile?.current_quest_id) {
                const questIdStr = String(currentProfile.current_quest_id);
                if (questIdStr.startsWith('colosseum_')) {
                    const difficulty = questIdStr.replace('colosseum_', '');
                    const { error: logErr } = await supabaseServer
                        .from('colosseum_activity_logs')
                        .insert({
                            user_id: userId,
                            difficulty,
                            action: 'abandon',
                            gold_cost: 0
                        });
                    if (logErr) {
                        console.error('[Quest Give Up] Failed to write colosseum_activity_logs:', logErr);
                    }
                } else {
                    const { error: logErr } = await supabaseServer
                        .from('quest_activity_logs')
                        .insert({
                            user_id: userId,
                            scenario_id: currentProfile.current_quest_id,
                            action: 'abandon'
                        });
                    if (logErr) {
                        console.error('[Quest Give Up] Failed to write quest_activity_logs:', logErr);
                    }
                }
            }
        } catch (logErr) {
            console.error('[Quest Give Up] Log exception:', logErr);
        }

        // 2. 名声ペナルティ: ランダム -5〜-10（クエスト失敗と同等）
        let repPenalty = 0;
        let repLocationName: string | null = null;
        const locationId = currentProfile?.current_location_id;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (locationId && uuidRegex.test(locationId)) {
            try {
                repPenalty = -(Math.floor(Math.random() * 6) + 5); // -5 〜 -10

                const { data: locData } = await supabaseServer
                    .from('locations')
                    .select('name')
                    .eq('id', locationId)
                    .maybeSingle();
                repLocationName = locData?.name || null;

                if (repLocationName) {
                    const { data: existingRep } = await supabaseServer
                        .from('reputations')
                        .select('id, score')
                        .eq('user_id', userId)
                        .eq('location_name', repLocationName)
                        .maybeSingle();

                    if (existingRep) {
                        await supabaseServer
                            .from('reputations')
                            .update({ score: existingRep.score + repPenalty })
                            .eq('id', existingRep.id);
                    } else {
                        await supabaseServer
                            .from('reputations')
                            .insert({ user_id: userId, location_name: repLocationName, score: repPenalty });
                    }
                }
            } catch (repErr) {
                console.error('[Quest Give Up] Reputation penalty update exception:', repErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Quest abandoned.',
            penalty: {
                vit: -1,
                reputation: repPenalty,
                location: repLocationName,
            }
        });

    } catch (e: any) {
        console.error('[QuestGiveUp] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
