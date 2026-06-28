process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/seed-npcs
 *
 * npcs.csv を読み込み、npcs テーブルと party_members テンプレート (owner_id=NULL) に
 * upsert するシードエンドポイント。
 *
 * クエリパラメータ:
 *   - secret: ADMIN_SECRET_KEY (必須)
 *   - cleanup=true: CSV未定義の npcs レコードを削除
 *   - dry_run=true: 実際の書き込みをスキップ
 *   - id=4001: 特定IDのみ同期
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
    const cleanup = url.searchParams.get('cleanup') === 'true';
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

    // ─── npcs.csv 読み込み ───
    const csvPath = path.join(process.cwd(), 'src', 'data', 'csv', 'npcs.csv');
    let csvText: string;
    try {
        csvText = fs.readFileSync(csvPath, 'utf-8');
    } catch (e) {
        return NextResponse.json({ error: 'npcs.csv not found' }, { status: 500 });
    }

    const lines = csvText.split('\n').map(l => l.replace(/\r$/, '').trim()).filter(Boolean);
    // ヘッダー: id,slug,epithet,name,job,level,max_hp,atk,def,cover_rate,hire_cost,inject_card_ids,flavor_text,_comment
    const header = lines[0].split(',');

    interface NpcRow {
        id: number;
        slug: string;
        epithet: string;
        name: string;
        job_class: string;
        level: number;
        max_hp: number;
        atk: number;
        def: number;
        cover_rate: number;
        hire_cost: number;
        inject_card_ids: string;
        flavor_text: string;
    }

    const csvNpcs: NpcRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        // CSV行をパース（flavor_textにカンマが含まれる可能性があるため、先頭12カラムを固定パース）
        const line = lines[i];
        const parts: string[] = [];
        let inQuote = false;
        let current = '';
        for (const ch of line) {
            if (ch === '"') { inQuote = !inQuote; continue; }
            if (ch === ',' && !inQuote) { parts.push(current.trim()); current = ''; continue; }
            current += ch;
        }
        parts.push(current.trim());

        const id = parseInt(parts[0], 10);
        if (isNaN(id)) continue;
        if (filterId && String(id) !== filterId) continue;

        csvNpcs.push({
            id,
            slug: parts[1] || '',
            epithet: parts[2] || '',
            name: parts[3] || '',
            job_class: parts[4] || 'Adventurer',
            level: parseInt(parts[5], 10) || 1,
            max_hp: parseInt(parts[6], 10) || 50,
            atk: parseInt(parts[7], 10) || 0,
            def: parseInt(parts[8], 10) || 0,
            cover_rate: parseInt(parts[9], 10) || 0,
            hire_cost: parseInt(parts[10], 10) || 0,
            inject_card_ids: parts[11] || '',
            flavor_text: parts[12] || '',
        });
    }

    const results: Array<{ action: string; id: number; slug: string; error?: string }> = [];

    // ─── npcs テーブル upsert ───
    for (const npc of csvNpcs) {
        const injectCards = npc.inject_card_ids
            ? npc.inject_card_ids.split('|').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
            : [];

        // npcs.id は UUID型のため、整数IDは含めない。slug で upsert する。
        const npcPayload = {
            slug: npc.slug,
            epithet: npc.epithet,
            name: npc.name,
            job_class: npc.job_class,
            level: npc.level,
            max_hp: npc.max_hp,
            attack: npc.atk,
            defense: npc.def,
            cover_rate: npc.cover_rate,
            hire_cost: npc.hire_cost,
            inject_cards: injectCards,
            default_cards: injectCards,
            introduction: npc.flavor_text,
            is_hireable: npc.hire_cost > 0 || npc.slug.startsWith('npc_free_'),
        };

        if (dryRun) {
            results.push({ action: 'dry_run', id: npc.id, slug: npc.slug });
            continue;
        }

        try {
            const { error } = await supabase
                .from('npcs')
                .upsert(npcPayload, { onConflict: 'slug' });
            if (error) {
                results.push({ action: 'error', id: npc.id, slug: npc.slug, error: error.message });
                continue;
            }
            results.push({ action: 'upserted', id: npc.id, slug: npc.slug });
        } catch (e: any) {
            results.push({ action: 'error', id: npc.id, slug: npc.slug, error: e.message });
        }
    }

    // ─── party_members テンプレート (owner_id=NULL) 同期 ───
    const pmResults: Array<{ action: string; id: number; slug: string; error?: string }> = [];
    for (const npc of csvNpcs) {
        const injectCards = npc.inject_card_ids
            ? npc.inject_card_ids.split('|').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
            : [];

        // party_members 用ペイロード（hp/introduction/default_cards カラムは存在しない）
        // inject_cards は文字列配列として格納（既存データとの互換性）
        const pmPayload: Record<string, any> = {
            id: npc.id,
            slug: npc.slug,
            name: npc.name,
            epithet: npc.epithet,
            job_class: npc.job_class,
            atk: npc.atk,
            def: npc.def,
            cover_rate: npc.cover_rate,
            durability: npc.max_hp,
            max_durability: npc.max_hp,
            inject_cards: injectCards.map(String),
            is_active: true,
            origin_type: 'system_mercenary',
            owner_id: null,
        };

        if (dryRun) {
            pmResults.push({ action: 'dry_run', id: npc.id, slug: npc.slug });
            continue;
        }

        try {
            const { error } = await supabase
                .from('party_members')
                .upsert(pmPayload, { onConflict: 'id' });
            if (error) {
                pmResults.push({ action: 'error', id: npc.id, slug: npc.slug, error: error.message });
            } else {
                pmResults.push({ action: 'upserted', id: npc.id, slug: npc.slug });
            }
        } catch (e: any) {
            pmResults.push({ action: 'error', id: npc.id, slug: npc.slug, error: e.message });
        }
    }

    // ─── cleanup: CSV未定義の npcs レコード削除 ───
    let cleanedUp: string[] = [];
    if (cleanup && !dryRun) {
        const csvSlugs = new Set(csvNpcs.map(n => n.slug));
        const { data: allNpcs } = await supabase.from('npcs').select('id, slug');
        if (allNpcs) {
            const toDelete = allNpcs.filter(n => !csvSlugs.has(n.slug));
            for (const orphan of toDelete) {
                const { error } = await supabase.from('npcs').delete().eq('id', orphan.id);
                if (!error) cleanedUp.push(`${orphan.id}:${orphan.slug}`);
            }
        }
        // party_members テンプレートのレガシー行 (slug=NULL, owner_id=NULL, id < 4000) も削除
        const { data: legacyPm } = await supabase
            .from('party_members')
            .select('id, name, slug')
            .is('owner_id', null)
            .is('slug', null);
        if (legacyPm) {
            for (const row of legacyPm) {
                const { error } = await supabase.from('party_members').delete().eq('id', row.id);
                if (!error) cleanedUp.push(`pm_legacy:${row.id}:${row.name}`);
            }
        }
    }

    const summary = {
        csv_count: csvNpcs.length,
        npcs_upserted: results.filter(r => r.action === 'upserted').length,
        npcs_errors: results.filter(r => r.action === 'error').length,
        pm_upserted: pmResults.filter(r => r.action === 'upserted').length,
        pm_errors: pmResults.filter(r => r.action === 'error').length,
        cleaned_up: cleanedUp.length,
    };

    return NextResponse.json({
        success: true,
        summary,
        npcs_results: results,
        party_members_results: pmResults,
        cleaned_up: cleanedUp,
    });
}
