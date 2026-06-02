/**
 * UGC System v2 — 統一テンプレートパーサー
 * @module ugcTemplateParser
 *
 * JSON / MD の自動判別を行い、パース → Zodバリデーション → バランスチェック
 * の一連の処理をまとめて実行する。
 */

import {
  UgcTemplateSchema,
  UgcQuestTemplateSchema,
  type UgcTemplate,
  type UgcQuestTemplate,
  type UgcFlowNode,
} from './ugcTemplateSchema';
import { extractFrontmatter, parseScenarioBody, parseEnemyMdBody, parseItemMdBody, parseSkillCardMdBody, parseNpcMdBody } from './ugcMdParser';
import { validateUgcUrls, type AssetUrlValidationError } from './ugcAssetUrl';
import { calcEnemyTp, calcNpcNp, calcQuestPb, type BalanceResult } from './ugcBalanceCalc';
import { UGC_TEMPLATE_MAX_SIZE } from './ugcConfig';

// ── 結果型 ──────────────────────────────────────────────────────────────────

export interface ParseError {
  line?: number;
  field?: string;
  message: string;
  code: string;
}

export interface ParseWarning {
  field?: string;
  message: string;
}

export interface ParseResult {
  success: boolean;
  type?: UgcTemplate['type'];
  data?: UgcTemplate;
  errors: ParseError[];
  warnings: ParseWarning[];
  balance?: {
    power_budget?: BalanceResult;
    enemies?: Array<{ nodeId: string; name: string; result: BalanceResult }>;
    npcs?: Array<{ nodeId: string; name: string; result: BalanceResult }>;
  };
}

// ── 形式判別 ────────────────────────────────────────────────────────────────

export type TemplateFormat = 'md' | 'json';

/**
 * テンプレート文字列の形式を自動判別する
 */
export function detectFormat(content: string): TemplateFormat {
  const trimmed = content.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (trimmed.startsWith('---')) return 'md';
  return 'json'; // fallback
}

// ── メインパーサー ──────────────────────────────────────────────────────────

/**
 * テンプレート文字列をパース・バリデーションする統一エントリポイント
 */
export function parseTemplate(
  content: string,
  format?: TemplateFormat
): ParseResult {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];

  // ── サイズチェック
  const size = new TextEncoder().encode(content).length;
  if (size > UGC_TEMPLATE_MAX_SIZE) {
    return {
      success: false,
      errors: [{
        message: `テンプレートのサイズが上限（${UGC_TEMPLATE_MAX_SIZE / 1024}KB）を超えています。`,
        code: 'FILE_TOO_LARGE',
      }],
      warnings: [],
    };
  }

  // ── 形式判別
  const detectedFormat = format || detectFormat(content);

  // ── パース
  let rawData: Record<string, unknown>;
  try {
    if (detectedFormat === 'md') {
      rawData = parseMdTemplate(content);
    } else {
      rawData = JSON.parse(content);
    }
  } catch (e) {
    return {
      success: false,
      errors: [{
        message: `テンプレートのパースに失敗しました: ${(e as Error).message}`,
        code: 'PARSE_ERROR',
      }],
      warnings: [],
    };
  }

  // ── 型判別
  const type = rawData.type as string;
  if (!type) {
    return {
      success: false,
      errors: [{ message: 'テンプレートの type フィールドが必要です。', code: 'MISSING_TYPE' }],
      warnings: [],
    };
  }

  // ── Zodバリデーション
  const zodResult = UgcTemplateSchema.safeParse(rawData);
  if (!zodResult.success) {
    for (const issue of zodResult.error.issues) {
      errors.push({
        field: issue.path.join('.'),
        message: issue.message,
        code: 'VALIDATION_ERROR',
      });
    }
    return { success: false, errors, warnings };
  }

  const data = zodResult.data;

  // ── クエスト固有の追加バリデーション
  let balance: ParseResult['balance'];
  if (data.type === 'quest') {
    const questErrors = validateQuest(data, warnings);
    errors.push(...questErrors);

    if (errors.length === 0) {
      balance = calculateQuestBalance(data);

      // バランス超過チェック
      if (balance?.power_budget && !balance.power_budget.is_valid) {
        errors.push({
          field: 'rewards',
          message: `報酬のパワーコスト（${balance.power_budget.consumed_points}）がパワーバジェット（${balance.power_budget.total_points}）を超過しています。`,
          code: 'PB_EXCEEDED',
        });
      }
      if (balance?.enemies) {
        for (const e of balance.enemies) {
          if (!e.result.is_valid) {
            errors.push({
              field: `nodes.${e.nodeId}.enemyData`,
              message: `エネミー「${e.name}」のTP（${e.result.consumed_points}）が上限（${e.result.total_points}）を超過しています。`,
              code: 'TP_EXCEEDED',
            });
          }
        }
      }
      if (balance?.npcs) {
        for (const n of balance.npcs) {
          if (!n.result.is_valid) {
            errors.push({
              field: `nodes.${n.nodeId}.npcData`,
              message: `NPC「${n.name}」のNP（${n.result.consumed_points}）が上限（${n.result.total_points}）を超過しています。`,
              code: 'NP_EXCEEDED',
            });
          }
        }
      }
    }
  }

  return {
    success: errors.length === 0,
    type: data.type,
    data,
    errors,
    warnings,
    balance,
  };
}

// ── MD → Raw Object 変換 ────────────────────────────────────────────────────

function parseMdTemplate(content: string): Record<string, unknown> {
  const { frontmatter, body } = extractFrontmatter(content);

  switch (frontmatter.type) {
    case 'quest':
      // quest型の場合、nodesをフラット化
      return {
        ...frontmatter,
        nodes: parseScenarioBody(body),
      };
    case 'enemy':
      return {
        ...frontmatter,
        enemy: parseEnemyMdBody(body),
      };
    case 'item':
      return {
        ...frontmatter,
        item: parseItemMdBody(body),
      };
    case 'skill_card':
      return {
        ...frontmatter,
        card: parseSkillCardMdBody(body),
      };
    case 'npc':
      return {
        ...frontmatter,
        npc: parseNpcMdBody(body),
      };
    default:
      // 個別アセットテンプレートの場合はfrontmatterをそのまま返す
      return frontmatter;
  }
}


// ── クエスト固有バリデーション ────────────────────────────────────────────────

function validateQuest(
  quest: UgcQuestTemplate,
  warnings: ParseWarning[]
): ParseError[] {
  const errors: ParseError[] = [];

  // ── ノード参照整合性チェック
  const nodeIds = new Set(quest.nodes.map(n => n.id));

  // 成功ノードが少なくとも1つ必要
  const hasSuccess = quest.nodes.some(n => n.type === 'success');
  if (!hasSuccess) {
    errors.push({
      message: '少なくとも1つの「成功」ノードが必要です。',
      code: 'NO_SUCCESS_NODE',
    });
  }

  // 選択肢・next 参照先チェック
  for (const node of quest.nodes) {
    for (const choice of node.choices) {
      if (!nodeIds.has(choice.next)) {
        errors.push({
          field: `nodes.${node.id}.choices`,
          message: `選択肢「${choice.label}」の参照先「${choice.next}」が存在しません。`,
          code: 'INVALID_NODE_REF',
        });
      }
    }
    if (node.next && !nodeIds.has(node.next)) {
      errors.push({
        field: `nodes.${node.id}.next`,
        message: `ノード「${node.id}」の進行先「${node.next}」が存在しません。`,
        code: 'INVALID_NODE_REF',
      });
    }
  }

  // ── ugc:// URL バリデーション
  const urlErrors = validateUgcUrls(quest.nodes);
  for (const ue of urlErrors) {
    errors.push({
      field: `nodes.${ue.nodeId}.${ue.field}`,
      message: ue.message,
      code: ue.code,
    });
  }

  // ── 画像未指定の警告
  const battleNodes = quest.nodes.filter(n => n.type === 'battle');
  for (const bn of battleNodes) {
    if (bn.enemyData && !bn.enemyData.image_url) {
      warnings.push({
        field: `nodes.${bn.id}.enemyData.image_url`,
        message: `エネミー「${bn.enemyData.name}」に画像が指定されていません。デフォルト画像が使用されます。`,
      });
    }
  }

  return errors;
}

// ── バランス計算 ────────────────────────────────────────────────────────────

function calculateQuestBalance(quest: UgcQuestTemplate): ParseResult['balance'] {
  const battleCount = quest.nodes.filter(n => n.type === 'battle').length;

  // PB 計算
  const pbInput = {
    rec_level: quest.rec_level,
    battle_count: battleCount,
    node_count: quest.nodes.length,
    items: quest.rewards?.items?.map(item => ({
      type: item.type,
      heal_hp: item.effect_data?.heal_hp,
      cure_status: item.effect_data?.cure_status,
    })),
    skill_card: quest.rewards?.skill_card ? {
      power: quest.rewards.skill_card.power,
      ap_cost: quest.rewards.skill_card.ap_cost,
      effect_id: quest.rewards.skill_card.effect_id,
    } : null,
  };

  const power_budget = calcQuestPb(pbInput);

  // エネミー TP 計算
  const enemies: Array<{ nodeId: string; name: string; result: BalanceResult }> = [];
  for (const node of quest.nodes) {
    if (node.type === 'battle' && node.enemyData) {
      const result = calcEnemyTp({
        level: node.enemyData.level,
        hp: node.enemyData.hp,
        atk: node.enemyData.atk,
        def: node.enemyData.def,
        skills: node.enemyData.skills,
      });
      enemies.push({ nodeId: node.id, name: node.enemyData.name, result });
    }
  }

  // NPC NP 計算
  const npcs: Array<{ nodeId: string; name: string; result: BalanceResult }> = [];
  for (const node of quest.nodes) {
    if (node.type === 'npc_join' && node.npcData) {
      const result = calcNpcNp({
        level: node.npcData.level,
        atk: node.npcData.atk,
        def: node.npcData.def,
        durability: node.npcData.durability,
        cover_rate: node.npcData.cover_rate,
        skills: node.npcData.signature_skills,
      });
      npcs.push({ nodeId: node.id, name: node.npcData.name, result });
    }
  }

  return { power_budget, enemies, npcs };
}
