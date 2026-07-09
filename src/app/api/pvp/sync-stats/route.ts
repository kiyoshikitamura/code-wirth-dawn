import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { calculateCurrentCP } from '@/lib/arena';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. CPとレートのみをピンポイントで取得 (JOINなし) - 特権クライアントで確実にロードする
        const { data: profile, error } = await supabaseServer
            .from('user_profiles')
            .select('colosseum_cp, cp_last_recovered_at, arena_rate')
            .eq('id', user.id)
            .single();

        if (error || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // 2. CPの自然回復オンデマンド計算
        const dbCP = profile.colosseum_cp ?? 5;
        const dbLastRecoveredAt = profile.cp_last_recovered_at ?? new Date().toISOString();

        const { currentCP, nextRecoveryTimeMs, recoveredPoints } = calculateCurrentCP(
            dbCP,
            dbLastRecoveredAt
        );

        let finalCP = dbCP;
        let finalLastRecoveredAt = dbLastRecoveredAt;

        // 3. 回復による増分があれば、アトミックにDBに書き戻す
        if (recoveredPoints > 0) {
            finalCP = currentCP;
            const lastTime = new Date(dbLastRecoveredAt).getTime();
            const interval = 60 * 60 * 1000;
            // 回復したポイント数に相当する時間のみ進めて、秒以下の端数は正しく持ち越す
            const newRecoveredTime = new Date(lastTime + recoveredPoints * interval);
            finalLastRecoveredAt = newRecoveredTime.toISOString();

            await supabaseServer
                .from('user_profiles')
                .update({
                    colosseum_cp: finalCP,
                    cp_last_recovered_at: finalLastRecoveredAt
                })
                .eq('id', user.id);
        }

        return NextResponse.json({
            arena_rate: profile.arena_rate ?? 1000,
            colosseum_cp: finalCP,
            nextRecoveryTimeMs
        }, {
            headers: {
                // RateとCPは頻繁に可変するため、クライアント側ではキャッシュさせない
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
        });
    } catch (e: any) {
        console.error('[pvp/sync-stats] Error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
