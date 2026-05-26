/**
 * UGC System v2 — ユニットテスト: テンプレートパーサー
 */
import { describe, it, expect } from 'vitest';
import { parseTemplate, detectFormat } from '../ugcTemplateParser';
import { extractFrontmatter, parseSimpleYaml } from '../ugcMdParser';

// ── 形式判別 ────────────────────────────────────────────────────────────────

describe('detectFormat', () => {
  it('JSON を検出する', () => {
    expect(detectFormat('{ "type": "enemy" }')).toBe('json');
  });

  it('MD を検出する', () => {
    expect(detectFormat('---\nversion: "1.0"\n---')).toBe('md');
  });
});

// ── 簡易YAMLパーサー ────────────────────────────────────────────────────────

describe('parseSimpleYaml', () => {
  it('基本的な key: value をパースする', () => {
    const result = parseSimpleYaml('title: "テスト"\ndifficulty: 3\nrec_level: 10');
    expect(result.title).toBe('テスト');
    expect(result.difficulty).toBe(3);
    expect(result.rec_level).toBe(10);
  });

  it('ブール値をパースする', () => {
    const result = parseSimpleYaml('enabled: true\ndisabled: false');
    expect(result.enabled).toBe(true);
    expect(result.disabled).toBe(false);
  });

  it('コメント行をスキップする', () => {
    const result = parseSimpleYaml('# comment\ntitle: "Test"');
    expect(result.title).toBe('Test');
  });
});

// ── Frontmatter抽出 ─────────────────────────────────────────────────────────

describe('extractFrontmatter', () => {
  it('Frontmatterとbodyを分離する', () => {
    const md = '---\nversion: "1.0"\ntype: quest\n---\n\n# Title\nBody text';
    const { frontmatter, body } = extractFrontmatter(md);
    expect(frontmatter.version).toBe('1.0');
    expect(frontmatter.type).toBe('quest');
    expect(body).toContain('Body text');
  });

  it('Frontmatterがない場合はエラー', () => {
    expect(() => extractFrontmatter('No frontmatter here')).toThrow();
  });
});

// ── JSONテンプレートパース ───────────────────────────────────────────────────

describe('parseTemplate (JSON)', () => {
  it('正常なエネミーテンプレート', () => {
    const json = JSON.stringify({
      $template: 'wirth-dawn-ugc',
      version: '1.0',
      type: 'enemy',
      enemy: {
        name: 'テスト敵',
        level: 5,
        hp: 30,
        atk: 5,
        def: 3,
        skills: ['tackle'],
        flavor_text: 'テスト用の敵',
      },
    });

    const result = parseTemplate(json, 'json');
    expect(result.success).toBe(true);
    expect(result.type).toBe('enemy');
  });

  it('禁止スキル効果はエラー', () => {
    const json = JSON.stringify({
      version: '1.0',
      type: 'skill_card',
      card: {
        name: 'テスト',
        power: 10,
        ap_cost: 2,
        target_type: 'single_enemy',
        effect_id: 'instakill', // 禁止
        description: 'テスト',
      },
    });

    const result = parseTemplate(json, 'json');
    expect(result.success).toBe(false);
    expect(result.errors.some(e => e.code === 'VALIDATION_ERROR')).toBe(true);
  });

  it('アイテムの type に weapon は使えない', () => {
    const json = JSON.stringify({
      version: '1.0',
      type: 'item',
      item: {
        name: 'テスト武器',
        type: 'weapon', // 禁止
        description: 'テスト',
      },
    });

    const result = parseTemplate(json, 'json');
    expect(result.success).toBe(false);
  });

  it('スキルパワー超過はエラー', () => {
    const json = JSON.stringify({
      version: '1.0',
      type: 'skill_card',
      card: {
        name: 'テスト',
        power: 30, // 上限25超過
        ap_cost: 3,
        target_type: 'single_enemy',
        effect_id: 'attack',
        description: 'テスト',
      },
    });

    const result = parseTemplate(json, 'json');
    expect(result.success).toBe(false);
  });

  it('テンプレートサイズ上限超過はエラー', () => {
    const hugeContent = 'x'.repeat(300 * 1024);
    const result = parseTemplate(hugeContent);
    expect(result.success).toBe(false);
    expect(result.errors[0].code).toBe('FILE_TOO_LARGE');
  });
});
