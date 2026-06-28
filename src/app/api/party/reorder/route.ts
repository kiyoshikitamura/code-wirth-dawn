process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { PartyService } from '@/services/partyService';
import { checkQuestLock } from '@/lib/questLock';
import { supabaseServer } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { memberIds } = body;

        if (!memberIds || !Array.isArray(memberIds)) {
            return NextResponse.json({ error: 'memberIds is required and must be an array' }, { status: 400 });
        }

        // 認証済みユーザーIDを取得
        const authClient = createAuthClient(req);
        const { data: { user } } = await authClient.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // クエストロックの確認
        const lock = await checkQuestLock(user.id);
        if (lock.locked) {
            // 野営地(camp)にいる場合はバイパスする
            const { data: profile } = await supabaseServer
                .from('user_profiles')
                .select('current_quest_state, current_quest_id')
                .eq('id', user.id)
                .single();
            
            let isCamp = false;
            if (profile?.current_quest_state?.currentNodeId && profile.current_quest_id) {
                const nodeId = profile.current_quest_state.currentNodeId;
                const { data: scenario } = await supabaseServer
                    .from('scenarios')
                    .select('script_data, flow_nodes')
                    .eq('id', profile.current_quest_id)
                    .single();
                
                if (scenario) {
                    const node = scenario.script_data?.nodes?.[nodeId] || scenario.flow_nodes?.find((n: any) => n.id === nodeId);
                    if (node?.type === 'camp') {
                        isCamp = true;
                    }
                }
            }

            if (!isCamp) {
                return NextResponse.json({ error: 'Forbidden: Cannot reorder party members during an active quest.' }, { status: 403 });
            }
        }

        // 順序の更新を実行
        await PartyService.reorderPartyMembers(user.id, memberIds);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
