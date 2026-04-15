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

        return NextResponse.json({ success: true, logs: result.logs, hegemony: result.hegemony, cleanup: cleanupLog });
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
