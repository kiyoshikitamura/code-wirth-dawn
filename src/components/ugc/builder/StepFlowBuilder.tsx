'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  ChevronRight,
  GitBranch,
  Edit2,
  Check,
  Play,
  Music,
  ImageIcon,
  Zap,
} from 'lucide-react';
import type { BuilderQuest, BuilderNode, BuilderNodeType, BuilderNodeData, BuilderEdge } from '@/types/builder';
import PresetEnemyPicker from './PresetEnemyPicker';
import { PRESET_ENEMIES } from '@/lib/ugc/builderPresets';

const MAX_NODES = 20;

const INPUT_CLS =
  'w-full px-3 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-xs text-[#e3d5b8] placeholder-[#6d4c3d] focus:border-amber-400 focus:outline-none transition-colors';
const SELECT_CLS =
  'w-full px-3 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-xs text-[#e3d5b8] focus:border-amber-400 focus:outline-none transition-colors';
const LABEL_CLS = 'block text-[9px] text-[#8b5a2b] font-bold mb-1';

interface StepFlowBuilderProps {
  quest: BuilderQuest;
  onUpdate: (updates: Partial<BuilderQuest>) => void;
}

const NODE_TYPE_CONFIG: {
  type: BuilderNodeType;
  label: string;
  icon: string;
  color: string;
  borderColor: string;
}[] = [
  { type: 'text',     label: '会話/テキスト', icon: '📝', color: 'bg-[#2a1f14]', borderColor: 'borderColor-[#5c3c2a]' },
  { type: 'battle',   label: 'バトル戦闘',   icon: '⚔️', color: 'bg-[#2a1414]', borderColor: 'borderColor-[#5c3c2a]' },
  { type: 'delivery', label: 'アイテム納品', icon: '📦', color: 'bg-[#142a1a]', borderColor: 'borderColor-[#5c3c2a]' },
  { type: 'trap',     label: 'トラップ罠',   icon: '⚠️', color: 'bg-[#2a2514]', borderColor: 'borderColor-[#5c3c2a]' },
  { type: 'success',  label: '成功ゴール',   icon: '🏁', color: 'bg-[#14201a]', borderColor: 'borderColor-[#5c3c2a]' },
  { type: 'failure',  label: '失敗エンド',   icon: '💀', color: 'bg-[#2a1818]', borderColor: 'borderColor-[#5c3c2a]' },
];

const BGM_OPTIONS = [
  { value: 'bgm_quest_calm', label: '穏やかな旅情 (Calm)' },
  { value: 'bgm_quest_tension', label: '緊張感のある探索 (Tension)' },
  { value: 'bgm_quest_battle', label: '白熱の戦い (Battle)' },
  { value: 'bgm_quest_sad', label: '悲哀と惜別 (Sad)' },
];

const BG_OPTIONS = [
  { value: 'forest', label: '静寂の森' },
  { value: 'dungeon', label: '地下迷宮' },
  { value: 'town', label: '始まりの街' },
  { value: 'castle', label: '古城跡' },
  { value: 'plains', label: '遙かなる平原' },
];

function StepFlowBuilderInner({ quest, onUpdate }: StepFlowBuilderProps) {
  const { nodes, edges } = quest.canvas;
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [showEnemyPickerForNodeId, setShowEnemyPickerForNodeId] = useState<string | null>(null);

  // ── Node data helpers ──
  const getDefaultNodeData = (type: BuilderNodeType): BuilderNodeData => {
    switch (type) {
      case 'text':
        return { text: '', speaker_name: '', choices: [] };
      case 'battle':
        return { preset_enemy_id: 'goblin', enemy_level: 5 };
      case 'delivery':
        return { delivery_item_slug: 'potion', delivery_quantity: 1 };
      case 'trap':
        return { damage_pct: 10 };
      case 'success':
        return { result: 'success' };
      case 'failure':
        return { result: 'failure' };
      default:
        return {};
    }
  };

  // ── Add Node ──
  const handleAddNode = useCallback((type: BuilderNodeType) => {
    if (nodes.length >= MAX_NODES) {
      alert(`最大ノード数（${MAX_NODES}個）に達しました`);
      return;
    }

    const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNode: BuilderNode = {
      id: newNodeId,
      type,
      position: { x: 0, y: 0 }, // Unused in step view
      data: getDefaultNodeData(type),
    };

    // If there is an existing last node, auto-connect to this new node
    let updatedEdges = [...edges];
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      // Only auto-connect if last node is NOT success/failure
      if (lastNode.type !== 'success' && lastNode.type !== 'failure') {
        const hasExistingConnection = edges.some(e => e.source === lastNode.id && (e.handleIndex ?? 0) === 0);
        if (!hasExistingConnection) {
          updatedEdges.push({
            id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            source: lastNode.id,
            target: newNodeId,
            handleIndex: 0,
          });
        }
      }
    }

    onUpdate({
      canvas: {
        ...quest.canvas,
        nodes: [...nodes, newNode],
        edges: updatedEdges,
      },
    });
    setExpandedNodeId(newNodeId);
  }, [nodes, edges, quest.canvas, onUpdate]);

  // ── Delete Node ──
  const handleDeleteNode = useCallback((nodeId: string) => {
    const updatedNodes = nodes.filter(n => n.id !== nodeId);
    const updatedEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);

    // If a node was deleted, remove any dangling targets and potentially auto-reconnect straight lines
    const cleanedEdges = updatedEdges.map(edge => {
      // If the target node was deleted, check if there's a node after it to connect to
      const targetExists = updatedNodes.some(n => n.id === edge.target);
      if (!targetExists) {
        // Find index of the deleted node in old list
        const deletedIdx = nodes.findIndex(n => n.id === nodeId);
        // Find the node that would come next
        const nextNode = nodes[deletedIdx + 1];
        if (nextNode && nextNode.id !== edge.source) {
          return { ...edge, target: nextNode.id };
        }
        return null;
      }
      return edge;
    }).filter(Boolean) as BuilderEdge[];

    onUpdate({
      canvas: {
        ...quest.canvas,
        nodes: updatedNodes,
        edges: cleanedEdges,
      },
    });

    if (expandedNodeId === nodeId) {
      setExpandedNodeId(null);
    }
  }, [nodes, edges, quest.canvas, onUpdate, expandedNodeId]);

  // ── Reorder Nodes ──
  const handleMoveNode = useCallback((index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nodes.length) return;

    const newNodes = [...nodes];
    const temp = newNodes[index];
    newNodes[index] = newNodes[targetIdx];
    newNodes[targetIdx] = temp;

    onUpdate({
      canvas: {
        ...quest.canvas,
        nodes: newNodes,
      },
    });
  }, [nodes, quest.canvas, onUpdate]);

  // ── Update Node Data ──
  const handleUpdateNodeData = useCallback((nodeId: string, data: BuilderNodeData) => {
    const updatedNodes = nodes.map(n => n.id === nodeId ? { ...n, data } : n);
    onUpdate({
      canvas: {
        ...quest.canvas,
        nodes: updatedNodes,
      },
    });
  }, [nodes, quest.canvas, onUpdate]);

  // ── Edge Update (Transitions) ──
  const handleUpdateTransition = useCallback((sourceId: string, handleIndex: number, targetId: string) => {
    let updatedEdges = [...edges];
    const existingIdx = updatedEdges.findIndex(e => e.source === sourceId && (e.handleIndex ?? 0) === handleIndex);

    if (existingIdx !== -1) {
      if (targetId) {
        updatedEdges[existingIdx] = { ...updatedEdges[existingIdx], target: targetId };
      } else {
        updatedEdges.splice(existingIdx, 1);
      }
    } else if (targetId) {
      updatedEdges.push({
        id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: sourceId,
        target: targetId,
        handleIndex,
      });
    }

    // Synchronize choices next target
    const sourceNode = nodes.find(n => n.id === sourceId);
    let updatedNodes = [...nodes];
    if (sourceNode && sourceNode.type === 'text' && sourceNode.data.choices) {
      const newChoices = [...sourceNode.data.choices];
      if (newChoices[handleIndex]) {
        newChoices[handleIndex] = { ...newChoices[handleIndex], next: targetId };
        updatedNodes = nodes.map(n => n.id === sourceId ? { ...n, data: { ...n.data, choices: newChoices } } : n);
      }
    }

    onUpdate({
      canvas: {
        ...quest.canvas,
        nodes: updatedNodes,
        edges: updatedEdges,
      },
    });
  }, [edges, nodes, quest.canvas, onUpdate]);

  // ── Choice addition/removal for text node ──
  const handleAddChoice = useCallback((node: BuilderNode) => {
    const choices = [...(node.data.choices || [])];
    if (choices.length >= 2) return; // Limit to 2 choices in builder
    choices.push({ label: `選択肢 ${choices.length + 1}`, next: '' });
    handleUpdateNodeData(node.id, { ...node.data, choices });
  }, [handleUpdateNodeData]);

  const handleRemoveChoice = useCallback((node: BuilderNode, choiceIdx: number) => {
    const choices = [...(node.data.choices || [])];
    choices.splice(choiceIdx, 1);

    // Remove the associated edge as well
    const updatedEdges = edges.filter(e => !(e.source === node.id && (e.handleIndex ?? 0) === choiceIdx));
    // Reindex remaining edges if needed
    const reindexedEdges = updatedEdges.map(e => {
      if (e.source === node.id && (e.handleIndex ?? 0) > choiceIdx) {
        return { ...e, handleIndex: (e.handleIndex ?? 0) - 1 };
      }
      return e;
    });

    // Re-synchronize choices next targets
    const cleanedChoices = choices.map((c, cIdx) => {
      const matchingEdge = reindexedEdges.find(e => e.source === node.id && (e.handleIndex ?? 0) === cIdx);
      return { ...c, next: matchingEdge?.target || '' };
    });

    handleUpdateNodeData(node.id, { ...node.data, choices: cleanedChoices });
    onUpdate({
      canvas: {
        ...quest.canvas,
        edges: reindexedEdges,
      },
    });
  }, [edges, quest.canvas, handleUpdateNodeData, onUpdate]);

  // Destination nodes list for dropdowns
  const getAvailableDestinations = useCallback((nodeId: string) => {
    return nodes.map((n, idx) => ({
      id: n.id,
      label: `#${idx + 1} [${n.type.toUpperCase()}] ${n.data.speaker_name ? n.data.speaker_name + ': ' : ''}${
        n.type === 'text' && n.data.text ? n.data.text.substring(0, 10) + '...' : ''
      }`,
    })).filter(n => n.id !== nodeId);
  }, [nodes]);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-4 max-w-md mx-auto w-full">
      <div className="space-y-1 px-1">
        <h2 className="text-sm font-serif font-bold text-amber-400">🗺️ クエストフローの構築</h2>
        <p className="text-[11px] text-[#6d4c3d] leading-relaxed">
          物語や戦闘、罠などを順に並べてクエストを作成します。テキストノードに「選択肢」を追加することで、分岐ルートを作ることができます。
        </p>
      </div>

      {/* Node list */}
      {nodes.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[#5c3c2a]/40 bg-[#1a120e]/30 rounded-lg flex-1 flex flex-col items-center justify-center">
          <Play className="w-8 h-8 text-[#6d4c3d] mb-2 opacity-40 animate-pulse" />
          <p className="text-xs text-[#a38b6b] font-serif mb-1">
            物語がまだ始まっていません
          </p>
          <p className="text-[10px] text-[#6d4c3d]">
            下のアクションからノードを追加してください
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {nodes.map((node, index) => {
            const isExpanded = expandedNodeId === node.id;
            const hasOutgoingEdges = edges.filter(e => e.source === node.id);
            const incomingEdge = edges.find(e => e.target === node.id);

            // Is this a branch destination? (indented visual clue)
            const isBranchTarget = incomingEdge && (incomingEdge.handleIndex ?? 0) > 0;

            return (
              <div key={node.id} className="space-y-1">
                {/* Node connector line */}
                {index > 0 && !isBranchTarget && (
                  <div className="flex justify-center -my-1">
                    <ArrowDown className="w-4 h-4 text-[#5c3c2a]/60" />
                  </div>
                )}

                {/* Node Card */}
                <div
                  className={`bg-[#1a120e] border transition-all duration-200 rounded-lg shadow-md overflow-hidden ${
                    isExpanded
                      ? 'border-amber-500/80 ring-1 ring-amber-500/20'
                      : isBranchTarget
                      ? 'border-[#3d271a] ml-4'
                      : 'border-[#5c3c2a] hover:border-[#8b5a2b]'
                  }`}
                >
                  {/* Card Header (Tap to toggle edit) */}
                  <div
                    onClick={() => setExpandedNodeId(isExpanded ? null : node.id)}
                    className="px-3 py-3.5 flex items-center justify-between cursor-pointer active:bg-[#251a14] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Node number badge */}
                      <span className="font-mono text-xs text-[#8b5a2b] font-bold">
                        #{index + 1}
                      </span>
                      {/* Icon */}
                      <span className="text-base select-none">
                        {NODE_TYPE_CONFIG.find(t => t.type === node.type)?.icon}
                      </span>
                      {/* Label & preview */}
                      <div className="min-w-0 flex flex-col">
                        <span className="text-[11px] font-bold text-[#e3d5b8]">
                          {NODE_TYPE_CONFIG.find(t => t.type === node.type)?.label}
                        </span>
                        {/* Inline preview */}
                        {!isExpanded && (
                          <span className="text-[9px] text-[#6d4c3d] truncate max-w-[200px] font-serif mt-0.5">
                            {node.type === 'text' && (node.data.text || '会話テキスト未入力')}
                            {node.type === 'battle' &&
                              `敵: ${
                                PRESET_ENEMIES.find(e => e.id === node.data.preset_enemy_id)?.name ||
                                node.data.preset_enemy_id ||
                                '未設定'
                              } (Lv ${node.data.enemy_level})`}
                            {node.type === 'delivery' &&
                              `納品: ${node.data.delivery_item_slug} × ${node.data.delivery_quantity}個`}
                            {node.type === 'trap' && `トラップ: ダメージ ${node.data.damage_pct}%`}
                            {node.type === 'success' && '成功ゴール'}
                            {node.type === 'failure' && '失敗エンド'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      {/* Move Up */}
                      <button
                        onClick={() => handleMoveNode(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-[#6d4c3d] hover:text-[#a38b6b] disabled:opacity-20 active:scale-95 min-w-[32px] min-h-[32px] flex items-center justify-center bg-[#0d0907]/60 border border-[#5c3c2a]/40 rounded"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      {/* Move Down */}
                      <button
                        onClick={() => handleMoveNode(index, 'down')}
                        disabled={index === nodes.length - 1}
                        className="p-1.5 text-[#6d4c3d] hover:text-[#a38b6b] disabled:opacity-20 active:scale-95 min-w-[32px] min-h-[32px] flex items-center justify-center bg-[#0d0907]/60 border border-[#5c3c2a]/40 rounded"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`ノード #${index + 1} を削除しますか？`)) {
                            handleDeleteNode(node.id);
                          }
                        }}
                        className="p-1.5 text-red-400/50 hover:text-red-400 active:scale-95 min-w-[32px] min-h-[32px] flex items-center justify-center bg-[#0d0907]/60 border border-[#5c3c2a]/40 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Editor Panel */}
                  {isExpanded && (
                    <div className="border-t border-[#5c3c2a] bg-[#1a120e] p-3 space-y-3.5 animate-in slide-in-from-top-1 duration-150">
                      {/* Text Node Editor */}
                      {node.type === 'text' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className={LABEL_CLS}>話者名</label>
                              <input
                                type="text"
                                value={node.data.speaker_name || ''}
                                onChange={e =>
                                  handleUpdateNodeData(node.id, {
                                    ...node.data,
                                    speaker_name: e.target.value,
                                  })
                                }
                                placeholder="話者..."
                                className={INPUT_CLS}
                              />
                            </div>
                            <div>
                              <label className={LABEL_CLS}>BGM</label>
                              <select
                                value={node.data.bgm_key || ''}
                                onChange={e =>
                                  handleUpdateNodeData(node.id, {
                                    ...node.data,
                                    bgm_key: e.target.value,
                                  })
                                }
                                className={SELECT_CLS}
                              >
                                <option value="">BGM選択...</option>
                                {BGM_OPTIONS.map(o => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className={LABEL_CLS}>背景</label>
                            <select
                              value={node.data.bg_key || ''}
                              onChange={e =>
                                handleUpdateNodeData(node.id, {
                                  ...node.data,
                                  bg_key: e.target.value,
                                })
                              }
                              className={SELECT_CLS}
                            >
                              <option value="">背景画像選択...</option>
                              {BG_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={LABEL_CLS}>本文テキスト</label>
                            <textarea
                              value={node.data.text || ''}
                              onChange={e =>
                                handleUpdateNodeData(node.id, {
                                  ...node.data,
                                  text: e.target.value,
                                })
                              }
                              placeholder="会話やナレーションの本文を入力してください（最大500文字）..."
                              rows={3}
                              className={`${INPUT_CLS} resize-none font-serif leading-relaxed text-[11px]`}
                            />
                          </div>

                          {/* Choices / Branches */}
                          <div className="space-y-2 border-t border-[#5c3c2a]/40 pt-2.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] text-[#8b5a2b] font-bold flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                選択肢（ルート分岐）
                              </label>
                              {(node.data.choices || []).length < 2 && (
                                <button
                                  onClick={() => handleAddChoice(node)}
                                  className="flex items-center gap-0.5 px-2 py-1 bg-[#2a1f14] hover:bg-[#3d2f21] border border-[#5c3c2a] rounded text-[9px] text-amber-400 font-bold active:scale-95"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  追加
                                </button>
                              )}
                            </div>

                            {/* Choices list */}
                            {(node.data.choices || []).map((choice, cIdx) => {
                              const choiceEdge = edges.find(
                                e => e.source === node.id && (e.handleIndex ?? 0) === cIdx,
                              );

                              return (
                                <div
                                  key={cIdx}
                                  className="bg-[#0d0907] border border-[#5c3c2a] rounded-lg p-2.5 space-y-2"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono text-[#a38b6b]">
                                      選択肢{cIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={choice.label}
                                      onChange={e => {
                                        const choices = [...(node.data.choices || [])];
                                        choices[cIdx] = { ...choices[cIdx], label: e.target.value };
                                        handleUpdateNodeData(node.id, {
                                          ...node.data,
                                          choices,
                                        });
                                      }}
                                      placeholder="選択肢のテキスト..."
                                      className={`${INPUT_CLS} flex-1`}
                                    />
                                    <button
                                      onClick={() => handleRemoveChoice(node, cIdx)}
                                      className="text-red-400/50 hover:text-red-400 p-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Transition target selector */}
                                  <div>
                                    <label className="block text-[8px] text-[#6d4c3d] font-bold mb-0.5">
                                      選択時の移動先
                                    </label>
                                    <select
                                      value={choiceEdge?.target || ''}
                                      onChange={e =>
                                        handleUpdateTransition(node.id, cIdx, e.target.value)
                                      }
                                      className={SELECT_CLS}
                                    >
                                      <option value="">（選択肢を選ぶと終了/自動遷移なし）</option>
                                      {getAvailableDestinations(node.id).map(dest => (
                                        <option key={dest.id} value={dest.id}>
                                          {dest.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Battle Node Editor */}
                      {node.type === 'battle' && (
                        <div className="space-y-3.5">
                          <div className="bg-[#0d0907] border border-[#5c3c2a] rounded-lg p-2.5 flex items-center justify-between">
                            <div>
                              <div className="text-[9px] text-[#8b5a2b] font-bold">
                                選択されたエネミー
                              </div>
                              <div className="text-xs font-bold text-[#e3d5b8] mt-0.5">
                                {PRESET_ENEMIES.find(e => e.id === node.data.preset_enemy_id)?.name ||
                                  node.data.preset_enemy_id ||
                                  '未選択'}
                              </div>
                            </div>
                            <button
                              onClick={() => setShowEnemyPickerForNodeId(node.id)}
                              className="px-2.5 py-1.5 bg-[#4e2f1d] hover:bg-[#613d28] border border-[#a38b6b]/40 rounded text-[10px] text-amber-300 font-bold active:scale-95"
                            >
                              変更する
                            </button>
                          </div>

                          {/* Trigger transition setup for single path node */}
                          <div className="border-t border-[#5c3c2a]/40 pt-2">
                            <label className={LABEL_CLS}>戦闘完了後の遷移先</label>
                            <select
                              value={edges.find(e => e.source === node.id && (e.handleIndex ?? 0) === 0)?.target || ''}
                              onChange={e => handleUpdateTransition(node.id, 0, e.target.value)}
                              className={SELECT_CLS}
                            >
                              <option value="">（完了後は次のノードへ自動進行）</option>
                              {getAvailableDestinations(node.id).map(dest => (
                                <option key={dest.id} value={dest.id}>
                                  {dest.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Enemy picker modal overlay */}
                          {showEnemyPickerForNodeId === node.id && (
                            <div className="fixed inset-0 z-50 bg-[#0d0907]/90 flex flex-col justify-end">
                              <div className="bg-[#1a120e] border-t border-[#5c3c2a] rounded-t-xl max-h-[85vh] flex flex-col">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-[#5c3c2a] shrink-0">
                                  <h3 className="text-xs font-bold text-amber-400">
                                    プリセットエネミーの選択
                                  </h3>
                                  <button
                                    onClick={() => setShowEnemyPickerForNodeId(null)}
                                    className="text-[#6d4c3d] hover:text-white text-xs font-bold px-2 py-1"
                                  >
                                    閉じる
                                  </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 bg-[#0d0907]">
                                  <PresetEnemyPicker
                                    selectedEnemyId={node.data.preset_enemy_id || ''}
                                    selectedLevel={node.data.enemy_level || 5}
                                    onSelect={enemyId => {
                                      handleUpdateNodeData(node.id, {
                                        ...node.data,
                                        preset_enemy_id: enemyId,
                                      });
                                    }}
                                    onLevelChange={level => {
                                      handleUpdateNodeData(node.id, {
                                        ...node.data,
                                        enemy_level: level,
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Delivery Node Editor */}
                      {node.type === 'delivery' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className={LABEL_CLS}>要求アイテム</label>
                              <select
                                value={node.data.delivery_item_slug || ''}
                                onChange={e =>
                                  handleUpdateNodeData(node.id, {
                                    ...node.data,
                                    delivery_item_slug: e.target.value,
                                  })
                                }
                                className={SELECT_CLS}
                              >
                                <option value="potion">🧪 傷薬</option>
                                <option value="herb">🌿 薬草</option>
                                <option value="antidote">🧪 解毒薬</option>
                                <option value="whetstone">⚔ 砥石</option>
                                <option value="goblin_ear">👂 ゴブリンの耳</option>
                                <option value="iron_ore">🪨 鉄鉱石</option>
                              </select>
                            </div>
                            <div>
                              <label className={LABEL_CLS}>必要数量 (1 - 10)</label>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={node.data.delivery_quantity || 1}
                                onChange={e =>
                                  handleUpdateNodeData(node.id, {
                                    ...node.data,
                                    delivery_quantity: Math.min(10, Math.max(1, Number(e.target.value))),
                                  })
                                }
                                className={INPUT_CLS}
                              />
                            </div>
                          </div>

                          <div className="border-t border-[#5c3c2a]/40 pt-2">
                            <label className={LABEL_CLS}>漏品完了後の遷移先</label>
                            <select
                              value={edges.find(e => e.source === node.id && (e.handleIndex ?? 0) === 0)?.target || ''}
                              onChange={e => handleUpdateTransition(node.id, 0, e.target.value)}
                              className={SELECT_CLS}
                            >
                              <option value="">（完了後は次のノードへ自動進行）</option>
                              {getAvailableDestinations(node.id).map(dest => (
                                <option key={dest.id} value={dest.id}>
                                  {dest.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Trap Node Editor */}
                      {node.type === 'trap' && (
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[9px] text-[#8b5a2b] font-bold">
                                HPダメージ割合 (1% - 99%)
                              </label>
                              <span className="text-xs font-bold text-amber-400">
                                {node.data.damage_pct || 10}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={99}
                              value={node.data.damage_pct || 10}
                              onChange={e =>
                                handleUpdateNodeData(node.id, {
                                  ...node.data,
                                  damage_pct: Number(e.target.value),
                                })
                              }
                              className="w-full accent-amber-500 h-1 bg-[#0d0907] rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          <div className="border-t border-[#5c3c2a]/40 pt-2">
                            <label className={LABEL_CLS}>トラップ通過後の遷移先</label>
                            <select
                              value={edges.find(e => e.source === node.id && (e.handleIndex ?? 0) === 0)?.target || ''}
                              onChange={e => handleUpdateTransition(node.id, 0, e.target.value)}
                              className={SELECT_CLS}
                            >
                              <option value="">（通過後は次のノードへ自動進行）</option>
                              {getAvailableDestinations(node.id).map(dest => (
                                <option key={dest.id} value={dest.id}>
                                  {dest.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Success / Failure Node Editors */}
                      {(node.type === 'success' || node.type === 'failure') && (
                        <p className="text-[10px] text-[#6d4c3d] italic">
                          このノードは終端ゴールです。追加のパラメータ設定はありません。
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Node Type Selector (Bottom action panel) */}
      <div className="bg-[#1a120e] border border-[#5c3c2a] rounded-lg p-3 space-y-2 mt-auto">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-400 tracking-wider">ノード追加</span>
          <span className="text-[9px] text-[#6d4c3d] font-bold">
            {nodes.length} / {MAX_NODES} ノード
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {NODE_TYPE_CONFIG.map(config => (
            <button
              key={config.type}
              onClick={() => handleAddNode(config.type)}
              disabled={nodes.length >= MAX_NODES}
              className={`flex flex-col items-center justify-center p-2.5 ${config.color} border border-[#5c3c2a]/60 hover:brightness-125 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-xs transition-all active:scale-95 min-h-[48px]`}
            >
              <span className="text-base mb-0.5">{config.icon}</span>
              <span className="text-[9px] font-bold text-[#e3d5b8]">{config.label.split('/')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const StepFlowBuilder = React.memo(StepFlowBuilderInner);
export default StepFlowBuilder;
