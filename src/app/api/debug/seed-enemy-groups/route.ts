import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/seed-enemy-groups
 *
 * enemy_groups.csv を読み込んで enemy_groups テーブルに upsert する。
 *
 * クエリパラメータ:
 *   - secret: ADMIN_SECRET_KEY (必須)
 *   - dry_run=true: 実際の書き込みをスキップ
 *   - id=210: 特定IDのみ同期
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const dryRun = url.searchParams.get('dry_run') === 'true';
    const filterId = url.searchParams.get('id');

    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!serviceKey) {
        return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    // CSV読み込み
    const csvPath = path.join(process.cwd(), 'src', 'data', 'csv', 'enemy_groups.csv');
    let csvContent: string;
    try {
        csvContent = fs.readFileSync(csvPath, 'utf-8');
    } catch (e) {
        return NextResponse.json({ error: 'enemy_groups.csv not found', path: csvPath }, { status: 500 });
    }

    const lines = csvContent.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    // ヘッダー行を探す（id,slug,members）
    const headerIdx = lines.findIndex(l => l.trim().startsWith('id,'));
    if (headerIdx < 0) {
        return NextResponse.json({ error: 'ヘッダー行が見つかりません' }, { status: 500 });
    }

    const rows = lines.slice(headerIdx + 1);

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
        const parts = row.split(',');
        const id = parseInt(parts[0], 10);
        if (isNaN(id)) continue;
        if (filterId && String(id) !== filterId) continue;

        const slug = parts[1]?.trim();
        // members はパイプ区切り（例: enemy_apostle_soldier|enemy_apostle_soldier）
        const membersRaw = parts[2]?.trim() || '';
        const members = membersRaw.split('|').filter(m => m.trim());

        const groupData = {
            id,
            slug,
            members,
        };

        if (dryRun) {
            results.push({ action: 'dry_run', id, slug, members, data: groupData });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('enemy_groups')
            .upsert(groupData, { onConflict: 'id' });

        if (error) {
            results.push({ action: 'error', id, slug, error: error.message });
            errorCount++;
        } else {
            results.push({ action: 'upserted', id, slug, members });
            successCount++;
        }
    }

    return NextResponse.json({
        success: true,
        dry_run: dryRun,
        filter_id: filterId || 'all',
        summary: { total: successCount + errorCount, success: successCount, errors: errorCount },
        results,
    });
}
