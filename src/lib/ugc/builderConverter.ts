/**
 * UGC Quest Builder — コンバーターロジック
 * @module builderConverter
 *
 * BuilderQuest（キャンバス状態）→ UgcQuestTemplate JSON に変換する。
 */

import type { BuilderQuest, BuilderNode, BuilderEdge } from '@/types/builder';
import type { UgcQuestTemplate, UgcFlowNode, UgcItemData } from './ugcTemplateSchema';
import { UGC_TEMPLATE_VERSION } from './ugcConfig';
import { PRESET_ENEMIES, PRESET_REWARD_ITEMS, scaleEnemyStats } from './builderPresets';

// ── ヘルパー型 ──────────────────────────────────────────────────────────────

/** 変換結果にパススルーフィールドを付与した拡張型 */
type ConvertedTemplate = UgcQuestTemplate & {
  source_format: 'builder';
};

// ── アクションパターン条件の変換 ─────────────────────────────────────────────
// PresetEnemy は 'hp_under:50' 形式を使うが、
// UgcEnemyDataSchema は 'hp_under_50' | 'hp_under_25' | 'turn_mod_3' | '' を受け付ける。

function convertCondition(
  condition?: string,
): 'hp_under_50' | 'hp_under_25' | 'turn_mod_3' | '' | undefined {
  if (!condition) return undefined;
  // 'hp_under:50' → 'hp_under_50'
  const normalized = condition.replace(':', '_');
  switch (normalized) {
    case 'hp_under_50':
      return 'hp_under_50';
    case 'hp_under_25':
      return 'hp_under_25';
    case 'turn_mod_3':
      return 'turn_mod_3';
    default:
      // 'hp_under:40' や 'hp_under:30' など、Zodスキーマの列挙値にない場合は
      // 最も近い閾値にマッピングするか、空文字で安全にフォールバック
      if (normalized.startsWith('hp_under_')) {
        const pct = parseInt(normalized.replace('hp_under_', ''), 10);
        if (!isNaN(pct) && pct <= 30) return 'hp_under_25';
        return 'hp_under_50';
      }
      return '';
  }
}

// ── グラフ走査 ───────────────────────────────────────────────────────────────

/** ルートノード（入力エッジなし）を検出 */
function findRootNodes(nodes: BuilderNode[], edges: BuilderEdge[]): BuilderNode[] {
  const targets = new Set(edges.map(e => e.target));
  return nodes.filter(n => !targets.has(n.id));
}

/** DFS でノード走査順を決定（重複排除済み） */
function buildNodeOrder(nodes: BuilderNode[], edges: BuilderEdge[]): BuilderNode[] {
  const roots = findRootNodes(nodes, edges);
  const adjacency = new Map<string, BuilderEdge[]>();
  for (const n of nodes) {
    adjacency.set(n.id, []);
  }
  for (const e of edges) {
    adjacency.get(e.source)?.push(e);
  }

  const ordered: BuilderNode[] = [];
  const visited = new Set<string>();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = nodeMap.get(nodeId);
    if (!node) return;
    ordered.push(node);

    // handleIndex 順にソートして安定した順序で辿る
    const outEdges = (adjacency.get(nodeId) ?? []).sort(
      (a, b) => (a.handleIndex ?? 0) - (b.handleIndex ?? 0),
    );
    for (const edge of outEdges) {
      dfs(edge.target);
    }
  }

  // ルートノードから開始
  for (const root of roots) {
    dfs(root.id);
  }

  // 万が一ルートから到達できないノードがあれば追加（孤立ノード対策）
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      ordered.push(node);
    }
  }

  return ordered;
}

// ── ノード変換 ───────────────────────────────────────────────────────────────

function convertNode(
  node: BuilderNode,
  edges: BuilderEdge[],
): UgcFlowNode {
  const outEdges = edges
    .filter(e => e.source === node.id)
    .sort((a, b) => (a.handleIndex ?? 0) - (b.handleIndex ?? 0));

  // 共通ベース
  const base: UgcFlowNode = {
    id: node.id,
    type: node.type,
    text: node.data.text ?? '',
    choices: [],
  };

  switch (node.type) {
    case 'text': {
      if (node.data.speaker_name) base.speaker_name = node.data.speaker_name;
      if (node.data.bg_key) base.bg_key = node.data.bg_key;
      if (node.data.bgm_key) base.bgm_key = node.data.bgm_key;

      if (outEdges.length > 1) {
        // 選択肢あり
        base.choices = outEdges.map(e => ({
          label: e.label || `選択肢${(e.handleIndex ?? 0) + 1}`,
          next: e.target,
        }));
      } else if (outEdges.length === 1) {
        // 単一接続 → auto-advance
        base.next = outEdges[0].target;
      }
      break;
    }

    case 'battle': {
      const presetId = node.data.preset_enemy_id;
      const targetLevel = node.data.enemy_level ?? 5;

      if (presetId) {
        const preset = PRESET_ENEMIES.find(p => p.id === presetId);
        if (preset) {
          const scaled = scaleEnemyStats(preset, targetLevel);
          base.enemyData = {
            name: preset.name,
            level: targetLevel,
            hp: scaled.hp,
            atk: scaled.atk,
            def: scaled.def,
            skills: [...preset.skills],
            action_pattern: preset.actionPattern.map(ap => ({
              skill: ap.skill,
              prob: ap.prob,
              ...(ap.condition ? { condition: convertCondition(ap.condition) } : {}),
            })),
            asset_type: 'enemy',
          };
        }
      }

      if (outEdges.length > 0) {
        base.next = outEdges[0].target;
      }
      break;
    }

    case 'delivery': {
      if (node.data.delivery_item_slug) {
        base.delivery_item = node.data.delivery_item_slug;
      }
      base.delivery_count = node.data.delivery_quantity ?? 1;
      if (!base.text) {
        base.text = `アイテムを${base.delivery_count}個納品してください。`;
      }

      if (outEdges.length > 0) {
        base.next = outEdges[0].target;
      }
      break;
    }

    case 'trap': {
      base.trap_damage_pct = node.data.damage_pct ?? 10;
      if (!base.text) {
        base.text = `罠が発動！ HPの${base.trap_damage_pct}%のダメージを受けた。`;
      }

      if (outEdges.length > 0) {
        base.next = outEdges[0].target;
      }
      break;
    }

    case 'success': {
      if (!base.text) {
        base.text = 'クエスト完了！ 依頼を達成した。';
      }
      break;
    }

    case 'failure': {
      if (!base.text) {
        base.text = 'クエスト失敗… 依頼を達成できなかった。';
      }
      break;
    }
  }

  return base;
}

// ── 報酬変換 ─────────────────────────────────────────────────────────────────

function convertRewardItems(
  items: { slug: string; quantity: number }[],
): UgcItemData[] {
  const result: UgcItemData[] = [];

  for (const item of items) {
    const preset = PRESET_REWARD_ITEMS.find(p => p.slug === item.slug);
    if (!preset) continue;

    result.push({
      name: preset.name,
      type: preset.type,
      base_price: 1,
      description: preset.effect_summary,
      rarity: 'common',
    });
  }

  return result;
}

// ── メイン変換関数 ──────────────────────────────────────────────────────────

export function convertBuilderToTemplate(quest: BuilderQuest): ConvertedTemplate {
  const { nodes, edges } = quest.canvas;

  // 1. ノード順序を決定
  const orderedNodes = buildNodeOrder(nodes, edges);

  // 2. 各ノードを変換
  const convertedNodes: UgcFlowNode[] = orderedNodes.map(n => convertNode(n, edges));

  // 3. 報酬を変換
  const rewardItems = convertRewardItems(quest.rewards.items);

  // 4. 条件フィルタリング（未設定の値を除外）
  const conditions: UgcQuestTemplate['conditions'] = {};
  if (quest.conditions.min_align_order_pct != null) {
    conditions.min_align_order_pct = quest.conditions.min_align_order_pct;
  }
  if (quest.conditions.min_align_chaos_pct != null) {
    conditions.min_align_chaos_pct = quest.conditions.min_align_chaos_pct;
  }
  if (quest.conditions.min_align_justice_pct != null) {
    conditions.min_align_justice_pct = quest.conditions.min_align_justice_pct;
  }
  if (quest.conditions.min_align_evil_pct != null) {
    conditions.min_align_evil_pct = quest.conditions.min_align_evil_pct;
  }

  // 5. テンプレート組み立て
  const template: ConvertedTemplate = {
    version: UGC_TEMPLATE_VERSION as '1.0',
    type: 'quest',
    title: quest.title,
    short_description: quest.short_description,
    client_name: quest.client_name || '謎の依頼人',
    scenario_type: quest.scenario_type,
    difficulty: quest.difficulty,
    rec_level: quest.rec_level,
    days_success: quest.days_success,
    days_failure: quest.days_failure,
    conditions: Object.keys(conditions).length > 0 ? conditions : undefined,
    rewards: rewardItems.length > 0 ? { items: rewardItems } : undefined,
    nodes: convertedNodes,
    source_format: 'builder',
  };

  return template;
}
