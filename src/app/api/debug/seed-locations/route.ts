import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/seed-locations
 *
 * locations.csv を読み込んで locations テーブルの prosperity_level を更新する。
 * その他のカラム（name, description等）も同期する。
 *
 * クエリパラメータ:
 *   - secret: ADMIN_SECRET_KEY (必須)
 *   - dry_run=true: 実際の書き込みをスキップ
 *   - slug=loc_regalia: 特定slugのみ同期
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const dryRun = url.searchParams.get('dry_run') === 'true';
    const filterSlug = url.searchParams.get('slug');

    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!serviceKey) {
        return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    // CSV読み込み
    const csvPath = path.join(process.cwd(), 'src', 'data', 'csv', 'locations.csv');
    let csvContent: string;
    try {
        csvContent = fs.readFileSync(csvPath, 'utf-8');
    } catch (e) {
        return NextResponse.json({ error: 'locations.csv not found', path: csvPath }, { status: 500 });
    }

    const lines = csvContent.split('\n').filter(l => l.trim());
    // ヘッダー: id,slug,name,type,ruling_nation_id,prosperity_level,...
    const rows = lines.slice(1);

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
        // locations.csv は JSON配列を含むためカンマ区切りが複雑
        // id, slug, name, type, ruling_nation_id, prosperity_level のみ抽出
        const parts = row.split(',');
        const id = parts[0]?.trim();
        const slug = parts[1]?.trim();
        const name = parts[2]?.trim();
        const type = parts[3]?.trim();
        const ruling_nation_id = parts[4]?.trim();
        const prosperity_level = parseInt(parts[5], 10);

        if (!id || !slug || isNaN(prosperity_level)) continue;
        if (filterSlug && slug !== filterSlug) continue;

        const updateData = {
            name,
            type,
            ruling_nation_id,
            prosperity_level,
        };

        if (dryRun) {
            results.push({ action: 'dry_run', id, slug, name, prosperity_level });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('locations')
            .update(updateData)
            .eq('id', id);

        if (error) {
            results.push({ action: 'error', id, slug, name, error: error.message });
            errorCount++;
        } else {
            results.push({ action: 'updated', id, slug, name, prosperity_level });
            successCount++;
        }
    }

    return NextResponse.json({
        success: true,
        dry_run: dryRun,
        locations: { total: successCount + errorCount, success: successCount, errors: errorCount },
        results,
    });
}
