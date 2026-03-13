import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/report
 * 不適切アバター画像の通報を受け付ける。
 * Body: { reported_user_id: string, target_url: string, reason: string }
 */
export async function POST(req: Request) {
    try {
        // 1. 認証
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        let reporterId: string | null = null;

        if (token) {
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) reporterId = user.id;
        }
        if (!reporterId) {
            reporterId = req.headers.get('x-user-id');
        }

        if (!reporterId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. ボディのパース
        const { reported_user_id, target_url, reason } = await req.json();

        if (!reported_user_id || !target_url || !reason) {
            return NextResponse.json(
                { error: 'reported_user_id, target_url, reason are required' },
                { status: 400 }
            );
        }

        // 自分自身への通報は禁止
        if (reporterId === reported_user_id) {
            return NextResponse.json(
                { error: 'Cannot report yourself' },
                { status: 400 }
            );
        }

        // 3. reports テーブルに INSERT
        const { error: insertError } = await supabase
            .from('reports')
            .insert({
                reporter_id: reporterId,
                reported_user_id,
                target_url,
                reason,
                status: 'pending',
            });

        if (insertError) {
            console.error('[report] Insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[report] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
