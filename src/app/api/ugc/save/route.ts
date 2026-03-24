import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // JWT認証からユーザーIDを取得
        let userId: string | null = null;
        const authHeader = request.headers.get('authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
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

        // dbPayload — 実際のscenariosテーブルカラムのみ使用
        // 存在しないカラム: full_description, short_description, status, creator_id
        // → descriptionカラムにshortDescription/fullDescriptionを統合保存
        const dbPayload: Record<string, any> = {
            slug: `ugc_${userId.substring(0, 8)}_${Date.now()}`,
            title,
            description: shortDescription || fullDescription || '',
            client_name: '謎の依頼人',
            type: 'Other',
            difficulty: Math.ceil(suggestLevel / 10) || 1,
            rec_level: suggestLevel,
            is_urgent: false,
            time_cost: 1,
            location_id: startLocationId,
            flow_nodes: nodes,
            conditions: {},
            rewards: {
                ugc_item: customReward || null,
                gold: 100,
                // UGC メタデータを rewards JSONB 内に保存（帰属管理用）
                _ugc_meta: {
                    creator_id: userId,
                    short_description: shortDescription || '',
                    full_description: fullDescription || '',
                    status: 'draft',
                }
            }
        };

        // Check Submission Limits (rewards._ugc_meta.creator_id ベースで簡易チェック)
        // NOTE: creator_idカラム追加後は直接カラムベースに切り替える
        if (!id) {
            const { data: creatorProfile } = await supabase
                .from('user_profiles')
                .select('subscription_tier')
                .eq('id', userId)
                .single();

            const tier = creatorProfile?.subscription_tier ?? 'free';
            const draftLimit = tier === 'premium' ? 52 : tier === 'basic' ? 12 : 4;

            // 全UGCシナリオのうち自分のものをカウント（JSONB内のcreator_idで照合）
            const { data: allScenarios, error: listErr } = await supabase
                .from('scenarios')
                .select('id, rewards')
                .eq('type', 'Other');
            
            if (!listErr && allScenarios) {
                const myCount = allScenarios.filter(s => 
                    s.rewards?._ugc_meta?.creator_id === userId
                ).length;
                
                if (myCount >= draftLimit) {
                    return NextResponse.json({
                        error: `UGCの作成可能枠（最大${draftLimit}枠）の上限に達しています。`,
                        limit: draftLimit,
                        current: myCount,
                    }, { status: 400 });
                }
            }
        }

        let result;
        if (id) {
            const { data, error } = await supabase
                .from('scenarios')
                .update(dbPayload)
                .eq('id', id)
                .select('id')
                .single();
            if (error) {
                console.error('UGC Save - Update Error:', JSON.stringify(error));
                throw new Error(error.message || JSON.stringify(error));
            }
            result = data;
        } else {
            const { data, error } = await supabase
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
