import { NextResponse } from 'next/server';
import { resetStaleAlignmentScores } from '@/services/worldStateReset';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/world-reset
 * 世界情勢アライメントスコアの定期リセット
 * Vercel Cron / 外部スケジューラから呼び出す
 * 
 * セキュリティ: CRON_SECRET ヘッダーで保護
 */
export async function GET(req: Request) {
    // Vercel Cron認証
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { resetCount, debug } = await resetStaleAlignmentScores();

        return NextResponse.json({
            success: true,
            resetCount,
            debug,
            timestamp: new Date().toISOString(),
        });
    } catch (e: any) {
        console.error('[CronWorldReset] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
