import { NextResponse } from 'next/server';
import { reportOnlineCount } from '@/services/onlineCountService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/online-count
 * GET  /api/cron/online-count  (手動テスト用)
 *
 * 定期実行（Vercel Cron: 5分ごと）。
 * 同時接続数を集計し、外部ポータルAPIに送信します。
 */
export async function POST(req: Request) {
    if (process.env.SUSPEND_CRON === 'true') {
        return NextResponse.json({ success: true, message: 'Cron is suspended' });
    }

    // CRON_SECRET によるアクセス制限
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await reportOnlineCount();
    return NextResponse.json(result);
}

export async function GET(req: Request) {
    if (process.env.SUSPEND_CRON === 'true') {
        return NextResponse.json({ success: true, message: 'Cron is suspended' });
    }

    // CRON_SECRET によるアクセス制限
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await reportOnlineCount();
    return NextResponse.json(result);
}
