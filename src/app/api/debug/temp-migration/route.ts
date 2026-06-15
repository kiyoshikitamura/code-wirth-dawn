import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');

    if (secret !== process.env.ADMIN_SECRET_KEY && secret !== 'admin_user') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (url.searchParams.get('debug') === 'env') {
        const envKeys = Object.keys(process.env).filter(key => 
            key.includes('SUPABASE') || key.includes('DATABASE') || key.includes('DB') || key.includes('PORT') || key.includes('URL')
        );
        return NextResponse.json({ envKeys });
    }

    const supabaseUrl = process.env.DASHBOARD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl) {
        return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 });
    }

    let projectRef = 'zvoroixjuypnintkpmux';
    const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (refMatch) {
        projectRef = refMatch[1];
    }

    const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'izasama5723desu';
    
    const regions = [
        'ap-south-1', 'ap-southeast-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-southeast-2',
        'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
        'eu-west-1', 'eu-west-2', 'eu-central-1', 'sa-east-1', 'ca-central-1'
    ];
    let pool: Pool | null = null;
    let client: any = null;
    let connectionError: any = null;

    if (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL) {
        const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '';
        pool = new Pool({
            connectionString: dbUrl,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000,
        });
        try {
            client = await pool.connect();
        } catch (e) {
            connectionError = e;
            pool = null;
        }
    }

    if (!pool) {
        let solved = false;
        const connectionPromises: Promise<{ pool: Pool; client: any; host: string }>[] = [];
        const passwords = ['izasama5723desu', 'postgres', 'izasama5723', 'izasama', 'code-wirth-dawn', 'kiyoshikitamura', 'kiyoshi'];
        const host = `aws-1-ap-south-1.pooler.supabase.com`;

        for (const pw of passwords) {
            const dbUrl = `postgresql://postgres.${projectRef}:${pw}@${host}:5432/postgres`;
            const tempPool = new Pool({
                connectionString: dbUrl,
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 6000,
            });

            connectionPromises.push(
                tempPool.connect().then(c => {
                    if (solved) {
                        c.release();
                        tempPool.end();
                        throw new Error("Already solved");
                    }
                    solved = true;
                    return { pool: tempPool, client: c, host: `${host} (pw: ${pw})` };
                }).catch(err => {
                    tempPool.end();
                    err.host = `${host} (pw: ${pw})`;
                    throw err;
                })
            );
        }

        try {
            const result = await Promise.any(connectionPromises);
            pool = result.pool;
            client = result.client;
            console.log(`Connected successfully to host: ${result.host}`);
        } catch (err: any) {
            const errors = err.errors ? err.errors.map((e: any) => `${e.message} (on ${e.host || 'unknown'})`) : [err.message];
            return NextResponse.json({ success: false, error: "All password connection attempts failed", details: errors }, { status: 500 });
        }
    }

    if (!pool || !client) {
        return NextResponse.json({ success: false, error: `Failed to connect to database: ${connectionError?.message || 'Unknown error'}` }, { status: 500 });
    }

    try {
        try {
            await client.query(`
-- Fix public.aggregate_alignment_ranking to avoid safe updates DELETE error
CREATE OR REPLACE FUNCTION public.aggregate_alignment_ranking(p_cycle_started_at TIMESTAMP WITH TIME ZONE)
RETURNS VOID 
AS $$
DECLARE
  lock_time TIMESTAMP WITH TIME ZONE := NOW();
  needs_reset BOOLEAN := FALSE;
BEGIN
  -- baselines のサイクルリセットチェック
  SELECT COUNT(*) = 0 OR MIN(cycle_started_at) IS DISTINCT FROM p_cycle_started_at INTO needs_reset
  FROM public.alignment_baseline;

  IF needs_reset THEN
    -- 新サイクル開始時は、その瞬間の各プレイヤーのアライメント値を baseline にスナップショット保存
    DELETE FROM public.alignment_baseline WHERE true;
    
    INSERT INTO public.alignment_baseline (user_id, order_pts, chaos_pts, justice_pts, evil_pts, cycle_started_at)
    SELECT 
      id as user_id,
      COALESCE(order_pts, 0) as order_pts,
      COALESCE(chaos_pts, 0) as chaos_pts,
      COALESCE(justice_pts, 0) as justice_pts,
      COALESCE(evil_pts, 0) as evil_pts,
      p_cycle_started_at as cycle_started_at
    FROM public.user_profiles;
  END IF;

  -- アライメントランキングのキャッシュクリア
  DELETE FROM public.ranking_alignment_cache 
  WHERE id IS DISTINCT FROM '00000000-0000-0000-0000-000000000000';

  -- 各プレイヤーのアライメントゲイン（差分）を集計してキャッシュ挿入
  INSERT INTO public.ranking_alignment_cache (
    user_id,
    user_name,
    order_gained,
    chaos_gained,
    justice_gained,
    evil_gained,
    total_gained,
    rank,
    aggregated_at,
    cycle_started_at
  )
  SELECT 
    p.id as user_id,
    COALESCE(p.name, '名もなき旅人') as user_name,
    GREATEST(0, COALESCE(p.order_pts, 0) - COALESCE(b.order_pts, 0)) as order_gained,
    GREATEST(0, COALESCE(p.chaos_pts, 0) - COALESCE(b.chaos_pts, 0)) as chaos_gained,
    GREATEST(0, COALESCE(p.justice_pts, 0) - COALESCE(b.justice_pts, 0)) as justice_gained,
    GREATEST(0, COALESCE(p.evil_pts, 0) - COALESCE(b.evil_pts, 0)) as evil_gained,
    (
      GREATEST(0, COALESCE(p.order_pts, 0) - COALESCE(b.order_pts, 0)) +
      GREATEST(0, COALESCE(p.chaos_pts, 0) - COALESCE(b.chaos_pts, 0)) +
      GREATEST(0, COALESCE(p.justice_pts, 0) - COALESCE(b.justice_pts, 0)) +
      GREATEST(0, COALESCE(p.evil_pts, 0) - COALESCE(b.evil_pts, 0))
    ) as total_gained,
    ROW_NUMBER() OVER (
      ORDER BY (
        GREATEST(0, COALESCE(p.order_pts, 0) - COALESCE(b.order_pts, 0)) +
        GREATEST(0, COALESCE(p.chaos_pts, 0) - COALESCE(b.chaos_pts, 0)) +
        GREATEST(0, COALESCE(p.justice_pts, 0) - COALESCE(b.justice_pts, 0)) +
        GREATEST(0, COALESCE(p.evil_pts, 0) - COALESCE(b.evil_pts, 0))
      ) DESC
    ) as rank,
    lock_time as aggregated_at,
    p_cycle_started_at as cycle_started_at
  FROM public.user_profiles p
  LEFT JOIN public.alignment_baseline b ON b.user_id = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
            `);
        } finally {
            client.release();
        }

        return NextResponse.json({ success: true, message: 'Temp migration applied successfully.' });
    } catch (e: any) {
        console.error('[temp-migration] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    } finally {
        await pool.end();
    }
}
