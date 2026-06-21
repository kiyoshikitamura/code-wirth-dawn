import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { consumeUsedItems } from '@/services/questCompleteHelpers';
import { processAging } from '@/services/questService';


export async function POST(req: Request) {
    try {
        // [Security] JWT認証必須化
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { consumed_items } = body;


        // ユーザープロフィール取得（VIT減少・年代記用）
        const { data: currentProfile } = await supabaseServer
            .from('user_profiles')
            .select('vitality, current_location_id, current_quest_id, accumulated_days, age, age_days, max_vitality, atk, def')
            .eq('id', userId)
            .single();

        let questTitle = '未知のクエスト';
        let isUgc = false;
        let daysPassed = 1; // 通常クエストはデフォルト1日

        if (currentProfile?.current_quest_id) {
            const questId = currentProfile.current_quest_id;
            const isColosseum = String(questId).startsWith('colosseum_');
            if (isColosseum) {
                const difficulty = String(questId).replace('colosseum_', '');
                const diffLabel = difficulty === 'normal' ? 'Normal' : (difficulty === 'hard' ? 'Hard' : 'Easy');
                questTitle = `コロシアム (${diffLabel})`;
                daysPassed = 3; // コロシアムは3日
            } else {
                const { data: officialQuest } = await supabaseServer
                    .from('scenarios')
                    .select('title, days_failure')
                    .eq('id', questId)
                    .maybeSingle();
                
                if (officialQuest) {
                    questTitle = officialQuest.title;
                    daysPassed = officialQuest.days_failure ?? 1;
                } else {
                    const { data: ugcQuest } = await supabaseServer
                        .from('ugc_scenarios')
                        .select('title, days_failure')
                        .eq('id', questId)
                        .maybeSingle();
                    if (ugcQuest) {
                        questTitle = ugcQuest.title;
                        daysPassed = ugcQuest.days_failure ?? 1;
                        isUgc = true;
                    }
                }
            }
        }

        if (!currentProfile?.current_quest_id) {
            console.warn(`[Quest Give Up] User ${userId} attempted to abandon a quest but has no active quest.`);
            return NextResponse.json({ error: 'You do not have an active quest to abandon.' }, { status: 400 });
        }

        // 放棄時に消費されたアイテム（consumed_items）があればインベントリから差し引く
        if (consumed_items && consumed_items.length > 0) {
            try {
                await consumeUsedItems(supabaseServer, userId, consumed_items);
            } catch (consumeErr) {
                console.error('[Quest Give Up] Failed to consume items during abandon:', consumeErr);
            }
        }

        // 1. プロフィール更新: ロック解除 (quest_started_atのnull化含む) + VIT -1 (楽観的排他制御)

        const currentMaxVit = currentProfile.max_vitality ?? 100;
        const currentVit = currentProfile.vitality ?? 100;
        const newMaxVit = Math.max(0, currentMaxVit - 1);
        const updatePayload: Record<string, any> = {
            current_quest_id: null,
            current_quest_state: null,
            quest_started_at: null,
            max_vitality: newMaxVit,
            vitality: Math.min(Math.max(0, currentVit - 1), newMaxVit),
        };

        if (daysPassed > 0) {
            const { newAge, newAgeDays, decay } = processAging(
                currentProfile.age || 20,
                currentProfile.age_days || 0,
                daysPassed
            );
            updatePayload.accumulated_days = (currentProfile.accumulated_days || 0) + daysPassed;
            updatePayload.age = newAge;
            updatePayload.age_days = newAgeDays;
            
            if (decay.vit > 0 || decay.atk > 0 || decay.def > 0) {
                const maxVit = currentProfile.max_vitality || 100;
                if (decay.vit > 0) {
                    updatePayload.max_vitality = Math.max(0, maxVit - decay.vit);
                    updatePayload.vitality = Math.min(updatePayload.vitality, updatePayload.max_vitality);
                }
                if (decay.atk > 0) updatePayload.atk = Math.max(1, (currentProfile.atk || 1) - decay.atk);
                if (decay.def > 0) updatePayload.def = Math.max(1, (currentProfile.def || 1) - decay.def);
            }
        }

        const { data: updatedProfiles, error } = await supabaseServer
            .from('user_profiles')
            .update(updatePayload)
            .eq('id', userId)
            .eq('current_quest_id', currentProfile.current_quest_id)
            .select('id');

        if (error) throw error;

        if (!updatedProfiles || updatedProfiles.length === 0) {
            console.warn(`[Security] API rejected quest abandon due to race condition. User: ${userId}, Quest: ${currentProfile.current_quest_id}`);
            return NextResponse.json({ error: 'Quest abandon already processed.' }, { status: 409 });
        }

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

                    // Reset Colosseum streak and increment losses
                    try {
                        const { data: stats } = await supabaseServer
                            .from('colosseum_user_stats')
                            .select('wins, losses, current_streak, max_streak')
                            .eq('user_id', userId)
                            .maybeSingle();

                        const currentStats = stats || { wins: 0, losses: 0, current_streak: 0, max_streak: 0 };

                        await supabaseServer
                            .from('colosseum_user_stats')
                            .upsert({
                                user_id: userId,
                                losses: currentStats.losses + 1,
                                current_streak: 0,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'user_id' });
                    } catch (statsErr) {
                        console.error('[Quest Give Up] Failed to reset Colosseum stats:', statsErr);
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

        // 3. 冒険日誌への失敗履歴の自動記述 (user_chronicles)
        if (currentProfile?.current_quest_id) {
            const questId = currentProfile.current_quest_id;
            try {
                const paramChanges: any = {
                    vitality_penalty: 1,
                };
                if (repPenalty !== 0 && repLocationName) {
                    paramChanges.reputation = {
                        location_name: repLocationName,
                        delta: repPenalty
                    };
                }

                await supabaseServer
                    .from('user_chronicles')
                    .insert({
                        user_id: userId,
                        event_type: 'quest_failure',
                        accumulated_days: currentProfile.accumulated_days || 0,
                        location_id: currentProfile.current_location_id,
                        location_name: repLocationName,
                        scenario_id: (isUgc || String(questId).startsWith('colosseum_')) ? null : questId,
                        ugc_scenario_id: isUgc ? questId : null,
                        title: `クエスト放棄: ${questTitle}`,
                        description: `宿屋にてクエスト『${questTitle}』を放棄し、撤退を余儀なくされた。`,
                        param_changes: paramChanges,
                        is_major_event: false
                    });
            } catch (chronicleErr) {
                console.error('[Quest Give Up] Failed to write user_chronicles:', chronicleErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Quest abandoned.',
            days_passed: daysPassed,
            penalty: {
                vit: 1,
                reputation: repPenalty,
                location: repLocationName,
            },
            changes: {
                gold_gained: 0,
                old_age: currentProfile.age || 18,
                new_age: updatePayload.age || currentProfile.age || 18,
                aged_up: (updatePayload.age || currentProfile.age || 18) > (currentProfile.age || 18),
                vit_penalty: 1,
                atk_decay: updatePayload.atk ? (currentProfile.atk - updatePayload.atk) : 0,
                def_decay: updatePayload.def ? (currentProfile.def - updatePayload.def) : 0,
            }
        });

    } catch (e: any) {
        console.error('[QuestGiveUp] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
