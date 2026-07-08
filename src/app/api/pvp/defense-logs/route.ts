process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

let tableChecked = false;

// 自動マイグレーションヘルパー: pvp_defense_logs テーブルが存在しない場合は作成する
async function ensureDefenseLogsTableExists() {
    if (tableChecked) return;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!refMatch) return;
    const projectRef = refMatch[1];
    
    const dbUrl = process.env.DATABASE_URL
        || process.env.SUPABASE_DB_URL
        || `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD || 'izasama5723'}@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`;
        
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });
    
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS pvp_defense_logs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL,
                    challenger_id UUID NOT NULL,
                    challenger_name TEXT NOT NULL,
                    is_defense_win BOOLEAN NOT NULL,
                    rating_change INTEGER NOT NULL,
                    battle_logs JSONB NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
                );
                
                CREATE INDEX IF NOT EXISTS idx_pvp_defense_logs_user_id ON pvp_defense_logs(user_id);
            `);
            tableChecked = true;
            console.log('[PvP Defense Logs] Table verified successfully.');
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('[PvP Defense Logs] Failed to create table:', e);
    } finally {
        await pool.end();
    }
}

export async function GET(req: Request) {
    try {
        const client = createAuthClient(req);
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
        }

        const userId = user.id;

        // テーブル存在チェック
        await ensureDefenseLogsTableExists();

        // 過去の防衛戦履歴を最新順に取得 (最大30件)
        const { data: logs, error } = await supabaseServer
            .from('pvp_defense_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) {
            console.error('[PvP Defense Logs] Fetch error:', error);
            return NextResponse.json({ error: '履歴の取得に失敗しました。' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            logs: logs || []
        });

    } catch (err: any) {
        console.error('[PvP Defense Logs] GET API Error:', err);
        return NextResponse.json({ error: err.message || '内部エラーが発生しました。' }, { status: 500 });
    }
}
