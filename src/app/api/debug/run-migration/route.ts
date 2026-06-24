import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

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
        || `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD || 'izasama5723'}@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`;

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
    });

    try {
        const client = await pool.connect();
        try {
            const migration1Path = path.join(process.cwd(), 'supabase', 'migrations', '20260624000000_add_monetization_packages_and_rpc.sql');
            const migration2Path = path.join(process.cwd(), 'supabase', 'migrations', '20260624000001_compensate_existing_subscribers.sql');

            if (!fs.existsSync(migration1Path) || !fs.existsSync(migration2Path)) {
                return NextResponse.json({ success: false, error: 'Migration files not found in migrations directory.' }, { status: 404 });
            }

            const sql1 = fs.readFileSync(migration1Path, 'utf8');
            const sql2 = fs.readFileSync(migration2Path, 'utf8');

            await client.query('BEGIN');
            try {
                await client.query(sql1);
                await client.query(sql2);
                
                // RELOAD PostgREST SCHEMA CACHE
                await client.query("NOTIFY pgrst, 'reload schema';");
                
                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            }
        } finally {
            client.release();
        }

        return NextResponse.json({ success: true, message: 'Migration applied successfully.' });
    } catch (e: any) {
        console.error('[run-migration] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    } finally {
        await pool.end();
    }
}
