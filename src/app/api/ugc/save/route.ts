import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        let userId = body.userId;
        const authHeader = request.headers.get('authorization');
        
        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

        // Pack into Scenario Database Model
        // We put customReward inside rewards.ugc_item for now to prevent bloating items table before publish.
        const dbPayload = {
            slug: `ugc_${userId.substring(0, 8)}_${Date.now()}`,
            title,
            short_description: shortDescription,
            full_description: fullDescription,
            description: shortDescription, // fallback
            client_name: '謎の依頼人',
            type: 'Other', // Or maybe 'UGC' if added to enum
            difficulty: Math.ceil(suggestLevel / 10) || 1,
            rec_level: suggestLevel,
            is_urgent: false,
            time_cost: 1,
            location_id: startLocationId,
            status: 'draft',
            // creator_id: userId, // Assuming creator_id exists in DB from migration
            flow_nodes: nodes,
            conditions: {},
            rewards: {
                ugc_item: customReward || null,
                gold: 100 // Default minimal reward
            }
        };

        // For now we add creator_id manually. If it errors because the column doesn't exist, the user needs to add it.
        (dbPayload as any).creator_id = userId;

        // Check Submission Limits based on subscription tier
        // Free: 4 drafts max, Subscriber: 10 max
        if (!id) {
            const { data: creatorProfile } = await supabase
                .from('user_profiles')
                .select('subscription_tier')
                .eq('id', userId)
                .single();

            const tier = creatorProfile?.subscription_tier ?? 'free';
            const draftLimit = tier === 'premium' ? 52 : tier === 'basic' ? 12 : 4;

            const { count, error: countErr } = await supabase
                .from('scenarios')
                .select('*', { count: 'exact', head: true })
                .eq('creator_id', userId);

            if (countErr) throw countErr;
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
            // Update
            const { data, error } = await supabase
                .from('scenarios')
                .update(dbPayload)
                .eq('id', id)
                .eq('creator_id', userId)
                .select('id')
                .single();
            if (error) throw error;
            result = data;
        } else {
            // Insert
            const { data, error } = await supabase
                .from('scenarios')
                .insert(dbPayload)
                .select('id')
                .single();
            if (error) throw error;
            result = data;
        }

        return NextResponse.json({ success: true, questId: result.id });

    } catch (e: any) {
        console.error("UGC Save API Error:", e);
        return NextResponse.json({ error: 'Save failed: ' + e.message }, { status: 500 });
    }
}
