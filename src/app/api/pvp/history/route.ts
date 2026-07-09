import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const userId = user.id;

        // 過去のシーズン履歴と今週のデイリー履歴を同時にロード (日付降順で最大50件)
        const [seasonRes, dailyRes] = await Promise.all([
            supabaseServer
                .from('pvp_season_history')
                .select('season_id, arena_rate, rank, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .order('id', { ascending: false })
                .limit(50),
            supabaseServer
                .from('pvp_daily_history')
                .select('date_str, arena_rate, rank, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .order('id', { ascending: false })
                .limit(50)
        ]);

        if (seasonRes.error) throw seasonRes.error;
        if (dailyRes.error) throw dailyRes.error;

        return NextResponse.json({
            success: true,
            seasons: seasonRes.data || [],
            dailies: dailyRes.data || []
        });

    } catch (err: any) {
        console.error('[PvP History API] Error:', err.message);
        return NextResponse.json({ error: err.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
