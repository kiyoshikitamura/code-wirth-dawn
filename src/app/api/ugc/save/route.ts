import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // 認証クライアントを作成（RLS対応）
        const client = createAuthClient(request);
        
        // JWTからユーザーIDを検証取得
        const { data: { user }, error: authErr } = await client.auth.getUser();
        let userId: string | null = user?.id || null;

        // フォールバック: ヘッダーから直接取得
        if (!userId) {
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
                const token = authHeader.replace('Bearer ', '');
                const { data: { user: u2 }, error: e2 } = await supabase.auth.getUser(token);
                if (!e2 && u2) userId = u2.id;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: 有効な認証トークンが必要です' }, { status: 401 });
        }

        // bodyのuserIdと認証ユーザーの一致チェック
        if (body.userId && body.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized: ユーザーIDが一致しません' }, { status: 401 });
        }

        const { id, payload } = body;

        const {
            title,
            shortDescription,
            fullDescription,
            startLocationId,
            nodes,
            customReward
        } = payload;

        // Auto-calculate suggested level based on nodes
        let suggestLevel = 1;
        nodes.forEach((n: any) => {
            if (n.type === 'battle' && n.enemyData?.level) {
                if (n.enemyData.level > suggestLevel) {
                    suggestLevel = n.enemyData.level;
                }
            }
        });

        const dbPayload = {
            slug: `ugc_${userId.substring(0, 8)}_${Date.now()}`,
            title,
            short_description: shortDescription,
            full_description: fullDescription,
            description: shortDescription,
            client_name: '謎の依頼人',
            type: 'Other',
            difficulty: Math.ceil(suggestLevel / 10) || 1,
            rec_level: suggestLevel,
            is_urgent: false,
            time_cost: 1,
            location_id: startLocationId,
            status: 'draft',
            flow_nodes: nodes,
            conditions: {},
            rewards: {
                ugc_item: customReward || null,
                gold: 100
            }
        };

        (dbPayload as any).creator_id = userId;

        // Check Submission Limits
        if (!id) {
            const { data: creatorProfile } = await client
                .from('user_profiles')
                .select('subscription_tier')
                .eq('id', userId)
                .single();

            const tier = creatorProfile?.subscription_tier ?? 'free';
            const draftLimit = tier === 'premium' ? 52 : tier === 'basic' ? 12 : 4;

            const { count, error: countErr } = await client
                .from('scenarios')
                .select('*', { count: 'exact', head: true })
                .eq('creator_id', userId);

            if (countErr) {
                console.error('UGC Save - Count Error:', JSON.stringify(countErr));
                throw new Error(countErr.message || 'Failed to check draft count');
            }
            if (count && count >= draftLimit) {
                return NextResponse.json({
                    error: `UGCの作成可能枠（最大${draftLimit}枠）の上限に達しています。`,
                    limit: draftLimit,
                    current: count,
                }, { status: 400 });
            }
        }

        let result;
        if (id) {
            const { data, error } = await client
                .from('scenarios')
                .update(dbPayload)
                .eq('id', id)
                .eq('creator_id', userId)
                .select('id')
                .single();
            if (error) {
                console.error('UGC Save - Update Error:', JSON.stringify(error));
                throw new Error(error.message || JSON.stringify(error));
            }
            result = data;
        } else {
            const { data, error } = await client
                .from('scenarios')
                .insert(dbPayload)
                .select('id')
                .single();
            if (error) {
                console.error('UGC Save - Insert Error:', JSON.stringify(error));
                throw new Error(error.message || JSON.stringify(error));
            }
            result = data;
        }

        return NextResponse.json({ success: true, questId: result.id });

    } catch (e: any) {
        console.error("UGC Save API Error:", e);
        return NextResponse.json({ error: 'Save failed: ' + (e.message || JSON.stringify(e)) }, { status: 500 });
    }
}
