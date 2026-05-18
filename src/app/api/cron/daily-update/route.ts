import { NextResponse } from 'next/server';
import { updateWorldSimulation } from '@/lib/world-simulation';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// Vercel Cron Job: 毎日 UTC 0:00 に自動実行
// vercel.json で "path": "/api/cron/daily-update", "schedule": "0 0 * * *" を設定
export async function POST(req: Request) {
    // CRON_SECRET によるアクセス制限
    // Vercel Cron は Authorization: Bearer <CRON_SECRET> ヘッダーを付与する
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const result = await updateWorldSimulation();

        if (!result.success) {
            return NextResponse.json({ success: false, logs: result.logs, error: result.error }, { status: 500 });
        }

        // 失効した匿名（テストプレイ）プロファイルを圧削
        // 安全のため失敗しても全体は継続する
        let cleanupLog = 'skipped';
        try {
            const now = new Date().toISOString();
            const { count, error: deleteError } = await supabaseServer
                .from('user_profiles')
                .delete({ count: 'exact' })
                .eq('is_anonymous', true)
                .lt('expires_at', now);
            cleanupLog = deleteError
                ? `error: ${deleteError.message}`
                : `deleted ${count ?? 0} expired anonymous profiles`;
        } catch (cleanupErr: any) {
            cleanupLog = `exception: ${cleanupErr.message}`;
        }

        // Weeklyログインボーナス (spec_v13.2)
        // Basic: 2,000G/週, Premium: 5,000G/週
        let weeklyBonusLog = 'skipped';
        try {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

            // 対象: Basic/Premium ユーザーで、最終ボーナスが7日以上前 or null
            const { data: eligibleUsers, error: fetchErr } = await supabaseServer
                .from('user_profiles')
                .select('id, subscription_tier, last_weekly_bonus_at')
                .in('subscription_tier', ['basic', 'premium'])
                .eq('is_anonymous', false);

            if (fetchErr) throw fetchErr;

            let bonusCount = 0;
            for (const user of (eligibleUsers || [])) {
                // 最終ボーナスから7日未経過ならスキップ
                if (user.last_weekly_bonus_at && user.last_weekly_bonus_at > sevenDaysAgo) continue;

                const amount = user.subscription_tier === 'premium' ? 5000 : 2000;

                const { error: goldErr } = await supabaseServer
                    .rpc('increment_gold', { p_user_id: user.id, p_amount: amount });

                if (!goldErr) {
                    await supabaseServer
                        .from('user_profiles')
                        .update({ last_weekly_bonus_at: now.toISOString() })
                        .eq('id', user.id);
                    bonusCount++;
                }
            }
            weeklyBonusLog = `awarded ${bonusCount} users`;
        } catch (bonusErr: any) {
            weeklyBonusLog = `exception: ${bonusErr.message}`;
        }

        return NextResponse.json({ success: true, logs: result.logs, hegemony: result.hegemony, cleanup: cleanupLog, weekly_bonus: weeklyBonusLog });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// GET も許可（手動テスト・デバッグ用）
export async function GET(req: Request) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const result = await updateWorldSimulation();
        if (!result.success) {
            return NextResponse.json({ success: false, logs: result.logs, error: result.error }, { status: 500 });
        }
        return NextResponse.json({ success: true, logs: result.logs, hegemony: result.hegemony });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
