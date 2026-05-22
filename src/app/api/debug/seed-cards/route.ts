import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/seed-cards
 *
 * cards.csv を読み込んで cards テーブルに upsert する。
 * 併せて skills テーブルの card_id マッピングも更新する。
 *
 * クエリパラメータ:
 *   - secret: ADMIN_SECRET_KEY (必須)
 *   - dry_run=true: 実際の書き込みをスキップ
 *   - id=65: 特定IDのみ同期
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
    const csvPath = path.join(process.cwd(), 'src', 'data', 'csv', 'cards.csv');
    let csvContent: string;
    try {
        csvContent = fs.readFileSync(csvPath, 'utf-8');
    } catch (e) {
        return NextResponse.json({ error: 'cards.csv not found', path: csvPath }, { status: 500 });
    }

    const lines = csvContent.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',');
    const rows = lines.slice(1);

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
        // CSV行をパース（簡易: カンマ区切り、最後のdescriptionフィールドにカンマを含む可能性）
        const parts = row.split(',');
        const id = parseInt(parts[0], 10);
        if (isNaN(id)) continue; // IDなし行はスキップ（装備品等）
        if (filterId && String(id) !== filterId) continue;

        const slug = parts[1]?.trim();
        const name = parts[2]?.trim();
        const type = parts[3]?.trim();
        const ap_cost = parseInt(parts[4], 10) || 1;
        const cost_type = parts[5]?.trim() || null;
        const cost_val = parseInt(parts[6], 10) || 0;
        const effect_val = parseInt(parts[7], 10) || 0;
        const target_type = parts[8]?.trim() || null;
        const effect_id = parts[9]?.trim() || null;
        const image_url = parts[10]?.trim() || null;
        // description は残りの全フィールドを結合
        const description = parts.slice(11).join(',').trim() || null;

        const cardData = {
            id,
            slug,
            name,
            type,
            ap_cost,
            cost_type,
            cost_val,
            effect_val,
            target_type: target_type || null,
            effect_id: effect_id || null,
            image_url: image_url || null,
            description
        };

        if (dryRun) {
            results.push({ action: 'dry_run', id, name, data: cardData });
            successCount++;
            continue;
        }

        const { error } = await supabase
            .from('cards')
            .upsert(cardData, { onConflict: 'id' });

        if (error) {
            results.push({ action: 'error', id, name, error: error.message });
            errorCount++;
        } else {
            results.push({ action: 'upserted', id, name });
            successCount++;
        }
    }

    // [SK3 v27.3] items.csv の type='skill' エントリから card_id マッピングを自動構築
    // items.csv の effect_data JSON に card_id が指定されている場合はそれを使用
    const itemsCsvPath = path.join(process.cwd(), 'src', 'data', 'csv', 'items.csv');
    const skillResults: any[] = [];

    if (!dryRun) {
        try {
            const itemsCsvContent = fs.readFileSync(itemsCsvPath, 'utf-8');
            const itemLines = itemsCsvContent.split('\n').filter(l => l.trim());
            const itemHeaders = itemLines[0].split(',');
            const typeIdx = itemHeaders.indexOf('type');
            const slugIdx = itemHeaders.indexOf('slug');

            for (const line of itemLines.slice(1)) {
                // CSV行をパース（effect_data内のカンマに対応するため、JSON部分を特別扱い）
                const jsonMatch = line.match(/"\{.*?\}"/);
                let effectData: any = {};
                if (jsonMatch) {
                    try {
                        effectData = JSON.parse(jsonMatch[0].replace(/^"|"$/g, '').replace(/""/g, '"'));
                    } catch {}
                }

                const parts = line.split(',');
                const itemType = parts[typeIdx]?.trim();
                const slug = parts[slugIdx]?.trim();

                if (itemType !== 'skill' || !slug) continue;

                // effect_data.card_id があればマッピング
                const cardId = effectData.card_id;
                if (cardId && typeof cardId === 'number') {
                    const { error } = await supabase
                        .from('skills')
                        .update({ card_id: cardId })
                        .eq('slug', slug);

                    skillResults.push({
                        slug,
                        card_id: cardId,
                        action: error ? 'error' : 'updated',
                        error: error?.message
                    });
                }
            }
        } catch (e: any) {
            skillResults.push({ action: 'csv_read_error', error: e.message });
        }
    }

    return NextResponse.json({
        success: true,
        dry_run: dryRun,
        cards: { total: successCount + errorCount, success: successCount, errors: errorCount },
        card_results: results,
        skill_mappings: dryRun ? [{ action: 'dry_run', note: 'Mappings read from items.csv effect_data.card_id' }] : skillResults,
    });
}
