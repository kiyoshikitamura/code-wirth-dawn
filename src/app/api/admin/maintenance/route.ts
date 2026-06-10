import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/maintenance
 * メンテナンス設定を更新する管理用API
 * 
 * 認証: Authorization: Bearer <ADMIN_SECRET_KEY> または X-Admin-Key ヘッダー
 */
export async function POST(req: Request) {
    const adminSecret = process.env.ADMIN_SECRET_KEY;
    const authHeader = req.headers.get('authorization');
    const xAdminKey = req.headers.get('x-admin-key');
    
    const token = authHeader?.replace('Bearer ', '') || xAdminKey;

    if (!adminSecret || token !== adminSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        
        // パラメータチェック
        const { force_maintenance, start_at, end_at, admin_bypass_key } = body;

        if (force_maintenance === undefined) {
            return NextResponse.json({ error: 'Missing force_maintenance parameter' }, { status: 400 });
        }

        // 現在の設定を取得
        const { data: currentRecord } = await supabaseServer
            .from('system_settings')
            .select('value')
            .eq('key', 'maintenance')
            .maybeSingle();

        const currentVal = (currentRecord?.value as any) || {};

        // マージする
        const newVal = {
            force_maintenance: !!force_maintenance,
            start_at: start_at !== undefined ? start_at : (currentVal.start_at || null),
            end_at: end_at !== undefined ? end_at : (currentVal.end_at || null),
            admin_bypass_key: admin_bypass_key !== undefined ? admin_bypass_key : (currentVal.admin_bypass_key || 'secret-maintenance-bypass-key')
        };

        // データベースを更新
        const { error } = await supabaseServer
            .from('system_settings')
            .upsert({
                key: 'maintenance',
                value: newVal,
                updated_at: new Date().toISOString()
            });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            settings: newVal
        });
    } catch (e: any) {
        console.error('[AdminMaintenanceAPI] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
