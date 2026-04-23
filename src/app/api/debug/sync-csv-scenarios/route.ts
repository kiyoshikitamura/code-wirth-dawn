import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseCsvToScenarioJson } from '@/lib/csvScenarioLoader';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/sync-csv-scenarios
 *
 * CSVシナリオファイルをパースして scenarios.script_data に同期する。
 * クエリパラメータ:
 *   - secret: ADMIN_SECRET_KEY (必須)
 *   - dry_run=true: 実際の書き込みをスキップ
 *   - id=6001: 特定IDのみ同期
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    const dryRun = url.searchParams.get('dry_run') === 'true';
    const filterId = url.searchParams.get('id');

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

    // CSV ディレクトリを走査
    const csvDir = path.join(process.cwd(), 'src', 'data', 'csv', 'scenarios');
    let csvFiles: string[];
    try {
        csvFiles = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));
    } catch (e) {
        return NextResponse.json({ error: 'CSV directory not found', path: csvDir }, { status: 500 });
    }

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const file of csvFiles) {
        // ファイル名から scenario ID を抽出 (例: "6001_main_ep01.csv" → 6001)
        const match = file.match(/^(\d+)/);
        if (!match) {
            results.push({ file, status: 'skipped', reason: 'no numeric prefix' });
            continue;
        }

        const scenarioId = parseInt(match[1], 10);

        if (filterId && scenarioId !== parseInt(filterId, 10)) continue;

        try {
            const csvPath = path.join(csvDir, file);
            const csvText = fs.readFileSync(csvPath, 'utf-8');
            const scenarioJson = parseCsvToScenarioJson(csvText);
            const nodeCount = Object.keys(scenarioJson.nodes).length;

            if (nodeCount === 0) {
                results.push({ file, scenarioId, status: 'skipped', reason: 'no nodes parsed' });
                continue;
            }

            // サンプルノード出力 (デバッグ用)
            const startNode = scenarioJson.nodes['start'];
            const sampleInfo = startNode ? {
                text: (startNode.text || '').substring(0, 50) + '...',
                type: startNode.type,
                bg_key: startNode.bg_key,
                bgm: startNode.bgm,
                speaker_name: startNode.speaker_name,
                speaker_image_url: startNode.speaker_image_url ? '✓ present' : '✗ absent',
            } : null;

            if (dryRun) {
                results.push({ file, scenarioId, nodeCount, status: 'dry_run', startNode: sampleInfo });
                successCount++;
                continue;
            }

            // DB 更新: script_data をアップサート
            const { error } = await supabase
                .from('scenarios')
                .update({ script_data: scenarioJson })
                .eq('id', scenarioId);

            if (error) {
                results.push({ file, scenarioId, nodeCount, status: 'error', error: error.message });
                errorCount++;
            } else {
                results.push({ file, scenarioId, nodeCount, status: 'synced', startNode: sampleInfo });
                successCount++;
            }
        } catch (e: any) {
            results.push({ file, scenarioId, status: 'error', error: e.message });
            errorCount++;
        }
    }

    return NextResponse.json({
        summary: { total: results.length, success: successCount, errors: errorCount, dryRun },
        results
    });
}
