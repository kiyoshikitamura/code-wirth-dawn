'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { X, GripHorizontal, Plus, Trash2 } from 'lucide-react';
import type { BuilderNode, BuilderNodeData, BuilderEdge } from '@/types/builder';
import {
  BUILDER_BG_OPTIONS,
  BUILDER_BGM_OPTIONS,
  PRESET_REWARD_ITEMS,
} from '@/lib/ugc/builderPresets';
import PresetEnemyPicker from './PresetEnemyPicker';

// ── Constants ──

const MAX_TEXT_CHARS = 500;
const MAX_CHOICES = 2;

// ── Node type labels ──

const NODE_TYPE_LABELS: Record<string, { icon: string; label: string }> = {
  text:     { icon: '📝', label: 'テキスト' },
  battle:   { icon: '⚔️', label: 'バトル' },
  delivery: { icon: '📦', label: '納品' },
  trap:     { icon: '⚠️', label: 'トラップ' },
  success:  { icon: '🏁', label: '成功' },
  failure:  { icon: '💀', label: '失敗' },
};

// ── Group dropdown options by category ──

function groupByCategory<T extends { category: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const existing = map.get(item.category) ?? [];
    existing.push(item);
    map.set(item.category, existing);
  }
  return map;
}

// ── Props ──

interface NodeEditSheetProps {
  node: BuilderNode | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: BuilderNodeData) => void;
  edges: BuilderEdge[];
  nodes: BuilderNode[];
}

// ── Shared input styles ──

const INPUT_CLS =
  'w-full px-3 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-sm text-[#e3d5b8] placeholder-[#6d4c3d] focus:border-amber-400 focus:outline-none transition-colors';
const SELECT_CLS =
  'w-full px-3 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-sm text-[#e3d5b8] focus:border-amber-400 focus:outline-none transition-colors';
const LABEL_CLS = 'block text-[10px] text-[#8b5a2b] font-bold mb-1';

// ── Component ──

function NodeEditSheetInner({
  node,
  onClose,
  onUpdate,
  edges,
  nodes,
}: NodeEditSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset expanded state when node changes
  useEffect(() => {
    setIsExpanded(false);
  }, [node?.id]);

  // ── Data update helper ──
  const updateField = useCallback(
    <K extends keyof BuilderNodeData>(field: K, value: BuilderNodeData[K]) => {
      if (!node) return;
      onUpdate(node.id, { ...node.data, [field]: value });
    },
    [node, onUpdate],
  );

  // ── Choice management ──
  const updateChoice = useCallback(
    (index: number, patch: Partial<{ label: string; next: string }>) => {
      if (!node) return;
      const choices = [...(node.data.choices ?? [])];
      choices[index] = { ...choices[index], ...patch };
      onUpdate(node.id, { ...node.data, choices });
    },
    [node, onUpdate],
  );

  const addChoice = useCallback(() => {
    if (!node) return;
    const choices = [...(node.data.choices ?? [])];
    if (choices.length >= MAX_CHOICES) return;
    choices.push({ label: '', next: '' });
    onUpdate(node.id, { ...node.data, choices });
  }, [node, onUpdate]);

  const removeChoice = useCallback(
    (index: number) => {
      if (!node) return;
      const choices = [...(node.data.choices ?? [])];
      choices.splice(index, 1);
      onUpdate(node.id, { ...node.data, choices });
    },
    [node, onUpdate],
  );

  // ── Drag handle to expand/collapse ──
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleDragEnd = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartY.current === null) return;
      const dy = e.clientY - dragStartY.current;
      if (dy < -40) {
        setIsExpanded(true);
      } else if (dy > 40) {
        if (isExpanded) {
          setIsExpanded(false);
        } else {
          onClose();
        }
      }
      dragStartY.current = null;
    },
    [isExpanded, onClose],
  );

  // ── Grouped options (memoized) ──
  const bgGroups = useMemo(() => groupByCategory(BUILDER_BG_OPTIONS), []);
  const bgmGroups = useMemo(() => groupByCategory(BUILDER_BGM_OPTIONS), []);

  // Available target nodes (exclude current node and end nodes for choices)
  const targetNodeOptions = useMemo(() => {
    if (!node) return [];
    return nodes.filter(n => n.id !== node.id);
  }, [node, nodes]);

  // ── Type label ──
  const typeInfo = node ? NODE_TYPE_LABELS[node.type] ?? { icon: '❓', label: 'ノード' } : null;

  const isVisible = node !== null;

  return (
    <>
      {/* Backdrop */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed inset-x-0 bottom-0 z-50 bg-[#1a120e] border-t border-[#5c3c2a] rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          height: isExpanded ? '95vh' : '60vh',
          maxHeight: '95vh',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handleDragStart}
          onPointerUp={handleDragEnd}
        >
          <div className="w-10 h-1 bg-[#5c3c2a] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-[#5c3c2a]/50">
          <div className="flex items-center gap-2">
            {typeInfo && <span className="text-base">{typeInfo.icon}</span>}
            <h3 className="text-sm font-bold text-amber-400">
              {typeInfo?.label ?? ''} ノード編集
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6d4c3d] hover:text-[#a38b6b] transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body – scrollable */}
        <div className="overflow-y-auto px-4 py-3 space-y-4" style={{ height: 'calc(100% - 70px)' }}>
          {node?.type === 'text' && (
            <TextNodeEditor
              data={node.data}
              updateField={updateField}
              bgGroups={bgGroups}
              bgmGroups={bgmGroups}
              choices={node.data.choices ?? []}
              onAddChoice={addChoice}
              onRemoveChoice={removeChoice}
              onUpdateChoice={updateChoice}
              targetNodes={targetNodeOptions}
            />
          )}
          {node?.type === 'battle' && (
            <BattleNodeEditor data={node.data} updateField={updateField} />
          )}
          {node?.type === 'delivery' && (
            <DeliveryNodeEditor data={node.data} updateField={updateField} />
          )}
          {node?.type === 'trap' && (
            <TrapNodeEditor data={node.data} updateField={updateField} />
          )}
          {(node?.type === 'success' || node?.type === 'failure') && (
            <EndNodeEditor data={node.data} type={node.type} updateField={updateField} />
          )}
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────
// Sub-editors per node type
// ────────────────────────────────────────────────

// ── Text node ──

interface TextNodeEditorProps {
  data: BuilderNodeData;
  updateField: <K extends keyof BuilderNodeData>(field: K, value: BuilderNodeData[K]) => void;
  bgGroups: Map<string, { key: string; label: string; icon: string; category: string }[]>;
  bgmGroups: Map<string, { key: string; label: string; icon: string; category: string }[]>;
  choices: { label: string; next: string }[];
  onAddChoice: () => void;
  onRemoveChoice: (index: number) => void;
  onUpdateChoice: (index: number, patch: Partial<{ label: string; next: string }>) => void;
  targetNodes: BuilderNode[];
}

function TextNodeEditor({
  data,
  updateField,
  bgGroups,
  bgmGroups,
  choices,
  onAddChoice,
  onRemoveChoice,
  onUpdateChoice,
  targetNodes,
}: TextNodeEditorProps) {
  const textLen = data.text?.length ?? 0;

  return (
    <>
      {/* Speaker name */}
      <div>
        <label className={LABEL_CLS}>話者名</label>
        <input
          type="text"
          value={data.speaker_name ?? ''}
          onChange={e => updateField('speaker_name', e.target.value)}
          placeholder="話者の名前..."
          className={INPUT_CLS}
        />
      </div>

      {/* BG dropdown */}
      <div>
        <label className={LABEL_CLS}>背景</label>
        <select
          value={data.bg_key ?? ''}
          onChange={e => updateField('bg_key', e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">背景なし</option>
          {Array.from(bgGroups.entries()).map(([category, items]) => (
            <optgroup key={category} label={category}>
              {items.map(item => (
                <option key={item.key} value={item.key}>
                  {item.icon} {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* BGM dropdown */}
      <div>
        <label className={LABEL_CLS}>BGM</label>
        <select
          value={data.bgm_key ?? ''}
          onChange={e => updateField('bgm_key', e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">BGMなし</option>
          {Array.from(bgmGroups.entries()).map(([category, items]) => (
            <optgroup key={category} label={category}>
              {items.map(item => (
                <option key={item.key} value={item.key}>
                  {item.icon} {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Text area */}
      <div>
        <label className={LABEL_CLS}>テキスト</label>
        <textarea
          value={data.text ?? ''}
          onChange={e => {
            if (e.target.value.length <= MAX_TEXT_CHARS) {
              updateField('text', e.target.value);
            }
          }}
          placeholder="テキストを入力..."
          rows={4}
          className={`${INPUT_CLS} resize-none`}
        />
        <div className="text-right text-[10px] text-[#6d4c3d] mt-0.5">
          <span className={textLen > MAX_TEXT_CHARS * 0.9 ? 'text-amber-400' : ''}>{textLen}</span>
          /{MAX_TEXT_CHARS}
        </div>
      </div>

      {/* Choices */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={LABEL_CLS}>分岐選択肢</label>
          {choices.length < MAX_CHOICES && (
            <button
              onClick={onAddChoice}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 rounded-md border border-amber-400/30 hover:bg-amber-400/20 transition-colors active:scale-95 min-h-[44px]"
            >
              <Plus className="w-3 h-3" />
              分岐を追加
            </button>
          )}
        </div>

        {choices.map((choice, idx) => (
          <div key={idx} className="flex gap-2 items-start bg-[#0d0907] border border-[#5c3c2a] rounded-lg p-2.5">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={choice.label}
                onChange={e => onUpdateChoice(idx, { label: e.target.value })}
                placeholder={`選択肢${idx + 1}のラベル...`}
                className={INPUT_CLS}
              />
              <select
                value={choice.next}
                onChange={e => onUpdateChoice(idx, { next: e.target.value })}
                className={SELECT_CLS}
              >
                <option value="">遷移先を選択...</option>
                {targetNodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {NODE_TYPE_LABELS[n.type]?.icon ?? '❓'} {n.data.speaker_name || n.data.text?.slice(0, 15) || n.type} ({n.id.slice(-6)})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => onRemoveChoice(idx)}
              className="p-2 text-red-400/60 hover:text-red-400 transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {choices.length === 0 && (
          <p className="text-[10px] text-[#6d4c3d]">分岐なし（デフォルトの接続で次のノードへ進みます）</p>
        )}
      </div>
    </>
  );
}

// ── Battle node ──

interface BattleNodeEditorProps {
  data: BuilderNodeData;
  updateField: <K extends keyof BuilderNodeData>(field: K, value: BuilderNodeData[K]) => void;
}

function BattleNodeEditor({ data, updateField }: BattleNodeEditorProps) {
  return (
    <PresetEnemyPicker
      selectedEnemyId={data.preset_enemy_id ?? ''}
      selectedLevel={data.enemy_level ?? 5}
      onSelect={id => updateField('preset_enemy_id', id)}
      onLevelChange={lv => updateField('enemy_level', lv)}
    />
  );
}

// ── Delivery node ──

interface DeliveryNodeEditorProps {
  data: BuilderNodeData;
  updateField: <K extends keyof BuilderNodeData>(field: K, value: BuilderNodeData[K]) => void;
}

function DeliveryNodeEditor({ data, updateField }: DeliveryNodeEditorProps) {
  return (
    <>
      <div>
        <label className={LABEL_CLS}>納品アイテム</label>
        <select
          value={data.delivery_item_slug ?? ''}
          onChange={e => updateField('delivery_item_slug', e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">アイテムを選択...</option>
          {PRESET_REWARD_ITEMS.map(item => (
            <option key={item.slug} value={item.slug}>
              {item.name} — {item.effect_summary}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLS}>個数</label>
        <input
          type="number"
          min={1}
          max={10}
          value={data.delivery_quantity ?? 1}
          onChange={e =>
            updateField(
              'delivery_quantity',
              Math.min(10, Math.max(1, Number(e.target.value))),
            )
          }
          className={INPUT_CLS}
        />
      </div>
    </>
  );
}

// ── Trap node ──

interface TrapNodeEditorProps {
  data: BuilderNodeData;
  updateField: <K extends keyof BuilderNodeData>(field: K, value: BuilderNodeData[K]) => void;
}

function TrapNodeEditor({ data, updateField }: TrapNodeEditorProps) {
  const dmg = data.damage_pct ?? 10;

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={LABEL_CLS}>ダメージ（% HP）</label>
          <span className="text-xs font-bold text-amber-400">{dmg}%</span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={dmg}
          onChange={e => updateField('damage_pct', Number(e.target.value))}
          className="w-full h-2 bg-[#2a1f14] rounded-lg appearance-none cursor-pointer accent-amber-400"
          style={{ minHeight: '44px' }}
        />
        <div className="flex justify-between text-[10px] text-[#6d4c3d] mt-1">
          <span>1%</span>
          <span>100%</span>
        </div>
      </div>
    </>
  );
}

// ── End node (success/failure) ──

interface EndNodeEditorProps {
  data: BuilderNodeData;
  type: 'success' | 'failure';
  updateField: <K extends keyof BuilderNodeData>(field: K, value: BuilderNodeData[K]) => void;
}

function EndNodeEditor({ data, type, updateField }: EndNodeEditorProps) {
  return (
    <>
      <div className={`text-center py-4 rounded-lg border ${
        type === 'success'
          ? 'bg-emerald-900/20 border-emerald-700/30 text-emerald-400'
          : 'bg-red-900/20 border-red-700/30 text-red-400'
      }`}>
        <span className="text-2xl">{type === 'success' ? '🏁' : '💀'}</span>
        <p className="text-sm font-bold mt-1">
          {type === 'success' ? 'クエスト成功' : 'クエスト失敗'}
        </p>
      </div>

      <div>
        <label className={LABEL_CLS}>結果テキスト（任意）</label>
        <textarea
          value={data.text ?? ''}
          onChange={e => updateField('text', e.target.value)}
          placeholder="エンディングの演出テキスト..."
          rows={3}
          className={`${INPUT_CLS} resize-none`}
        />
      </div>
    </>
  );
}

const NodeEditSheet = React.memo(NodeEditSheetInner);
export default NodeEditSheet;
