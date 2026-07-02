process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
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
    if (process.env.VERCEL_ENV === 'production') {
        return NextResponse.json(
            { error: 'Debug routes are not available in production' },
            { status: 403 }
        );
    }

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

    const records: any[] = [];

    for (const row of rows) {
        const parts = row.split(',');
        const id = parseInt(parts[0], 10);
        if (isNaN(id)) continue;
        if (filterId && String(id) !== filterId) continue;

        const slug = parts[1]?.trim();
        const membersRaw = parts[2]?.trim() || '';
        const members = membersRaw.split('|').filter(m => m.trim());

        const groupData = {
            id,
            slug,
            members,
        };

        records.push(groupData);
    }

    if (dryRun) {
        return NextResponse.json({
            success: true,
            dry_run: true,
            summary: { total: records.length, success: records.length, errors: 0 },
            results: records.map(r => ({ action: 'dry_run', id: r.id, slug: r.slug, members: r.members }))
        });
    }

    const { error } = await supabase
        .from('enemy_groups')
        .upsert(records, { onConflict: 'id' });

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        dry_run: false,
        summary: { total: records.length, success: records.length, errors: 0 }
    });
}
