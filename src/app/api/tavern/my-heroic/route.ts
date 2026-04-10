import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';

/**
 * GET /api/tavern/my-heroic?user_id={userId}
 * 自分のキャラクターが英霊（shadow_heroic）として登録されているか確認する。
 * historical_logs テーブルから自分のレコードを取得し UI に返す。
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
        }

        const client = createAuthClient(req);

        // historical_logs から自分の英霊レコードを取得
        const { data: heroicLogs, error } = await client
            .from('historical_logs')
            .select('id, user_id, data, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 英霊の表示用データを整形
        const heroics = (heroicLogs || []).map(log => ({
            id: log.id,
            name: log.data?.name || '名もなき英霊',
            level: log.data?.final_level || log.data?.level || 1,
            job_class: log.data?.job_class || log.data?.title_name || 'Adventurer',
            created_at: log.created_at,
        }));

        // サブスクリプション tier も返却 (UI での登録上限表示用)
        const { data: profile } = await client
            .from('user_profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .maybeSingle();

        const tier = profile?.subscription_tier || 'free';
        const maxSlots = tier === 'premium' ? 10 : tier === 'basic' ? 3 : 0;

        return NextResponse.json({ heroics, subscription_tier: tier, max_slots: maxSlots });

    } catch (e: any) {
        console.error('[tavern/my-heroic] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
