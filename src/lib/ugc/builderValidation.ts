/**
 * UGC Quest Builder — バリデーションロジック
 * @module builderValidation
 *
 * BuilderQuest のフロー構造を検証し、変換前にエラー/警告を返す。
 */

import type { BuilderQuest, BuilderNode, BuilderEdge } from '@/types/builder';

// ── 結果型 ──────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'error';
  code: string;
  message: string;
  nodeId?: string;
}

export interface ValidationWarning {
  type: 'warning';
  code: string;
  message: string;
  nodeId?: string;
}

// ── 定数 ─────────────────────────────────────────────────────────────────────

const MAX_NODES = 20;
const MAX_TEXT_LENGTH = 500;
const MAX_CHOICES = 2;

// ── ヘルパー ─────────────────────────────────────────────────────────────────

/** ノードIDから出ているエッジ一覧 */
function outgoingEdges(nodeId: string, edges: BuilderEdge[]): BuilderEdge[] {
  return edges.filter(e => e.source === nodeId);
}

/** ノードIDに入っているエッジ一覧 */
function incomingEdges(nodeId: string, edges: BuilderEdge[]): BuilderEdge[] {
  return edges.filter(e => e.target === nodeId);
}

/** ルートノード（入ってくるエッジが無いノード）を返す */
function findRootNodes(nodes: BuilderNode[], edges: BuilderEdge[]): BuilderNode[] {
  const targets = new Set(edges.map(e => e.target));
  return nodes.filter(n => !targets.has(n.id));
}

/** DFS でサイクルを検出する。見つかった場合はサイクル内のノードIDを返す */
function detectCycles(nodes: BuilderNode[], edges: BuilderEdge[]): Set<string> {
  const adjacency = new Map<string, string[]>();
  for (const n of nodes) {
    adjacency.set(n.id, []);
  }
  for (const e of edges) {
    adjacency.get(e.source)?.push(e.target);
  }

  const cycleNodes = new Set<string>();
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(id: string): boolean {
    visited.add(id);
    inStack.add(id);

    for (const next of adjacency.get(id) ?? []) {
      if (!visited.has(next)) {
        if (dfs(next)) {
          cycleNodes.add(id);
          return true;
        }
      } else if (inStack.has(next)) {
        cycleNodes.add(id);
        cycleNodes.add(next);
        return true;
      }
    }

    inStack.delete(id);
    return false;
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) {
      dfs(n.id);
    }
  }

  return cycleNodes;
}

/** 全パスが終了ノード（success/failure）に到達するか検証する */
function checkAllPathsReachEnd(
  rootIds: string[],
  nodes: BuilderNode[],
  edges: BuilderEdge[],
): Set<string> {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adjacency = new Map<string, string[]>();
  for (const n of nodes) {
    adjacency.set(n.id, []);
  }
  for (const e of edges) {
    adjacency.get(e.source)?.push(e.target);
  }

  const endNodeIds = new Set(
    nodes.filter(n => n.type === 'success' || n.type === 'failure').map(n => n.id),
  );

  // メモ化: ノードから終了に到達可能か
  const reachable = new Map<string, boolean>();
  const visiting = new Set<string>();

  function canReachEnd(id: string): boolean {
    if (reachable.has(id)) return reachable.get(id)!;
    if (endNodeIds.has(id)) {
      reachable.set(id, true);
      return true;
    }

    // サイクル回避
    if (visiting.has(id)) return false;
    visiting.add(id);

    const nexts = adjacency.get(id) ?? [];
    if (nexts.length === 0) {
      // 行き止まりだが終了ノードではない
      reachable.set(id, false);
      visiting.delete(id);
      return false;
    }

    // 全ての分岐先が終了に到達できる必要がある
    const result = nexts.every(next => canReachEnd(next));
    reachable.set(id, result);
    visiting.delete(id);
    return result;
  }

  // 到達不可能なノードを収集
  const unreachableNodes = new Set<string>();
  for (const rootId of rootIds) {
    if (!canReachEnd(rootId)) {
      // ルートからの全パスを辿って、到達不可ノードを特定
      const stack = [rootId];
      const seen = new Set<string>();
      while (stack.length > 0) {
        const cur = stack.pop()!;
        if (seen.has(cur)) continue;
        seen.add(cur);
        if (!canReachEnd(cur) && !endNodeIds.has(cur)) {
          const outs = adjacency.get(cur) ?? [];
          if (outs.length === 0) {
            unreachableNodes.add(cur);
          } else {
            for (const next of outs) {
              stack.push(next);
            }
          }
        }
      }
    }
  }

  return unreachableNodes;
}

/** 分岐の深さチェック: 分岐先がさらに分岐していたら depth > 1 */
function checkBranchingDepth(
  nodes: BuilderNode[],
  edges: BuilderEdge[],
): string[] {
  const violations: string[] = [];

  for (const node of nodes) {
    const outs = outgoingEdges(node.id, edges);
    if (outs.length > 1) {
      // この分岐のターゲットノードが、さらに分岐を持っていないか
      for (const edge of outs) {
        const targetOuts = outgoingEdges(edge.target, edges);
        if (targetOuts.length > 1) {
          violations.push(edge.target);
        }
      }
    }
  }

  return violations;
}

// ── メインバリデーション関数 ─────────────────────────────────────────────────

export function validateBuilderQuest(quest: BuilderQuest): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { nodes, edges } = quest.canvas;

  // ── NO_TITLE ──
  if (!quest.title.trim()) {
    errors.push({
      type: 'error',
      code: 'NO_TITLE',
      message: 'クエストタイトルが未入力です。',
    });
  }

  // ── NO_NODES ──
  if (nodes.length === 0) {
    errors.push({
      type: 'error',
      code: 'NO_NODES',
      message: 'ノードが1つもありません。フローを作成してください。',
    });
    // ノードが無い場合はここで返す（後続チェックは不要）
    return { valid: false, errors, warnings };
  }

  // ── TOO_MANY_NODES ──
  if (nodes.length > MAX_NODES) {
    errors.push({
      type: 'error',
      code: 'TOO_MANY_NODES',
      message: `ノード数が上限（${MAX_NODES}個）を超えています。現在: ${nodes.length}個`,
    });
  }

  // ── NO_END_NODE ──
  const hasSuccess = nodes.some(n => n.type === 'success');
  const hasFailure = nodes.some(n => n.type === 'failure');
  if (!hasSuccess && !hasFailure) {
    errors.push({
      type: 'error',
      code: 'NO_END_NODE',
      message: '終了ノード（成功または失敗）が必要です。',
    });
  }

  // ── ルートノード取得 ──
  const rootNodes = findRootNodes(nodes, edges);

  // ── ORPHAN_NODE: 入力も出力もないノード（ルート除く） ──
  for (const node of nodes) {
    const isRoot = rootNodes.some(r => r.id === node.id);
    const hasIn = incomingEdges(node.id, edges).length > 0;
    const hasOut = outgoingEdges(node.id, edges).length > 0;
    const isEndNode = node.type === 'success' || node.type === 'failure';

    if (!isRoot && !hasIn && !hasOut) {
      errors.push({
        type: 'error',
        code: 'ORPHAN_NODE',
        message: '孤立ノードがあります。接続してください。',
        nodeId: node.id,
      });
    } else if (!isRoot && !hasIn) {
      // 入力がないが出力はある — 非ルートで到達不可能
      errors.push({
        type: 'error',
        code: 'ORPHAN_NODE',
        message: 'このノードへの接続がありません。',
        nodeId: node.id,
      });
    } else if (!isEndNode && !hasOut && hasIn) {
      // 終了ノード以外で出力がない — 行き止まり
      errors.push({
        type: 'error',
        code: 'ORPHAN_NODE',
        message: 'このノードからの接続がありません（行き止まり）。',
        nodeId: node.id,
      });
    }
  }

  // ── TOO_MANY_CHOICES ──
  for (const node of nodes) {
    const outs = outgoingEdges(node.id, edges);
    if (outs.length > MAX_CHOICES) {
      errors.push({
        type: 'error',
        code: 'TOO_MANY_CHOICES',
        message: `選択肢は最大${MAX_CHOICES}つまでです。現在: ${outs.length}本の接続`,
        nodeId: node.id,
      });
    }
  }

  // ── CYCLE_DETECTED ──
  const cycleNodes = detectCycles(nodes, edges);
  if (cycleNodes.size > 0) {
    for (const nodeId of cycleNodes) {
      errors.push({
        type: 'error',
        code: 'CYCLE_DETECTED',
        message: 'フローに循環参照があります。ループを解消してください。',
        nodeId,
      });
    }
  }

  // ── BRANCH_DEPTH ──
  const depthViolations = checkBranchingDepth(nodes, edges);
  for (const nodeId of depthViolations) {
    errors.push({
      type: 'error',
      code: 'BRANCH_DEPTH',
      message: '分岐の深さが制限（1段階）を超えています。分岐先でさらに分岐することはできません。',
      nodeId,
    });
  }

  // ── UNREACHABLE_END ──
  if ((hasSuccess || hasFailure) && cycleNodes.size === 0 && rootNodes.length > 0) {
    const unreachable = checkAllPathsReachEnd(
      rootNodes.map(r => r.id),
      nodes,
      edges,
    );
    for (const nodeId of unreachable) {
      errors.push({
        type: 'error',
        code: 'UNREACHABLE_END',
        message: 'このノードから終了ノードに到達できないパスがあります。',
        nodeId,
      });
    }
  }

  // ── ノード個別チェック ──
  for (const node of nodes) {
    // MISSING_ENEMY
    if (node.type === 'battle' && !node.data.preset_enemy_id) {
      errors.push({
        type: 'error',
        code: 'MISSING_ENEMY',
        message: 'バトルノードに敵が設定されていません。',
        nodeId: node.id,
      });
    }

    // MISSING_DELIVERY_ITEM
    if (node.type === 'delivery' && !node.data.delivery_item_slug) {
      errors.push({
        type: 'error',
        code: 'MISSING_DELIVERY_ITEM',
        message: '納品ノードにアイテムが設定されていません。',
        nodeId: node.id,
      });
    }

    // TEXT_TOO_LONG
    if (node.data.text && node.data.text.length > MAX_TEXT_LENGTH) {
      errors.push({
        type: 'error',
        code: 'TEXT_TOO_LONG',
        message: `テキストが上限（${MAX_TEXT_LENGTH}文字）を超えています。現在: ${node.data.text.length}文字`,
        nodeId: node.id,
      });
    }

    // EMPTY_TEXT (warning)
    if (node.type === 'text' && (!node.data.text || !node.data.text.trim())) {
      warnings.push({
        type: 'warning',
        code: 'EMPTY_TEXT',
        message: 'テキストノードの内容が空です。',
        nodeId: node.id,
      });
    }
  }

  // ── NO_REWARD (warning) ──
  if (!quest.rewards.items || quest.rewards.items.length === 0) {
    warnings.push({
      type: 'warning',
      code: 'NO_REWARD',
      message: '報酬アイテムが設定されていません。',
    });
  }

  // ── SINGLE_PATH (warning) ──
  const hasBranch = nodes.some(n => outgoingEdges(n.id, edges).length > 1);
  if (!hasBranch && nodes.length > 1) {
    warnings.push({
      type: 'warning',
      code: 'SINGLE_PATH',
      message: '分岐がない一本道のフローです。選択肢を追加すると面白くなるかもしれません。',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
