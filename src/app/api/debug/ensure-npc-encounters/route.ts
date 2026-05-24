import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/ensure-npc-encounters?secret={ADMIN_SECRET_KEY}
 * 
 * user_npc_encounters テーブルが存在しない場合に作成する。
 * pg ドライバーで直接 DDL を実行するため、Supabase SQL Editor 不要。
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

    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build connection string from Supabase env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 });
    }

    // Extract project ref from URL: https://{ref}.supabase.co
    const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!refMatch) {
        return NextResponse.json({ error: 'Cannot parse SUPABASE_URL' }, { status: 500 });
    }
    const projectRef = refMatch[1];

    // Supabase direct connection options:
    // 1. DATABASE_URL or SUPABASE_DB_URL (preferred - includes password)
    // 2. Direct connection using db.{ref}.supabase.co with DB password
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
            // Step 1: Check if table exists
            const checkResult = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'user_npc_encounters'
                ) as exists;
            `);
            const tableExists = checkResult.rows[0]?.exists === true;
            results.push({ step: 'check_table', success: true, detail: tableExists ? 'already exists' : 'not found' });

            if (!tableExists) {
                // Step 2: Create table
                await client.query(`
                    CREATE TABLE IF NOT EXISTS public.user_npc_encounters (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                        npc_slug TEXT NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT now(),
                        UNIQUE(user_id, npc_slug)
                    );
                `);
                results.push({ step: 'create_table', success: true });

                // Step 3: Create index
                await client.query(`
                    CREATE INDEX IF NOT EXISTS idx_user_npc_encounters_user 
                    ON public.user_npc_encounters(user_id);
                `);
                results.push({ step: 'create_index', success: true });

                // Step 4: Enable RLS
                await client.query(`
                    ALTER TABLE public.user_npc_encounters ENABLE ROW LEVEL SECURITY;
                `);
                results.push({ step: 'enable_rls', success: true });

                // Step 5: Create policies
                await client.query(`
                    DO $$ BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_policies 
                            WHERE tablename = 'user_npc_encounters' 
                            AND policyname = 'Users can read own npc encounters'
                        ) THEN
                            CREATE POLICY "Users can read own npc encounters" 
                            ON public.user_npc_encounters FOR SELECT 
                            USING (auth.uid() = user_id);
                        END IF;
                    END $$;
                `);
                await client.query(`
                    DO $$ BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_policies 
                            WHERE tablename = 'user_npc_encounters' 
                            AND policyname = 'Service can insert npc encounters'
                        ) THEN
                            CREATE POLICY "Service can insert npc encounters" 
                            ON public.user_npc_encounters FOR INSERT 
                            WITH CHECK (true);
                        END IF;
                    END $$;
                `);
                await client.query(`
                    DO $$ BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_policies 
                            WHERE tablename = 'user_npc_encounters' 
                            AND policyname = 'Service can delete npc encounters'
                        ) THEN
                            CREATE POLICY "Service can delete npc encounters" 
                            ON public.user_npc_encounters FOR DELETE 
                            USING (true);
                        END IF;
                    END $$;
                `);
                results.push({ step: 'create_policies', success: true });
            }

            // Step 6: Verify
            const verifyResult = await client.query(`
                SELECT count(*) as count FROM public.user_npc_encounters;
            `);
            results.push({
                step: 'verify',
                success: true,
                detail: `table accessible, ${verifyResult.rows[0]?.count || 0} rows`,
            });

        } finally {
            client.release();
        }

        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        console.error('[ensure-npc-encounters] Error:', e);
        results.push({ step: 'error', success: false, detail: e.message });

        // If pg connection failed, provide SQL for manual execution
        return NextResponse.json({
            success: false,
            results,
            manual_sql: `
-- Run this in Supabase SQL Editor if automatic migration failed:
CREATE TABLE IF NOT EXISTS public.user_npc_encounters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  npc_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, npc_slug)
);
CREATE INDEX IF NOT EXISTS idx_user_npc_encounters_user ON public.user_npc_encounters(user_id);
ALTER TABLE public.user_npc_encounters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own npc encounters" ON public.user_npc_encounters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert npc encounters" ON public.user_npc_encounters FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can delete npc encounters" ON public.user_npc_encounters FOR DELETE USING (true);
            `.trim(),
        }, { status: 500 });
    } finally {
        await pool.end();
    }
}
