import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { UGC_ENABLED, UGC_IMAGE_MAX_SIZE, UGC_BGM_MAX_SIZE, UGC_SE_MAX_SIZE, UGC_STORAGE_LIMITS, UGC_ALLOWED_ASSET_PREFIXES, type SubscriptionTier } from '@/lib/ugc/ugcConfig';

/**
 * POST /api/ugc/v2/asset/upload
 *
 * UGCアセット（画像/BGM/SE）アップロードAPI。
 * Supabase Storage の ugc-assets バケットへ保存する。
 * 仕様: spec_v12_ugc_system_v2.md §6
 *
 * Form data:
 *  - file: File
 *  - path: string (e.g. "images/enemies/guardian.webp")
 */
export async function POST(request: Request) {
  try {
    if (!UGC_ENABLED) {
      return NextResponse.json({ error: 'UGC機能は現在無効です。' }, { status: 403 });
    }

    const client = createAuthClient(request);
    const { data: { user }, error: authErr } = await client.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file || !path) {
      return NextResponse.json({ error: 'file と path が必要です。' }, { status: 400 });
    }

    // パス検証
    if (path.includes('..') || path.includes('//')) {
      return NextResponse.json({ error: 'パスに不正な文字が含まれています。' }, { status: 400 });
    }

    const isAllowed = UGC_ALLOWED_ASSET_PREFIXES.some(p => path.startsWith(p));
    if (!isAllowed) {
      return NextResponse.json({
        error: `許可されていないパスです。使用可能: ${UGC_ALLOWED_ASSET_PREFIXES.join(', ')}`,
      }, { status: 400 });
    }

    // ファイルサイズ制限
    const isImage = path.startsWith('images/');
    const isBgm = path.startsWith('audio/bgm/');
    const isSe = path.startsWith('audio/se/');

    const maxSize = isImage ? UGC_IMAGE_MAX_SIZE
      : isBgm ? UGC_BGM_MAX_SIZE
      : isSe ? UGC_SE_MAX_SIZE
      : UGC_IMAGE_MAX_SIZE;

    if (file.size > maxSize) {
      return NextResponse.json({
        error: `ファイルサイズが上限（${Math.floor(maxSize / 1024 / 1024)}MB）を超えています。`,
      }, { status: 400 });
    }

    // MIMEタイプ検証
    if (isImage && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: '画像ファイルではありません。' }, { status: 400 });
    }
    if ((isBgm || isSe) && !file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'オーディオファイルではありません。' }, { status: 400 });
    }

    // Tier別容量チェック
    const { data: profile } = await client
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();
    const tier: SubscriptionTier = (profile?.subscription_tier as SubscriptionTier) ?? 'free';
    const storageLimit = UGC_STORAGE_LIMITS[tier];

    // 現在の使用量を概算（list files）
    const storagePath = `${user.id}/`;
    const { data: existingFiles } = await client.storage
      .from('ugc-assets')
      .list(storagePath, { limit: 1000 });

    const currentUsage = (existingFiles || []).reduce((sum, f) => {
      return sum + ((f as any).metadata?.size || 0);
    }, 0);

    if (currentUsage + file.size > storageLimit) {
      return NextResponse.json({
        error: `ストレージ容量の上限（${Math.floor(storageLimit / 1024 / 1024)}MB）を超えます。`,
        current_usage: currentUsage,
        limit: storageLimit,
      }, { status: 403 });
    }

    // アップロード
    const filePath = `${user.id}/${path}`;
    const arrayBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadErr } = await client.storage
      .from('ugc-assets')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) throw uploadErr;

    return NextResponse.json({
      success: true,
      ugc_url: `ugc://${path}`,
      storage_path: uploadData?.path,
    });

  } catch (e: any) {
    console.error('[ugc/v2/asset/upload] Error:', e);
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
  }
}
