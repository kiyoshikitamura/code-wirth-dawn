process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/run-production-migration
 * 本番データベース用 移行・データ復旧API
 * 安全のため ADMIN_SECRET_KEY を要求します
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');

    if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 本番用の直接接続ホスト (db.zvoroixjuypnintkpmux.supabase.co)。
    // 直接接続時のユーザー名は 'postgres.ref' ではなく単純に 'postgres' になります。
    // VercelサーバーはIPv6に対応しているため、直接接続ドメインへ問題なく接続可能です。
    const projectRef = 'zvoroixjuypnintkpmux';
    const password = 'izasama5723';
    const dbUrl = process.env.DATABASE_URL 
        || process.env.SUPABASE_DB_URL
        || `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

    console.log('[RunProductionMigration] Connecting to PRODUCTION database via direct IPv6 host:', `db.${projectRef}.supabase.co`);
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
