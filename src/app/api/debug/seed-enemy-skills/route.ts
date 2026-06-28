process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/seed-enemy-skills
 *
 * enemy_skills.csv を読み込んで enemy_skills テーブルに upsert するシードエンドポイント。
 * 
 * クエリパラメータ:
 *   - secret: ADMIN_SECRET_KEY (必須)
 *   - dry_run=true: 実際の書き込みをスキップ
 *   - id=2041: 特定IDのみ同期
 *   - cleanup=true: CSVに存在しないDBレコードを削除
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
    const cleanup = url.searchParams.get('cleanup') === 'true';

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
    const csvPath = path.join(process.cwd(), 'src', 'data', 'csv', 'enemy_skills.csv');
    let csvContent: string;
    try {
        csvContent = fs.readFileSync(csvPath, 'utf-8');
    } catch (e) {
        return NextResponse.json({ error: 'enemy_skills.csv not found', path: csvPath }, { status: 500 });
    }

    const lines = csvContent.split('\n').map(l => l.replace(/\r$/, '').trim()).filter(Boolean);
    if (lines.length < 2) {
        return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 });
    }

    // ヘッダー解析: id,slug,name,effect_type,value,description
    const header = lines[0].split(',').map(h => h.trim());
    const colIdx: Record<string, number> = {};
    header.forEach((h, i) => { colIdx[h] = i; });

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;
    const csvIds: number[] = [];

    for (let i = 1; i < lines.length; i++) {
        const fields = lines[i].split(',').map(f => f.trim());
        const id = parseInt(fields[colIdx['id']], 10);
        if (isNaN(id)) continue;

        csvIds.push(id);
        if (filterId && id !== parseInt(filterId, 10)) continue;

        const record = {
            id,
            slug: fields[colIdx['slug']] || '',
            name: fields[colIdx['name']] || '',
            effect_type: fields[colIdx['effect_type']] || 'damage',
            value: parseFloat(fields[colIdx['value']] || '0'),
            description: fields[colIdx['description']] || '',
        };

        if (dryRun) {
            results.push({ action: 'dry_run', ...record });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('enemy_skills')
            .upsert(record, { onConflict: 'id' });

        if (error) {
            results.push({ action: 'error', id, slug: record.slug, error: error.message });
            errorCount++;
        } else {
            results.push({ action: 'upserted', id, slug: record.slug, name: record.name });
            successCount++;
        }
    }

    // クリーンアップ: CSVに存在しないDBレコードを削除
    let cleanupResults: any[] = [];
    if (cleanup && !dryRun && csvIds.length > 0) {
        const { data: dbRecords } = await supabase
            .from('enemy_skills')
            .select('id, slug')
            .order('id');

        if (dbRecords) {
            const csvIdSet = new Set(csvIds);
            const toDelete = dbRecords.filter(r => !csvIdSet.has(r.id));

            for (const rec of toDelete) {
                const { error } = await supabase
                    .from('enemy_skills')
                    .delete()
                    .eq('id', rec.id);

                cleanupResults.push({
                    action: error ? 'delete_error' : 'deleted',
                    id: rec.id,
                    slug: rec.slug,
                    error: error?.message
                });
            }
        }
    }

    return NextResponse.json({
        success: errorCount === 0,
        dry_run: dryRun,
        filter_id: filterId || 'all',
        summary: {
            total: successCount + errorCount,
            success: successCount,
            errors: errorCount,
            cleanup: cleanupResults.length
        },
        results,
        cleanup_results: cleanupResults.length > 0 ? cleanupResults : undefined,
    });
}
