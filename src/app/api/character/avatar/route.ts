import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * PATCH /api/character/avatar
 * アバター画像URLを更新する（URL直接指定）。
 * Body: { avatar_url: string, file_size?: number, file_type?: string }
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

        // 4. user_profiles.avatar_url を更新 (Service Roleを使用して確実に更新)
        const { error: updateError, data: updatedData } = await supabaseServer
            .from('user_profiles')
            .update({ avatar_url, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select();

        if (updateError) {
            console.error('[avatar] Update error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        if (!updatedData || updatedData.length === 0) {
            console.error('[avatar] User profile not found for id:', userId);
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, avatar_url });
    } catch (err: any) {
        console.error('[avatar] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * POST /api/character/avatar
 * サーバーサイドでアバター画像をアップロードし、プロフィールに反映する。
 * Service Role を使うためクライアント側のRLS制約を回避できる。
 * Body: FormData { file: File }
 * Headers: Authorization / x-user-id
 */
export async function POST(req: Request) {
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

        if (!userId) {
            userId = req.headers.get('x-user-id');
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. FormData からファイルを取得
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 3. バリデーション
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: jpeg, png, webp.' },
                { status: 415 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 413 }
            );
        }

        // 4. Service Role でストレージにアップロード（RLSバイパス）
        const ext = file.name.split('.').pop() || 'jpg';
        const storagePath = `${userId}/avatar.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await supabaseServer.storage
            .from('avatars')
            .upload(storagePath, buffer, {
                upsert: true,
                contentType: file.type,
            });

        if (uploadError) {
            console.error('[avatar POST] Storage upload error:', uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // 5. Public URL を取得
        const { data: urlData } = supabaseServer.storage
            .from('avatars')
            .getPublicUrl(storagePath);

        const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

        // 6. DB にアバターURLを保存
        const { error: updateError } = await supabaseServer
            .from('user_profiles')
            .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (updateError) {
            console.error('[avatar POST] DB update error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, avatar_url: avatarUrl });
    } catch (err: any) {
        console.error('[avatar POST] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
