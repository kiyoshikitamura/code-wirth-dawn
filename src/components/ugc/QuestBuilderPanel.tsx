'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  Settings,
  Plus,
  FileText,
  Swords,
  Package,
  AlertTriangle,
  Flag,
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react';
import type {
  BuilderQuest,
  BuilderNode,
  BuilderEdge,
  BuilderNodeType,
  BuilderNodeData,
  CanvasState,
} from '@/types/builder';
import FlowCanvas from './builder/FlowCanvas';
import FlowMinimap from './builder/FlowMinimap';
import NodeEditSheet from './builder/NodeEditSheet';
import BasicInfoPanel from './builder/BasicInfoPanel';

// ── Default State Factories ──

function createDefaultCanvasState(): CanvasState {
  return {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedNodeId: null,
    draggingNodeId: null,
    connectingFromId: null,
  };
}

function createDefaultQuest(): BuilderQuest {
  return {
    title: '',
    short_description: '',
    client_name: '',
    scenario_type: 'Other',
    difficulty: 3,
    rec_level: 5,
    days_success: 3,
    days_failure: 5,
    conditions: {},
    rewards: { items: [] },
    canvas: createDefaultCanvasState(),
  };
}

// ── Node Type Config ──

const NODE_TYPE_CONFIG: {
  type: BuilderNodeType;
  label: string;
  icon: string;
  color: string;
  borderColor: string;
}[] = [
  { type: 'text',     label: 'テキスト', icon: '📝', color: 'bg-[#2a1f14]', borderColor: 'border-amber-700' },
  { type: 'battle',   label: 'バトル',   icon: '⚔️', color: 'bg-[#2a1414]', borderColor: 'border-red-700' },
  { type: 'delivery', label: '納品',     icon: '📦', color: 'bg-[#142a1a]', borderColor: 'border-emerald-700' },
  { type: 'trap',     label: 'トラップ', icon: '⚠️', color: 'bg-[#2a2514]', borderColor: 'border-yellow-700' },
  { type: 'success',  label: '成功',     icon: '🏁', color: 'bg-[#14201a]', borderColor: 'border-green-600' },
  { type: 'failure',  label: '失敗',     icon: '💀', color: 'bg-[#2a1818]', borderColor: 'border-red-600' },
];

// ── Helpers ──

const MAX_NODES = 20;

let nodeCounter = 0;
function generateNodeId(): string {
  nodeCounter += 1;
  return `node_${Date.now()}_${nodeCounter}`;
}

let edgeCounter = 0;
function generateEdgeId(): string {
  edgeCounter += 1;
  return `edge_${Date.now()}_${edgeCounter}`;
}

function getDefaultNodeData(type: BuilderNodeType): BuilderNode['data'] {
  switch (type) {
    case 'text':
      return { text: '', speaker_name: '', choices: [] };
    case 'battle':
      return { preset_enemy_id: '', enemy_level: 5 };
    case 'delivery':
      return { delivery_item_slug: '', delivery_quantity: 1 };
    case 'trap':
      return { damage_pct: 10 };
    case 'success':
      return { result: 'success' };
    case 'failure':
      return { result: 'failure' };
    default:
      return {};
  }
}

// ── Main Component ──

interface QuestBuilderPanelProps {
  onSaveSuccess?: () => void;
  onBack?: () => void;
}

export default function QuestBuilderPanel({ onSaveSuccess, onBack }: QuestBuilderPanelProps) {
  const [quest, setQuest] = useState<BuilderQuest>(createDefaultQuest);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 390, height: 500 });

  // Track canvas container size for minimap
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Canvas node management ──

  const addNode = useCallback((type: BuilderNodeType) => {
    const existingNodes = quest.canvas.nodes;
    if (existingNodes.length >= MAX_NODES) {
      alert(`ノード数上限（${MAX_NODES}個）に達しました`);
      return;
    }
    // Place new nodes in a grid-like pattern, accounting for viewport
    const vp = quest.canvas.viewport;
    const col = existingNodes.length % 3;
    const row = Math.floor(existingNodes.length / 3);
    const baseX = (-vp.x / vp.zoom) + 60;
    const baseY = (-vp.y / vp.zoom) + 60;
    const newNode: BuilderNode = {
      id: generateNodeId(),
      type,
      position: {
        x: Math.round((baseX + col * 160) / 20) * 20,
        y: Math.round((baseY + row * 140) / 20) * 20,
      },
      data: getDefaultNodeData(type),
    };
    setQuest(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        nodes: [...prev.canvas.nodes, newNode],
        selectedNodeId: newNode.id,
      },
    }));
  }, [quest.canvas.nodes, quest.canvas.viewport]);

  const removeNode = useCallback((nodeId: string) => {
    setQuest(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        nodes: prev.canvas.nodes.filter(n => n.id !== nodeId),
        edges: prev.canvas.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
        selectedNodeId: prev.canvas.selectedNodeId === nodeId ? null : prev.canvas.selectedNodeId,
      },
    }));
  }, []);

  // ── Edge management ──

  const handleEdgeCreate = useCallback(
    (source: string, target: string, handleIndex?: number) => {
      // Prevent duplicate edges from same source+handle
      setQuest(prev => {
        const exists = prev.canvas.edges.some(
          (e) => e.source === source && e.target === target && e.handleIndex === (handleIndex ?? 0),
        );
        if (exists) return prev;
        // Prevent self-loops
        if (source === target) return prev;
        const newEdge: BuilderEdge = {
          id: generateEdgeId(),
          source,
          target,
          handleIndex: handleIndex ?? 0,
        };
        return {
          ...prev,
          canvas: {
            ...prev.canvas,
            edges: [...prev.canvas.edges, newEdge],
          },
        };
      });
    },
    [],
  );

  const handleEdgeRemove = useCallback((edgeId: string) => {
    setQuest(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        edges: prev.canvas.edges.filter(e => e.id !== edgeId),
      },
    }));
  }, []);

  // ── Node move handler ──

  const handleNodeMove = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      setQuest(prev => ({
        ...prev,
        canvas: {
          ...prev.canvas,
          nodes: prev.canvas.nodes.map(n =>
            n.id === nodeId ? { ...n, position } : n,
          ),
        },
      }));
    },
    [],
  );

  // ── Node select handler ──

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setQuest(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        selectedNodeId: nodeId,
      },
    }));
  }, []);

  // ── Node data update handler (Phase 3) ──

  const handleNodeDataUpdate = useCallback(
    (nodeId: string, data: BuilderNodeData) => {
      setQuest(prev => ({
        ...prev,
        canvas: {
          ...prev.canvas,
          nodes: prev.canvas.nodes.map(n =>
            n.id === nodeId ? { ...n, data } : n,
          ),
        },
      }));
    },
    [],
  );

  // ── Quest metadata update handler (Phase 3) ──

  const handleQuestUpdate = useCallback(
    (updates: Partial<BuilderQuest>) => {
      setQuest(prev => ({ ...prev, ...updates }));
    },
    [],
  );

  // ── Viewport change handler ──

  const handleViewportChange = useCallback(
    (vp: { x: number; y: number; zoom: number }) => {
      setQuest(prev => ({
        ...prev,
        canvas: {
          ...prev.canvas,
          viewport: vp,
        },
      }));
    },
    [],
  );

  // ── Minimap viewport jump ──

  const handleMinimapJump = useCallback(
    (worldX: number, worldY: number) => {
      const zoom = quest.canvas.viewport.zoom;
      setQuest(prev => ({
        ...prev,
        canvas: {
          ...prev.canvas,
          viewport: {
            ...prev.canvas.viewport,
            x: -worldX * zoom + canvasSize.width / 2,
            y: -worldY * zoom + canvasSize.height / 2,
          },
        },
      }));
    },
    [quest.canvas.viewport.zoom, canvasSize],
  );

  // ── Save placeholder ──

  const handleSave = useCallback(async () => {
    setSaving(true);
    setShowSaveMenu(false);
    try {
      // TODO: Phase 2 - Convert BuilderQuest to ScenarioDB format and POST to /api/ugc/v2/import
      await new Promise(resolve => setTimeout(resolve, 500));
      onSaveSuccess?.();
    } catch (e) {
      console.error('[QuestBuilder] Save error:', e);
    } finally {
      setSaving(false);
    }
  }, [onSaveSuccess]);

  const handleValidate = useCallback(() => {
    setShowSaveMenu(false);
    // TODO: Phase 2 - Validate quest structure
    const errors: string[] = [];
    if (!quest.title.trim()) errors.push('タイトルが未入力です');
    if (quest.canvas.nodes.length === 0) errors.push('ノードが1つもありません');
    const hasEnd = quest.canvas.nodes.some(n => n.type === 'success' || n.type === 'failure');
    if (!hasEnd) errors.push('終了ノード（成功/失敗）がありません');

    if (errors.length > 0) {
      alert('検証エラー:\n' + errors.join('\n'));
    } else {
      alert('✅ 検証OK: 基本構造に問題はありません');
    }
  }, [quest]);

  // ── Node count summary ──
  const nodeCount = quest.canvas.nodes.length;

  // ── Selected node for NodeEditSheet ──
  const selectedNode = useMemo(
    () => quest.canvas.nodes.find(n => n.id === quest.canvas.selectedNodeId) ?? null,
    [quest.canvas.nodes, quest.canvas.selectedNodeId],
  );

  return (
    <div className="min-h-screen bg-[#0d0907] text-[#e3d5b8] flex flex-col">
      {/* ── Header Bar ── */}
      <div className="bg-[#1a120e] border-b border-[#5c3c2a] px-3 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 text-[#a38b6b] hover:text-white transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-serif font-bold tracking-wider text-amber-400">
            簡易クエスト作成
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 基本情報 toggle */}
          <button
            onClick={() => setShowInfoPanel(p => !p)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors active:scale-95 ${
              showInfoPanel
                ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                : 'bg-[#2a1f14] text-[#a38b6b] border border-[#5c3c2a] hover:text-amber-400'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            基本情報
          </button>

          {/* 保存▼ dropdown */}
          <div className="relative" ref={saveMenuRef}>
            <button
              onClick={() => setShowSaveMenu(p => !p)}
              disabled={saving}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#4e2f1d] hover:bg-[#613d28] border border-[#a38b6b]/40 rounded-lg text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              保存
              <ChevronDown className="w-3 h-3" />
            </button>

            {showSaveMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a120e] border border-[#5c3c2a] rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handleValidate}
                  className="w-full px-3 py-2.5 text-left text-xs text-[#e3d5b8] hover:bg-[#2a1f14] transition-colors flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  検証する
                </button>
                <div className="border-t border-[#5c3c2a]/50" />
                <button
                  onClick={handleSave}
                  className="w-full px-3 py-2.5 text-left text-xs text-[#e3d5b8] hover:bg-[#2a1f14] transition-colors flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  下書き保存
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BasicInfoPanel (side overlay, Phase 3) ── */}
      {showInfoPanel && (
        <BasicInfoPanel
          quest={quest}
          onUpdate={handleQuestUpdate}
          onClose={() => setShowInfoPanel(false)}
        />
      )}

      {/* ── Canvas Area ── */}
      <div ref={canvasContainerRef} className="flex-1 relative overflow-hidden">
        {quest.canvas.nodes.length === 0 ? (
          // Empty state
          <div className="absolute inset-0 bg-[#0d0907] flex flex-col items-center justify-center gap-3 text-center px-8 z-10" style={{
            backgroundImage: 'radial-gradient(circle, #5c3c2a20 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}>
            <div className="text-4xl opacity-30">🗺️</div>
            <p className="text-sm text-[#8b5a2b] font-serif">
              フローエディタ
            </p>
            <p className="text-[11px] text-[#6d4c3d] leading-relaxed">
              下のツールバーからノードを追加して<br />
              クエストのフローを組み立てましょう
            </p>
          </div>
        ) : (
          <>
            <FlowCanvas
              nodes={quest.canvas.nodes}
              edges={quest.canvas.edges}
              viewport={quest.canvas.viewport}
              selectedNodeId={quest.canvas.selectedNodeId}
              onNodeMove={handleNodeMove}
              onNodeSelect={handleNodeSelect}
              onNodeDelete={removeNode}
              onEdgeCreate={handleEdgeCreate}
              onEdgeDelete={handleEdgeRemove}
              onViewportChange={handleViewportChange}
            />

            {/* Minimap overlay */}
            <FlowMinimap
              nodes={quest.canvas.nodes}
              edges={quest.canvas.edges}
              viewport={quest.canvas.viewport}
              canvasSize={canvasSize}
              onViewportJump={handleMinimapJump}
            />
          </>
        )}

        {/* Node count badge */}
        {nodeCount > 0 && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-[#1a120e]/90 border border-[#5c3c2a] rounded-md text-[10px] text-[#a38b6b] font-bold z-20">
            {nodeCount}/{MAX_NODES} ノード
          </div>
        )}
      </div>

      {/* ── Bottom Toolbar (fixed on mobile) ── */}
      <div className="shrink-0 bg-[#1a120e] border-t border-[#5c3c2a] px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        {/* Label */}
        <div className="flex items-center gap-1.5 mb-2">
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-bold text-amber-400 tracking-wider">ノード追加</span>
        </div>

        {/* Node type buttons */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {NODE_TYPE_CONFIG.map(config => (
            <button
              key={config.type}
              onClick={() => addNode(config.type)}
              className={`flex items-center gap-1.5 px-3 py-2.5 ${config.color} border ${config.borderColor} rounded-lg text-[11px] font-bold text-[#e3d5b8] hover:brightness-125 transition-all active:scale-95 whitespace-nowrap min-w-[44px] min-h-[44px] justify-center`}
            >
              <span className="text-base">{config.icon}</span>
              <span className="hidden xs:inline">{config.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Click-away overlay for save menu ── */}
      {showSaveMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSaveMenu(false)}
        />
      )}

      {/* ── NodeEditSheet (Phase 3) ── */}
      <NodeEditSheet
        node={selectedNode}
        onClose={() => handleNodeSelect(null)}
        onUpdate={handleNodeDataUpdate}
        edges={quest.canvas.edges}
        nodes={quest.canvas.nodes}
      />
    </div>
  );
}
