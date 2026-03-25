import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ugc/list — ログインユーザーのUGC一覧取得
 * DELETE /api/ugc/list — UGC下書きを削除
 */
export async function GET(request: Request) {
    try {
        let userId: string | null = null;
        const authHeader = request.headers.get('authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // rewards._ugc_meta.creator_id でユーザーのUGCを取得
        // creator_idカラムが使える場合はそちらも併用
        const { data: scenarios, error } = await supabaseServer
            .from('scenarios')
            .select('id, title, description, type, status, created_at, flow_nodes, rewards, creator_id')
            .eq('type', 'Other')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // ユーザーのUGCのみフィルタ（creator_idカラム OR rewards._ugc_meta.creator_id）
        const myScenarios = (scenarios || []).filter(s => 
            s.creator_id === userId || 
            (s.rewards as any)?._ugc_meta?.creator_id === userId
        );

        const result = myScenarios.map(s => ({
            id: s.id,
            title: s.title,
            description: s.description,
            status: s.status || (s.rewards as any)?._ugc_meta?.status || 'draft',
            nodeCount: Array.isArray(s.flow_nodes) ? s.flow_nodes.length : 0,
            created_at: s.created_at,
        }));

        return NextResponse.json({ scenarios: result, count: result.length });
    } catch (e: any) {
        console.error('[ugc/list] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        let userId: string | null = null;
        const authHeader = request.headers.get('authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const scenarioId = searchParams.get('id');
        
        if (!scenarioId) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        // まず所有者確認
        const { data: scenario, error: fetchErr } = await supabaseServer
            .from('scenarios')
            .select('id, rewards, creator_id')
            .eq('id', scenarioId)
            .single();

        if (fetchErr || !scenario) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        // 所有者チェック
        const isOwner = scenario.creator_id === userId || 
            (scenario.rewards as any)?._ugc_meta?.creator_id === userId;
        
        if (!isOwner) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        // 削除
        const { error: delErr } = await supabaseServer
            .from('scenarios')
            .delete()
            .eq('id', scenarioId);

        if (delErr) throw delErr;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[ugc/list] DELETE Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
