process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

async function tryConnect(dbUrl: string) {
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000,
    });
    try {
        const client = await pool.connect();
        client.release();
        await pool.end();
        return true;
    } catch (e: any) {
        await pool.end();
        console.log(`[RunProductionMigration] Failed connecting via: ${dbUrl.split('@')[1]} - Error: ${e.message}`);
        return false;
    }
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');

    if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectRef = 'zvoroixjuypnintkpmux';
    const password = 'izasama5723';

    // 接続候補の一覧（新プーラー、旧プーラー、直接接続の全組み合わせ）
    const connectionCandidates = [
        // 1. 旧プーラー経由 (Transaction Mode - ポート 6543)
        `postgresql://postgres.${projectRef}:${password}@db.${projectRef}.supabase.co:6543/postgres`,
        `postgresql://postgres.${projectRef}:${password}@${projectRef}.supabase.co:6543/postgres`,
        
        // 2. 直接接続経由 (ポート 5432)
        `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`,
        `postgresql://postgres:${password}@${projectRef}.supabase.co:5432/postgres`,

        // 3. 新プーラー経由 (東京/シンガポール、ポート 5432)
        `postgresql://postgres.${projectRef}:${password}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`,
        `postgresql://postgres.${projectRef}:${password}@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres`,
        `postgresql://postgres.${projectRef}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
        `postgresql://postgres.${projectRef}:${password}@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`,
    ];

    // 環境変数に直接定義されている場合を最優先にする
    let dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    
    if (dbUrl) {
        console.log('[RunProductionMigration] Testing primary env DB connection...');
        const ok = await tryConnect(dbUrl);
        if (!ok) {
            dbUrl = null;
        }
    }

    if (!dbUrl) {
        console.log('[RunProductionMigration] Environmental DB URL unavailable or failed. Scanning candidates...');
        for (const candidate of connectionCandidates) {
            console.log(`[RunProductionMigration] Testing connection candidate: ${candidate.split('@')[1]}`);
            const ok = await tryConnect(candidate);
            if (ok) {
                dbUrl = candidate;
                console.log(`[RunProductionMigration] SUCCESS! Connected via candidate: ${candidate.split('@')[1]}`);
                break;
            }
        }
    }

    if (!dbUrl) {
        return NextResponse.json({ error: 'Could not connect to PRODUCTION database through any candidates.' }, { status: 500 });
    }

    console.log('[RunProductionMigration] Executing migration...');
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
    });

    try {
        const client = await pool.connect();
        try {
            // 1. スキーママイグレーションの読み込みと適用
            const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260708000000_add_hired_counter_and_events.sql');
            if (!fs.existsSync(migrationPath)) {
                return NextResponse.json({ error: `Migration file not found at: ${migrationPath}` }, { status: 404 });
            }

            console.log('[RunProductionMigration] Applying SQL Schema Migration...');
            const sqlSchema = fs.readFileSync(migrationPath, 'utf8');

            await client.query('BEGIN');
            try {
                await client.query(sqlSchema);
                await client.query('COMMIT');
                console.log('[RunProductionMigration] Schema Migration committed.');
            } catch (schemaErr: any) {
                await client.query('ROLLBACK');
                throw new Error(`Schema migration failed: ${schemaErr.message}`);
            }

            // 2. 既存データからの累積雇用数復旧SQLの実行
            const sqlRestore = `
                -- 1. 残影の被雇用累積カウントの初期集計・更新
                WITH aggregated_shadows AS (
                    SELECT 
                        user_id,
                        SUM(count_val) as total_count
                    FROM (
                        -- 通知履歴から集計 (削除されていないロイヤリティ通知)
                        SELECT 
                            user_id, 
                            COUNT(*) as count_val
                        FROM public.notifications
                        WHERE type = 'royalty' AND message LIKE '%あなたの残影%'
                        GROUP BY user_id
                        
                        UNION ALL
                        
                        -- 現在のアクティブ同行メンバーから集計
                        SELECT 
                            source_user_id as user_id,
                            COUNT(*) as count_val
                        FROM public.party_members
                        WHERE origin_type = 'shadow_active' AND source_user_id IS NOT NULL
                        GROUP BY source_user_id
                    ) t
                    GROUP BY user_id
                )
                UPDATE public.user_profiles p
                SET hired_shadow_count = a.total_count
                FROM aggregated_shadows a
                WHERE p.id = a.user_id;

                -- 2. 英霊の被雇用累積カウントの初期集計・更新
                WITH aggregated_heroics AS (
                    SELECT 
                        user_id,
                        SUM(count_val) as total_count
                    FROM (
                        -- 通知履歴から集計
                        SELECT 
                            user_id, 
                            COUNT(*) as count_val
                        FROM public.notifications
                        WHERE type = 'royalty' AND message LIKE '%英霊%'
                        GROUP BY user_id
                        
                        UNION ALL
                        
                        -- 現在のアクティブ同行メンバーから集計
                        SELECT 
                            source_user_id as user_id,
                            COUNT(*) as count_val
                        FROM public.party_members
                        WHERE origin_type = 'shadow_heroic' AND source_user_id IS NOT NULL
                        GROUP BY source_user_id
                    ) t
                    GROUP BY user_id
                )
                UPDATE public.user_profiles p
                SET hired_heroic_count = a.total_count
                FROM aggregated_heroics a
                WHERE p.id = a.user_id;
            `;

            console.log('[RunProductionMigration] Applying Data Restoration...');
            await client.query('BEGIN');
            try {
                await client.query(sqlRestore);
                await client.query("NOTIFY pgrst, 'reload schema';");
                await client.query('COMMIT');
                console.log('[RunProductionMigration] Data Restoration committed.');
            } catch (dataErr: any) {
                await client.query('ROLLBACK');
                throw new Error(`Data restoration failed: ${dataErr.message}`);
            }

        } finally {
            client.release();
        }

        return NextResponse.json({
            success: true,
            message: 'PRODUCTION Schema Migration and Data Restoration applied successfully! 🎉'
        });

    } catch (e: any) {
        console.error('[RunProductionMigration] Fatal error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    } finally {
        await pool.end();
    }
}
