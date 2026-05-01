import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * PATCH /api/character/avatar
 * アバター画像URLを更新する。
 * Body: { avatar_url: string, file_size: number, file_type: string }
 */
export async function PATCH(req: Request) {
    try {
        // 1. 認証
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        let userId: string | null = null;

        if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) {
                userId = user.id;
            }
        }

        // x-user-id ヘッダーでのフォールバック（匿名ユーザー対応）
        if (!userId) {
            userId = req.headers.get('x-user-id');
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. ボディのパース
        const { avatar_url, file_size, file_type } = await req.json();

        if (!avatar_url) {
            return NextResponse.json({ error: 'avatar_url is required' }, { status: 400 });
        }

        // 3. バリデーション（バックエンド側）
        if (file_size !== undefined && file_size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 413 }
            );
        }

        if (file_type !== undefined && !ALLOWED_TYPES.includes(file_type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: jpeg, png, webp.' },
                { status: 415 }
            );
        }

        // 4. user_profiles.avatar_url を更新
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ avatar_url, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (updateError) {
            console.error('[avatar] Update error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, avatar_url });
    } catch (err: any) {
        console.error('[avatar] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
