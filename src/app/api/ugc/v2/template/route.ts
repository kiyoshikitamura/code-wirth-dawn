process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';

/**
 * GET /api/ugc/v2/template?type=quest&format=json
 *
 * テンプレートダウンロードAPI。
 * 空のテンプレート（JSON/MD）を返す。
 * 認証不要（仕様: spec_ugc_system_v2.md §5.2）。
 * ※ テンプレート配布はUGC_ENABLEDフラグに依存しない（常時利用可能）。
 */
export async function GET(request: Request) {
  try {


    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'quest';
    const format = searchParams.get('format') || 'json';

    const templates: Record<string, object> = {
      quest: {
        $template: 'wirth-dawn-ugc',
        version: '1.0',
        type: 'quest',
        title: '',
        short_description: '',
        full_description: '',
        client_name: '謎の依頼人',
        scenario_type: 'Other',
        difficulty: 1,
        rec_level: 5,
        days_success: 1,
        days_failure: 1,
        conditions: {},
        rewards: {
          items: [],
          skill_card: null,
        },
        nodes: [
          {
            id: 'start',
            type: 'text',
            text: '（ここにシナリオ本文を記述）',
            speaker_name: '',
            bg_key: '',
            bgm_key: '',
            choices: [{ label: '次へ', next: 'node_2' }],
          },
          {
            id: 'node_2',
            type: 'battle',
            text: '戦闘が始まった！',
            enemyData: {
              name: 'カスタムモンスター',
              level: 5,
              hp: 30,
              atk: 5,
              def: 3,
              skills: [],
              image_url: '',
              flavor_text: '',
            },
            choices: [{ label: 'win', next: 'node_3' }],
          },
          {
            id: 'node_3',
            type: 'success',
            text: 'クエスト達成！',
            choices: [],
          },
        ],
      },
      enemy: {
        $template: 'wirth-dawn-ugc',
        version: '1.0',
        type: 'enemy',
        enemy: {
          name: '',
          level: 5,
          hp: 50,
          atk: 5,
          def: 3,
          skills: [],
          action_pattern: [],
          image_url: '',
          flavor_text: '',
        },
      },
      item: {
        $template: 'wirth-dawn-ugc',
        version: '1.0',
        type: 'item',
        item: {
          name: '',
          type: 'consumable',
          description: '',
          base_price: 1,
          effect_data: { heal_hp: 50 },
          rarity: 'common',
          use_timing: 'battle',
          image_url: '',
        },
      },
      skill_card: {
        $template: 'wirth-dawn-ugc',
        version: '1.0',
        type: 'skill_card',
        card: {
          name: '',
          power: 10,
          ap_cost: 2,
          target_type: 'single_enemy',
          effect_id: 'attack',
          effect_duration: 0,
          description: '',
          image_url: '',
        },
      },
      npc: {
        $template: 'wirth-dawn-ugc',
        version: '1.0',
        type: 'npc',
        npc: {
          name: '',
          level: 5,
          atk: 5,
          def: 5,
          durability: 100,
          cover_rate: 10,
          ai_role: 'striker',
          signature_skills: [],
          image_url: '',
          flavor_text: '',
        },
      },
    };

    const template = templates[type];
    if (!template) {
      return NextResponse.json({ error: `不明なテンプレートタイプ: ${type}` }, { status: 400 });
    }

    if (format === 'md') {
      // MD形式でのダウンロード
      const mdGenerators: Record<string, () => string> = {
        quest: generateQuestMdTemplate,
        enemy: generateEnemyMdTemplate,
        item: generateItemMdTemplate,
        skill_card: generateSkillCardMdTemplate,
        npc: generateNpcMdTemplate,
      };

      const generator = mdGenerators[type];
      if (!generator) {
        return NextResponse.json({ error: `MD形式は ${type} タイプに対応していません。` }, { status: 400 });
      }

      const md = generator();
      return new NextResponse(md, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${type}_template.md"`,
        },
      });
    }

    return NextResponse.json(template, {
      headers: {
        'Content-Disposition': `attachment; filename="${type}_template.json"`,
      },
    });

  } catch (e: any) {
    console.error('[ugc/v2/template] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function generateQuestMdTemplate(): string {
  return `---
version: "1.0"
type: quest
title: ""
short_description: ""
full_description: ""
client_name: "謎の依頼人"
scenario_type: Other
difficulty: 1
rec_level: 5
days_success: 1
days_failure: 1
conditions:
rewards:
---

## ノード 1: オープニング（テキスト）

**話者**: 依頼人
**背景**: bg_guild_day
**BGM**: bgm_quest_calm

> ここにシナリオ本文を記述してください。

**選択肢**:
- [受ける] → ノード 2

## ノード 2: 戦闘（バトル）

敵が現れた！

**エネミー**:
名前: カスタムモンスター
レベル: 5
HP: 30
ATK: 5
DEF: 3
スキル: []

→ ノード 3

## ノード 3: クリア（成功）

クエストを達成した！
`;
}

function generateEnemyMdTemplate(): string {
  return `---
version: "1.0"
type: enemy
---

## エネミー定義

名前: ""
レベル: 5
HP: 50
ATK: 5
DEF: 3
スキル: []
行動パターン:
  - skill: attack
    prob: 100
画像: ""
フレーバーテキスト: ""
`;
}

function generateItemMdTemplate(): string {
  return `---
version: "1.0"
type: item
---

## アイテム定義

名前: ""
種別: consumable
説明: ""
レアリティ: common
使用タイミング: battle
効果:
  HP回復: 50
画像: ""
`;
}

function generateSkillCardMdTemplate(): string {
  return `---
version: "1.0"
type: skill_card
---

## スキルカード定義

名前: ""
威力: 10
AP消費: 2
対象: single_enemy
効果: attack
効果持続: 0
説明: ""
画像: ""
`;
}

function generateNpcMdTemplate(): string {
  return `---
version: "1.0"
type: npc
---

## NPC定義

名前: ""
レベル: 5
ATK: 5
DEF: 5
耐久度: 100
カバー率: 10
AI: striker
スキル: []
画像: ""
フレーバーテキスト: ""
護衛対象: false
`;
}

