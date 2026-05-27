import { NextResponse } from 'next/server';
import { Pool } from 'pg';

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

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 });
    }

    const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!refMatch) {
        return NextResponse.json({ error: 'Cannot parse SUPABASE_URL' }, { status: 500 });
    }
    const projectRef = refMatch[1];

    const dbUrl = process.env.DATABASE_URL
        || process.env.SUPABASE_DB_URL
        || `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD || serviceKey}@db.${projectRef}.supabase.co:5432/postgres`;

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
    });

    const results: { step: string; success: boolean; detail?: string }[] = [];

    try {
        const client = await pool.connect();
        try {
            // Drop constraint
            await client.query(`ALTER TABLE enemy_skills DROP CONSTRAINT IF EXISTS enemy_skills_effect_type_check;`);
            results.push({ step: 'drop_constraint', success: true });

            // Add constraint
            await client.query(`
                ALTER TABLE enemy_skills ADD CONSTRAINT enemy_skills_effect_type_check
                CHECK (effect_type IN (
                    'damage', 'drain_vit', 'heal', 'status_effect',
                    'damage_poison', 'damage_blind', 'damage_bleed', 'damage_stun',
                    'buff_self_atk', 'buff_self_def', 'debuff_atk_down', 'debuff_def_down',
                    'inject', 'buff', 'debuff', 'other'
                ));
            `);
            results.push({ step: 'add_constraint', success: true });

        } finally {
            client.release();
        }

        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        console.error('[fix-enemy-skills-constraint] Error:', e);
        results.push({ step: 'error', success: false, detail: e.message });
        return NextResponse.json({ success: false, results }, { status: 500 });
    } finally {
        await pool.end();
    }
}
