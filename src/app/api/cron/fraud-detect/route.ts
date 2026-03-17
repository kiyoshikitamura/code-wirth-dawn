import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Service Role Client (RLSバイパス)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key',
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// 不正ゴールドの閾値（24時間以内にこの額を超えたアカウントをフラグ）
// 仕様: spec_v7_lifecycle_economy.md §5
const FRAUD_GOLD_THRESHOLD = 500_000;

/**
 * POST /api/cron/fraud-detect
 * GET  /api/cron/fraud-detect  (手動テスト用)
 *
 * 定期実行（Vercel Cron: 毎時0分）。
 * 所持金が異常に高いアカウントに is_flagged = true を付与し Discord 通知を行う。
 */
async function runFraudDetect(): Promise<{ flagged: string[]; logs: string[] }> {
    const logs: string[] = [];
    const flagged: string[] = [];

    // 1. 所持金が閾値を超えているアカウントを抽出
    const { data: suspects, error: scanErr } = await supabaseAdmin
        .from('user_profiles')
        .select('id, gold, is_flagged')
        .gte('gold', FRAUD_GOLD_THRESHOLD)
        .eq('is_flagged', false); // 既にフラグ済みは除外

    if (scanErr) {
        logs.push(`[fraud-detect] scan error: ${scanErr.message}`);
        return { flagged, logs };
    }

    if (!suspects || suspects.length === 0) {
        logs.push('[fraud-detect] 不正疑いアカウントなし');
        return { flagged, logs };
    }

    logs.push(`[fraud-detect] ${suspects.length}件の疑いアカウントを発見`);

    for (const user of suspects) {
        const reason = `gold=${user.gold.toLocaleString()}G が閾値（${FRAUD_GOLD_THRESHOLD.toLocaleString()}G）を超過`;

        // 2. is_flagged フラグを立てる
        const { error: updateErr } = await supabaseAdmin
            .from('user_profiles')
            .update({
                is_flagged: true,
                flagged_at: new Date().toISOString(),
                flag_reason: reason,
            })
            .eq('id', user.id);

        if (updateErr) {
            logs.push(`[fraud-detect] update error (${user.id}): ${updateErr.message}`);
            continue;
        }

        flagged.push(user.id);
        logs.push(`[fraud-detect] flagged: ${user.id} — ${reason}`);
    }

    // 3. Discord Webhook 通知
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl && flagged.length > 0) {
        try {
            const content = [
                `🚨 **不正検知アラート** (${new Date().toISOString()})`,
                `フラグ件数: **${flagged.length}件**`,
                flagged.map(id => `• \`${id}\``).join('\n'),
            ].join('\n');

            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            logs.push('[fraud-detect] Discord 通知送信完了');
        } catch (webhookErr: any) {
            logs.push(`[fraud-detect] Discord 通知失敗: ${webhookErr.message}`);
        }
    }

    return { flagged, logs };
}

export async function POST(req: Request) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    const result = await runFraudDetect();
    return NextResponse.json({ success: true, ...result });
}

export async function GET(req: Request) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    const result = await runFraudDetect();
    return NextResponse.json({ success: true, ...result });
}
