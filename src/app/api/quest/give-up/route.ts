import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        // [Security] JWT認証必須化 — body.userIdを信頼しない
        let userId: string | null = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // ユーザープロフィール取得（VIT減少用）
        const { data: currentProfile } = await supabaseServer
            .from('user_profiles')
            .select('abandon_count, vitality, current_location_id')
            .eq('id', userId)
            .single();

        // 1. プロフィール更新: ロック解除 + abandon_count++ + VIT -1
        const currentVit = currentProfile?.vitality ?? 100;
        const { error } = await supabaseServer
            .from('user_profiles')
            .update({
                current_quest_id: null,
                current_quest_state: null,
                abandon_count: (currentProfile?.abandon_count ?? 0) + 1,
                vitality: Math.max(0, currentVit - 1),
            })
            .eq('id', userId);

        if (error) throw error;

        // 2. 名声ペナルティ: ランダム -5〜-10（クエスト失敗と同等）
        let repPenalty = 0;
        let repLocationName: string | null = null;
        const locationId = currentProfile?.current_location_id;
        if (locationId) {
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
