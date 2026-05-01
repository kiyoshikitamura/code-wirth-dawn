import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/seed-skills
 *
 * skills.csv を読み込んで skills テーブルに upsert する。
 * deck_cost, base_price, min_prosperity, is_black_market 等を更新。
 *
 * クエリパラメータ:
 *   - secret: ADMIN_SECRET_KEY (必須)
 *   - dry_run=true: 実際の書き込みをスキップ
 *   - id=1: 特定IDのみ同期
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

    // CSV読み込み
    const csvPath = path.join(process.cwd(), 'src', 'data', 'csv', 'skills.csv');
    let csvContent: string;
    try {
        csvContent = fs.readFileSync(csvPath, 'utf-8');
    } catch (e) {
        return NextResponse.json({ error: 'skills.csv not found', path: csvPath }, { status: 500 });
    }

    const lines = csvContent.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',');
    const rows = lines.slice(1);

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
        const parts = row.split(',');
        const id = parseInt(parts[0], 10);
        if (isNaN(id)) continue;
        if (filterId && String(id) !== filterId) continue;

        const slug = parts[1]?.trim();
        const name = parts[2]?.trim();
        const card_id = parseInt(parts[3], 10) || null;
        const base_price = parseInt(parts[4], 10) || 0;
        const deck_cost = parseInt(parts[5], 10) || 1;
        const nation_tags_raw = parts[6]?.trim() || '[]';
        const min_prosperity = parseInt(parts[7], 10) || 1;
        const is_black_market = parts[8]?.trim() === 'true';
        const image_url = parts[9]?.trim() || null;
        // description は残りの全フィールドを結合
        const description = parts.slice(10).join(',').trim() || null;

        // nation_tags をパース: "Roland|Yato" → ["Roland", "Yato"], "any" → []
        let nation_tags: string[] = [];
        if (nation_tags_raw === 'any' || nation_tags_raw === '') {
            nation_tags = [];
        } else {
            try {
                if (nation_tags_raw.startsWith('[')) {
                    nation_tags = JSON.parse(nation_tags_raw.replace(/'/g, '"'));
                } else {
                    nation_tags = nation_tags_raw.split('|').filter(t => t.trim());
                }
            } catch {
                nation_tags = nation_tags_raw.split('|').filter(t => t.trim());
            }
        }

        const skillData: any = {
            id,
            slug,
            name,
            card_id,
            base_price,
            deck_cost,
            nation_tags,
            min_prosperity,
            is_black_market,
        };
        if (image_url) skillData.image_url = image_url;
        if (description) skillData.description = description;

        if (dryRun) {
            results.push({ action: 'dry_run', id, name, data: skillData });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('skills')
            .upsert(skillData, { onConflict: 'id' });

        if (error) {
            results.push({ action: 'error', id, name, error: error.message });
            errorCount++;
        } else {
            results.push({ action: 'upserted', id, name });
            successCount++;
        }
    }

    return NextResponse.json({
        success: true,
        dry_run: dryRun,
        skills: { total: successCount + errorCount, success: successCount, errors: errorCount },
        results,
    });
}
