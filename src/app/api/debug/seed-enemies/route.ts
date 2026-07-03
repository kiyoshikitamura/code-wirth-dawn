process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/seed-enemies
 *
 * enemies.csv を読み込み、enemies テーブルに upsert するシードエンドポイント。
 * enemy_actions.csv からアクションパターンも構築し、action_pattern JSONB に反映する。
 * クエリパラメータ:
 *   - secret: ADMIN_SECRET_KEY (必須)
 *   - dry_run=true: 実際の書き込みをスキップ
 *   - id=2111: 特定IDのみ同期
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

    // ─── enemy_actions.csv を読み込み、slug別のアクションパターンを構築 ───
    const actionPatternMap: Record<string, Array<{ skill: string; prob: number; condition?: string }>> = {};
    const actionsPath = path.join(process.cwd(), 'src', 'data', 'csv', 'enemy_actions.csv');
    try {
        const actionsText = fs.readFileSync(actionsPath, 'utf-8');
        const actionLines = actionsText.split('\n').map(l => l.replace(/\r$/, '').trim()).filter(Boolean);
        // ヘッダー: id,enemy_slug,skill_slug,prob,condition_type,condition_value
        for (let i = 1; i < actionLines.length; i++) {
            const parts = actionLines[i].split(',');
            const enemySlug = (parts[1] || '').trim();
            const skillSlug = (parts[2] || '').trim();
            const prob = parseInt(parts[3] || '0', 10);
            const condType = (parts[4] || '').trim();
            const condVal = (parts[5] || '').trim();

            if (!enemySlug || !skillSlug) continue;

            if (!actionPatternMap[enemySlug]) {
                actionPatternMap[enemySlug] = [];
            }

            const action: { skill: string; prob: number; condition?: string } = {
                skill: skillSlug,
                prob,
            };
            if (condType && condVal) {
                action.condition = `${condType}:${condVal}`;
            }
            actionPatternMap[enemySlug].push(action);
        }
    } catch (e) {
        console.warn('[seed-enemies] enemy_actions.csv not found, action_pattern will not be updated');
    }

    // ─── enemies.csv 読み込み ───
    const csvPath = path.join(process.cwd(), 'src', 'data', 'csv', 'enemies.csv');
    let csvText: string;
    try {
        csvText = fs.readFileSync(csvPath, 'utf-8');
    } catch (e) {
        return NextResponse.json({ error: 'enemies.csv not found', path: csvPath }, { status: 500 });
    }

    const lines = csvText.split('\n').map(l => l.replace(/\r$/, '').trim()).filter(Boolean);
    if (lines.length < 2) {
        return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 });
    }

    // ヘッダー解析
    const header = lines[0].split(',').map(h => h.trim());
    const colIdx: Record<string, number> = {};
    header.forEach((h, i) => { colIdx[h] = i; });

    const records: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const fields = lines[i].split(',').map(f => f.trim());
        const id = parseInt(fields[colIdx['id']], 10);
        if (isNaN(id)) continue;

        if (filterId && id !== parseInt(filterId, 10)) continue;

        const slug = fields[colIdx['slug']] || '';
        const name = fields[colIdx['name']] || '';
        const level = parseInt(fields[colIdx['level']] || '1', 10);
        const hp = parseInt(fields[colIdx['hp']] || '50', 10);
        const atk = parseInt(fields[colIdx['atk']] || '10', 10);
        const def = parseInt(fields[colIdx['def']] || '0', 10);
        const exp = parseInt(fields[colIdx['exp']] || '0', 10);
        const gold = parseInt(fields[colIdx['gold']] || '0', 10);
        const dropItemId = fields[colIdx['drop_item_id']] ? parseInt(fields[colIdx['drop_item_id']], 10) : null;
        const spawnType = fields[colIdx['spawn_type']] || 'random';
        const dropSlug = fields[colIdx['_drop_slug']] || null;

        const record: any = {
            id, slug, name, level, hp, atk, def, exp, gold, spawn_type: spawnType,
        };
        if (dropItemId && !isNaN(dropItemId)) record.drop_item_id = dropItemId;
        if (dropSlug) record.drop_item_slug = dropSlug;

        if (actionPatternMap[slug]) {
            record.action_pattern = actionPatternMap[slug];
        }

        records.push(record);
    }

    if (dryRun) {
        return NextResponse.json({
            success: true,
            dry_run: true,
            summary: { total: records.length, success: records.length, errors: 0 },
            results: records.map(r => ({ action: 'dry_run', id: r.id, slug: r.slug, name: r.name }))
        });
    }

    const { error } = await supabase
        .from('enemies')
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

