/**
 * UGC System v2 — ユニットテスト: ugc:// プロトコル + URL検証
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { resolveUgcUrl, validateUgcUrls, isUgcPath } from '../ugcAssetUrl';

// テスト用の環境変数セットアップ
beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
});

describe('resolveUgcUrl', () => {
  it('正常な ugc:// パスを Supabase URL に変換する', () => {
    const result = resolveUgcUrl('ugc://images/enemies/guardian.webp', 'user-123');
    expect(result).toBe(
      'https://test-project.supabase.co/storage/v1/object/public/ugc-assets/user-123/images/enemies/guardian.webp'
    );
  });

  it('audio/bgm パスも変換できる', () => {
    const result = resolveUgcUrl('ugc://audio/bgm/battle.mp3', 'user-456');
    expect(result).toContain('/audio/bgm/battle.mp3');
  });

  it('ugc:// 以外のプレフィックスはエラー', () => {
    expect(() => resolveUgcUrl('https://example.com/img.png', 'u')).toThrow('must start with ugc://');
  });

  it('パストラバーサルを検出する', () => {
    expect(() => resolveUgcUrl('ugc://images/../../../etc/passwd', 'u')).toThrow('traversal');
  });

  it('許可されていないディレクトリはエラー', () => {
    expect(() => resolveUgcUrl('ugc://secret/data.json', 'u')).toThrow('unauthorized directory');
  });
});

describe('validateUgcUrls', () => {
  it('絶対URLを検出する', () => {
    const errors = validateUgcUrls([{
      id: 'node_1',
      bg_key: 'https://evil.com/bg.jpg',
    }]);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('ABSOLUTE_URL_FORBIDDEN');
  });

  it('正当な ugc:// パスはエラーなし', () => {
    const errors = validateUgcUrls([{
      id: 'node_1',
      bg_key: 'ugc://images/scenarios/forest.webp',
      bgm_key: 'bgm_quest_calm', // 公式キー
    }]);
    expect(errors).toHaveLength(0);
  });

  it('enemyData 内の絶対URLも検出する', () => {
    const errors = validateUgcUrls([{
      id: 'node_1',
      enemyData: { image_url: 'http://evil.com/enemy.png' },
    }]);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('enemyData.image_url');
  });

  it('パストラバーサルを含む ugc:// パスを検出する', () => {
    const errors = validateUgcUrls([{
      id: 'node_1',
      bg_key: 'ugc://images/../../secret.jpg',
    }]);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('TRAVERSAL_DETECTED');
  });
});

describe('isUgcPath', () => {
  it('ugc:// で始まる → true', () => {
    expect(isUgcPath('ugc://images/enemies/a.webp')).toBe(true);
  });

  it('公式キー → false', () => {
    expect(isUgcPath('bg_forest_day')).toBe(false);
  });
});
