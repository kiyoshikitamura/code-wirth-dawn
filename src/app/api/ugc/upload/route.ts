import { NextResponse } from 'next/server';
import { supabase as anonSupabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        // JWT認証からユーザーIDを取得
        let userId: string | null = null;
        const authHeader = request.headers.get('authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await anonSupabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: 有効な認証トークンが必要です' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 });
        }

        const fileType = file.type;
        let bucketName = '';
        
        if (fileType.startsWith('image/')) {
            bucketName = 'ugc-images';
        } else if (fileType.startsWith('audio/')) {
            bucketName = 'ugc-audio';
        } else {
            return NextResponse.json({ error: '許可されていないファイル形式です。画像(*.png, *.jpg, *.webp, *.gif)または音声(*.mp3, *.wav, *.ogg)を指定してください' }, { status: 400 });
        }

        // バケットの存在確認と自動作成
        const { data: buckets, error: listError } = await supabaseServer.storage.listBuckets();
        if (listError) {
            console.error('Failed to list buckets:', listError);
            throw listError;
        }

        const exists = buckets?.some(b => b.name === bucketName);
        if (!exists) {
            const { error: createError } = await supabaseServer.storage.createBucket(bucketName, {
                public: true,
                allowedMimeTypes: bucketName === 'ugc-images' 
                    ? ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
                    : ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav'],
                fileSizeLimit: bucketName === 'ugc-images' ? 2 * 1024 * 1024 : 10 * 1024 * 1024 // 画像2MB / 音声10MB
            });
            if (createError) {
                console.error(`Failed to create bucket ${bucketName}:`, createError);
                throw createError;
            }
        }

        // ファイル名をユニークにする
        const fileExt = file.name.split('.').pop() || '';
        const fileName = `${userId}_${Date.now()}.${fileExt}`;

        // アップロード実行
        const fileBuffer = await file.arrayBuffer();
        const { error: uploadError } = await supabaseServer.storage
            .from(bucketName)
            .upload(fileName, new Uint8Array(fileBuffer), {
                contentType: fileType,
                upsert: true
            });

        if (uploadError) {
            console.error('File upload failed:', uploadError);
            throw uploadError;
        }

        // 公開URLを取得
        const { data: { publicUrl } } = supabaseServer.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName: file.name,
            type: bucketName === 'ugc-images' ? 'image' : 'audio'
        });

    } catch (e: any) {
        console.error("Asset Upload API Error:", e);
        return NextResponse.json({ error: 'アップロードに失敗しました: ' + (e.message || JSON.stringify(e)) }, { status: 500 });
    }
}
