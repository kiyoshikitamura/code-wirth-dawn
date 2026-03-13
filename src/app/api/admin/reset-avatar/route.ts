import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { UI_RULES } from '@/constants/game_rules';

export const dynamic = 'force-dynamic';


const DEFAULT_AVATAR = UI_RULES.DEFAULT_AVATAR;

/**
 * POST /api/admin/reset-avatar
 * 不適切アバターを強制リセットする（管理者専用）。
 * Body: { user_id: string, report_id?: string }
 * 認証: Authorization ヘッダーに ADMIN_SECRET が必要
 */
export async function POST(req: Request) {
    try {
        // 管理者認証（シンプルなシークレットキー方式）
        const adminSecret = req.headers.get('x-admin-secret');
        if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { user_id, report_id } = await req.json();

        if (!user_id) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        }

        // 1. user_profiles.avatar_url をデフォルトにリセット
        const { error: profileError } = await supabase
            .from('user_profiles')
            .update({
                avatar_url: DEFAULT_AVATAR,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user_id);

        if (profileError) {
            console.error('[reset-avatar] user_profiles update error:', profileError);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        // 2. party_members.image_url もリセット（英霊として登録済みの場合）
        const { error: partyError } = await supabase
            .from('party_members')
            .update({ image_url: DEFAULT_AVATAR })
            .eq('original_user_id', user_id);

        if (partyError) {
            // party_members に original_user_id カラムがない場合は警告のみ（ブロックしない）
            console.warn('[reset-avatar] party_members update skipped:', partyError.message);
        }

        // 3. 通報ステータスを resolved に更新（report_id が指定された場合）
        if (report_id) {
            await supabase
                .from('reports')
                .update({ status: 'resolved' })
                .eq('id', report_id);
        }

        return NextResponse.json({
            success: true,
            message: `Avatar reset for user ${user_id}`,
        });
    } catch (err: any) {
        console.error('[reset-avatar] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
