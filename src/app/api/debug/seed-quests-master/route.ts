import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (process.env.VERCEL_ENV === 'production') {
        return NextResponse.json(
            { error: 'Debug routes are not available in production' },
            { status: 403 }
        );
    }

    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');

    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!serviceKey) {
        return NextResponse.json({ error: 'No Service Key' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const csvDir = path.join(process.cwd(), 'src', 'data', 'csv');
    const files = [
        { name: 'quests.csv', type: 'main' },
        { name: 'quests_normal.csv', type: 'normal' },
        { name: 'quests_special.csv', type: 'special' }
    ];
    const results = [];

    for (const f of files) {
        const filePath = path.join(csvDir, f.name);
        if (!fs.existsSync(filePath)) continue;

        const csvText = fs.readFileSync(filePath, 'utf-8');
        const records = parse(csvText, { columns: true, skip_empty_lines: true }) as any[];

        for (const row of records) {
            const id = parseInt(row.id, 10);
            if (isNaN(id)) continue;

            const upsertData = {
                id,
                slug: row.slug,
                title: row.title,
                quest_type: f.type,
                rec_level: parseInt(row.rec_level, 10) || 1,
                difficulty: parseInt(row.difficulty, 10) || 1,
            };

            const { error } = await supabase.from('scenarios').upsert(upsertData, { onConflict: 'id' });
            if (error) {
                results.push({ id, error: error.message });
            } else {
                results.push({ id, status: 'success' });
            }
        }
    }

    return NextResponse.json({ success: true, processed: results.length, errors: results.filter(r => r.error) });
}
