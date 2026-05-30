'use client';

import React, { useState, useCallback, useRef } from 'react';
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
  BuilderNodeType,
  CanvasState,
} from '@/types/builder';

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

let nodeCounter = 0;
function generateNodeId(): string {
  nodeCounter += 1;
  return `node_${Date.now()}_${nodeCounter}`;
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

  // ── Canvas node management ──

  const addNode = useCallback((type: BuilderNodeType) => {
    const existingNodes = quest.canvas.nodes;
    // Place new nodes in a grid-like pattern
    const col = existingNodes.length % 3;
    const row = Math.floor(existingNodes.length / 3);
    const newNode: BuilderNode = {
      id: generateNodeId(),
      type,
      position: { x: 60 + col * 160, y: 60 + row * 140 },
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
  }, [quest.canvas.nodes]);

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

      {/* ── Info Panel (collapsible) ── */}
      {showInfoPanel && (
        <div className="bg-[#1a120e] border-b border-[#5c3c2a] px-4 py-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-amber-400 tracking-wider">基本情報</h2>
            <button
              onClick={() => setShowInfoPanel(false)}
              className="p-1 text-[#6d4c3d] hover:text-[#a38b6b] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] text-[#8b5a2b] font-bold mb-1">タイトル</label>
            <input
              type="text"
              value={quest.title}
              onChange={e => setQuest(prev => ({ ...prev, title: e.target.value }))}
              placeholder="クエスト名を入力..."
              className="w-full px-3 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-sm text-[#e3d5b8] placeholder-[#6d4c3d] focus:border-amber-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Short description */}
          <div>
            <label className="block text-[10px] text-[#8b5a2b] font-bold mb-1">概要</label>
            <input
              type="text"
              value={quest.short_description}
              onChange={e => setQuest(prev => ({ ...prev, short_description: e.target.value }))}
              placeholder="クエストの簡単な説明..."
              className="w-full px-3 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-sm text-[#e3d5b8] placeholder-[#6d4c3d] focus:border-amber-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Client + Type row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-[#8b5a2b] font-bold mb-1">依頼人</label>
              <input
                type="text"
                value={quest.client_name}
                onChange={e => setQuest(prev => ({ ...prev, client_name: e.target.value }))}
                placeholder="依頼人名..."
                className="w-full px-3 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-sm text-[#e3d5b8] placeholder-[#6d4c3d] focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#8b5a2b] font-bold mb-1">種別</label>
              <select
                value={quest.scenario_type}
                onChange={e => setQuest(prev => ({ ...prev, scenario_type: e.target.value as BuilderQuest['scenario_type'] }))}
                className="w-full px-3 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-sm text-[#e3d5b8] focus:border-amber-400 focus:outline-none transition-colors"
              >
                <option value="Subjugation">討伐</option>
                <option value="Delivery">納品</option>
                <option value="Politics">政治</option>
                <option value="Dungeon">探索</option>
                <option value="Other">その他</option>
              </select>
            </div>
          </div>

          {/* Difficulty + Level + Days row */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] text-[#8b5a2b] font-bold mb-1">難度</label>
              <select
                value={quest.difficulty}
                onChange={e => setQuest(prev => ({ ...prev, difficulty: Number(e.target.value) }))}
                className="w-full px-2 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-sm text-[#e3d5b8] focus:border-amber-400 focus:outline-none transition-colors"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{'★'.repeat(n)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#8b5a2b] font-bold mb-1">推奨Lv</label>
              <input
                type="number"
                min={1}
                max={30}
                value={quest.rec_level}
                onChange={e => setQuest(prev => ({ ...prev, rec_level: Math.min(30, Math.max(1, Number(e.target.value))) }))}
                className="w-full px-2 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-sm text-[#e3d5b8] focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#8b5a2b] font-bold mb-1">成功日</label>
              <input
                type="number"
                min={1}
                max={14}
                value={quest.days_success}
                onChange={e => setQuest(prev => ({ ...prev, days_success: Math.min(14, Math.max(1, Number(e.target.value))) }))}
                className="w-full px-2 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-sm text-[#e3d5b8] focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#8b5a2b] font-bold mb-1">失敗日</label>
              <input
                type="number"
                min={1}
                max={14}
                value={quest.days_failure}
                onChange={e => setQuest(prev => ({ ...prev, days_failure: Math.min(14, Math.max(1, Number(e.target.value))) }))}
                className="w-full px-2 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-sm text-[#e3d5b8] focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Canvas Area (placeholder) ── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Canvas background with grid */}
        <div className="absolute inset-0 bg-[#0d0907]" style={{
          backgroundImage: 'radial-gradient(circle, #5c3c2a20 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}>
          {quest.canvas.nodes.length === 0 ? (
            // Empty state
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-8">
              <div className="text-4xl opacity-30">🗺️</div>
              <p className="text-sm text-[#8b5a2b] font-serif">
                フローエディタを読み込み中...
              </p>
              <p className="text-[11px] text-[#6d4c3d] leading-relaxed">
                下のツールバーからノードを追加して<br />
                クエストのフローを組み立てましょう
              </p>
            </div>
          ) : (
            // Render nodes as simple cards (Phase 1 placeholder)
            <div className="absolute inset-0 overflow-auto p-4">
              <div className="flex flex-wrap gap-3">
                {quest.canvas.nodes.map(node => {
                  const config = NODE_TYPE_CONFIG.find(c => c.type === node.type);
                  if (!config) return null;
                  return (
                    <div
                      key={node.id}
                      className={`relative ${config.color} border ${config.borderColor} rounded-lg p-3 w-[140px] cursor-pointer transition-all hover:brightness-110 active:scale-95 ${
                        quest.canvas.selectedNodeId === node.id
                          ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/20'
                          : ''
                      }`}
                      onClick={() => setQuest(prev => ({
                        ...prev,
                        canvas: { ...prev.canvas, selectedNodeId: node.id },
                      }))}
                    >
                      {/* Delete button */}
                      <button
                        onClick={e => { e.stopPropagation(); removeNode(node.id); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-900 border border-red-600 rounded-full flex items-center justify-center text-red-300 hover:bg-red-800 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-base">{config.icon}</span>
                        <span className="text-[10px] font-bold text-[#a38b6b] uppercase tracking-wider">
                          {config.label}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#e3d5b8]/70 line-clamp-2">
                        {node.type === 'text' && (node.data.text || '（テキスト未入力）')}
                        {node.type === 'battle' && (node.data.preset_enemy_id || '（敵未選択）')}
                        {node.type === 'delivery' && (node.data.delivery_item_slug || '（アイテム未選択）')}
                        {node.type === 'trap' && `ダメージ ${node.data.damage_pct || 0}%`}
                        {node.type === 'success' && 'クエスト成功'}
                        {node.type === 'failure' && 'クエスト失敗'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Node count badge */}
        {nodeCount > 0 && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-[#1a120e]/90 border border-[#5c3c2a] rounded-md text-[10px] text-[#a38b6b] font-bold">
            {nodeCount} ノード
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
    </div>
  );
}
