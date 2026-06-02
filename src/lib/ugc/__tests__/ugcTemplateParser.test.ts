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

// ── 個別アセットMDテンプレートパース ──────────────────────────────────────────

describe('parseTemplate (MD) — 個別アセット', () => {
  it('エネミーMDテンプレートを正しくパースする', () => {
    const md = `---
version: "1.0"
type: enemy
---

## エネミー定義

名前: フォレストウルフ
レベル: 8
HP: 120
ATK: 14
DEF: 5
スキル: [bite, howl]
画像: ""
フレーバーテキスト: 森に棲む灰色の狼
`;

    const result = parseTemplate(md, 'md');
    expect(result.success).toBe(true);
    expect(result.type).toBe('enemy');
    if (result.data && result.data.type === 'enemy') {
      expect(result.data.enemy.name).toBe('フォレストウルフ');
      expect(result.data.enemy.hp).toBe(120);
      expect(result.data.enemy.atk).toBe(14);
      expect(result.data.enemy.skills).toEqual(['bite', 'howl']);
    }
  });

  it('アイテムMDテンプレートを正しくパースする', () => {
    const md = `---
version: "1.0"
type: item
---

## アイテム定義

名前: 回復薬
種別: consumable
説明: HPを30回復する
レアリティ: common
使用タイミング: battle
HP回復: 30
画像: ""
`;

    const result = parseTemplate(md, 'md');
    expect(result.success).toBe(true);
    expect(result.type).toBe('item');
    if (result.data && result.data.type === 'item') {
      expect(result.data.item.name).toBe('回復薬');
      expect(result.data.item.type).toBe('consumable');
      expect(result.data.item.effect_data?.heal_hp).toBe(30);
    }
  });

  it('スキルカードMDテンプレートを正しくパースする', () => {
    const md = `---
version: "1.0"
type: skill_card
---

## スキルカード定義

名前: 炎の剣
威力: 15
AP消費: 2
対象: single_enemy
効果: attack
効果持続: 0
説明: 炎を纏った一撃
画像: ""
`;

    const result = parseTemplate(md, 'md');
    expect(result.success).toBe(true);
    expect(result.type).toBe('skill_card');
    if (result.data && result.data.type === 'skill_card') {
      expect(result.data.card.name).toBe('炎の剣');
      expect(result.data.card.power).toBe(15);
      expect(result.data.card.ap_cost).toBe(2);
      expect(result.data.card.effect_id).toBe('attack');
    }
  });

  it('NPC MDテンプレートを正しくパースする', () => {
    const md = `---
version: "1.0"
type: npc
---

## NPC定義

名前: 剣士リーナ
レベル: 10
ATK: 12
DEF: 8
耐久度: 150
カバー率: 20
AI: striker
スキル: [slash, guard]
画像: ""
フレーバーテキスト: 旅の剣士
護衛対象: false
`;

    const result = parseTemplate(md, 'md');
    expect(result.success).toBe(true);
    expect(result.type).toBe('npc');
    if (result.data && result.data.type === 'npc') {
      expect(result.data.npc.name).toBe('剣士リーナ');
      expect(result.data.npc.level).toBe(10);
      expect(result.data.npc.ai_role).toBe('striker');
      expect(result.data.npc.signature_skills).toEqual(['slash', 'guard']);
    }
  });

  it('エネミーMDの行動パターンをパースする', () => {
    const md = `---
version: "1.0"
type: enemy
---

## エネミー定義

名前: ゴブリン戦士
レベル: 5
HP: 60
ATK: 8
DEF: 4
スキル: [tackle]
行動パターン:
  - skill: tackle
    prob: 70
  - skill: guard
    prob: 30
画像: ""
フレーバーテキスト: 小型だが凶暴
`;

    const result = parseTemplate(md, 'md');
    expect(result.success).toBe(true);
    if (result.data && result.data.type === 'enemy') {
      expect(result.data.enemy.action_pattern).toBeDefined();
      expect(result.data.enemy.action_pattern?.length).toBe(2);
      expect(result.data.enemy.action_pattern?.[0].skill).toBe('tackle');
      expect(result.data.enemy.action_pattern?.[0].prob).toBe(70);
    }
  });

  it('フィールド不足のMDはバリデーションエラー', () => {
    const md = `---
version: "1.0"
type: enemy
---

## エネミー定義

レベル: 5
`;

    const result = parseTemplate(md, 'md');
    expect(result.success).toBe(false);
    expect(result.errors.some(e => e.code === 'VALIDATION_ERROR')).toBe(true);
  });
});

