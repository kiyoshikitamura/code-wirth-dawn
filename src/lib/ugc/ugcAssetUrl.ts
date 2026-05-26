/**
 * UGC System v2 — ugc:// プロトコル解決 + アセットURL検証
 * @module ugcAssetUrl
 */

import { UGC_ALLOWED_ASSET_PREFIXES } from './ugcConfig';

// ── ugc:// → Supabase Storage URL 解決 ──────────────────────────────────────

/**
 * ugc:// プロトコルを Supabase Storage 公開URL に解決する
 *
 * @example
 * resolveUgcUrl('ugc://images/enemies/guardian.webp', 'user-uuid-123')
 * // → 'https://{project}.supabase.co/storage/v1/object/public/ugc-assets/user-uuid-123/images/enemies/guardian.webp'
 */
export function resolveUgcUrl(ugcPath: string, creatorId: string): string {
  if (!ugcPath.startsWith('ugc://')) {
    throw new Error('Invalid UGC URL: must start with ugc://');
  }

  const relativePath = ugcPath.replace('ugc://', '');

  // パストラバーサル攻撃の防止
  if (relativePath.includes('..') || relativePath.includes('//')) {
    throw new Error('Invalid path: traversal detected');
  }

  // 許可されたサブディレクトリのみ
  if (!UGC_ALLOWED_ASSET_PREFIXES.some(p => relativePath.startsWith(p))) {
    throw new Error(`Invalid path: unauthorized directory '${relativePath}'`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  return `${supabaseUrl}/storage/v1/object/public/ugc-assets/${creatorId}/${relativePath}`;
}

// ── アセットURL検出 ─────────────────────────────────────────────────────────

export interface AssetUrlValidationError {
  nodeId: string;
  field: string;
  message: string;
  code: 'ABSOLUTE_URL_FORBIDDEN' | 'INVALID_UGC_PATH' | 'TRAVERSAL_DETECTED';
}

/** アセットURLフィールド一覧 */
const ASSET_FIELDS = ['speaker_image_url', 'bg_key', 'bgm_key', 'se_key'] as const;

/**
 * テンプレートインポート時に全ノードの ugc:// 参照をバリデーションする。
 * 絶対URLを検出してブロックし、ugc:// パスの正当性を検証する。
 */
export function validateUgcUrls(
  nodes: Array<{
    id: string;
    speaker_image_url?: string;
    bg_key?: string;
    bgm_key?: string;
    se_key?: string;
    enemyData?: { image_url?: string };
    npcData?: { image_url?: string };
    [key: string]: unknown;
  }>
): AssetUrlValidationError[] {
  const errors: AssetUrlValidationError[] = [];

  for (const node of nodes) {
    // ノード直下のアセットフィールド
    for (const field of ASSET_FIELDS) {
      const value = node[field];
      if (typeof value === 'string' && value.length > 0) {
        const err = validateSingleUrl(node.id, field, value);
        if (err) errors.push(err);
      }
    }

    // enemyData 内の画像
    if (node.enemyData?.image_url) {
      const err = validateSingleUrl(node.id, 'enemyData.image_url', node.enemyData.image_url);
      if (err) errors.push(err);
    }

    // npcData 内の画像
    if (node.npcData?.image_url) {
      const err = validateSingleUrl(node.id, 'npcData.image_url', node.npcData.image_url);
      if (err) errors.push(err);
    }
  }

  return errors;
}

/**
 * 単一のURLを検証する
 */
function validateSingleUrl(
  nodeId: string,
  field: string,
  value: string
): AssetUrlValidationError | null {
  // 絶対URL検出
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return {
      nodeId, field,
      message: '絶対URLは使用できません。ugc://プロトコルまたは公式アセットキーを使用してください。',
      code: 'ABSOLUTE_URL_FORBIDDEN',
    };
  }

  // ugc:// パスの検証（ugc:// でない場合は公式キーとみなしてスキップ）
  if (value.startsWith('ugc://')) {
    const relativePath = value.replace('ugc://', '');

    if (relativePath.includes('..') || relativePath.includes('//')) {
      return {
        nodeId, field,
        message: 'パストラバーサルが検出されました。',
        code: 'TRAVERSAL_DETECTED',
      };
    }

    if (!UGC_ALLOWED_ASSET_PREFIXES.some(p => relativePath.startsWith(p))) {
      return {
        nodeId, field,
        message: `許可されていないディレクトリです: ${relativePath}`,
        code: 'INVALID_UGC_PATH',
      };
    }
  }

  return null;
}

/**
 * 文字列が ugc:// パスかどうかを判定する。
 * ugc:// なら resolveUgcUrl で解決し、そうでなければ公式キーとしてそのまま返す。
 */
export function isUgcPath(path: string): boolean {
  return path.startsWith('ugc://');
}
