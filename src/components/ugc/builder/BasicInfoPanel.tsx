'use client';

import React, { useCallback, useMemo } from 'react';
import { X, Plus, Minus, Trash2, Package } from 'lucide-react';
import type { BuilderQuest } from '@/types/builder';
import { PRESET_REWARD_ITEMS } from '@/lib/ugc/builderPresets';

// ── Constants ──

const MAX_REWARD_ITEMS = 3;
const MAX_ITEM_QTY = 5;

// ── Shared styles ──

const INPUT_CLS =
  'w-full px-3 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-sm text-[#e3d5b8] placeholder-[#6d4c3d] focus:border-amber-400 focus:outline-none transition-colors';
const SELECT_CLS =
  'w-full px-3 py-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg text-sm text-[#e3d5b8] focus:border-amber-400 focus:outline-none transition-colors';
const LABEL_CLS = 'block text-[10px] text-[#8b5a2b] font-bold mb-1';

// ── Props ──

interface BasicInfoPanelProps {
  quest: BuilderQuest;
  onUpdate: (updates: Partial<BuilderQuest>) => void;
  onClose: () => void;
}

// ── Component ──

function BasicInfoPanelInner({ quest, onUpdate, onClose }: BasicInfoPanelProps) {
  // ── Quest field update helpers ──
  const setField = useCallback(
    <K extends keyof BuilderQuest>(key: K, value: BuilderQuest[K]) => {
      onUpdate({ [key]: value } as Partial<BuilderQuest>);
    },
    [onUpdate],
  );

  // ── Reward management ──
  const addRewardItem = useCallback(
    (slug: string) => {
      if (!slug) return;
      const items = [...quest.rewards.items];
      if (items.length >= MAX_REWARD_ITEMS) return;
      // Don't add duplicates
      if (items.some(i => i.slug === slug)) return;
      items.push({ slug, quantity: 1 });
      onUpdate({ rewards: { items } });
    },
    [quest.rewards.items, onUpdate],
  );

  const removeRewardItem = useCallback(
    (index: number) => {
      const items = [...quest.rewards.items];
      items.splice(index, 1);
      onUpdate({ rewards: { items } });
    },
    [quest.rewards.items, onUpdate],
  );

  const setRewardQuantity = useCallback(
    (index: number, qty: number) => {
      const items = [...quest.rewards.items];
      items[index] = { ...items[index], quantity: Math.min(MAX_ITEM_QTY, Math.max(1, qty)) };
      onUpdate({ rewards: { items } });
    },
    [quest.rewards.items, onUpdate],
  );

  // ── Power budget calc ──
  const powerBudget = useMemo(() => {
    const battleCount = quest.canvas.nodes.filter(n => n.type === 'battle').length;
    const nodeCount = quest.canvas.nodes.length;
    return quest.rec_level * 2 + battleCount * 5 + nodeCount * 1;
  }, [quest.rec_level, quest.canvas.nodes]);

  const totalPowerCost = useMemo(() => {
    return quest.rewards.items.reduce((sum, item) => {
      const preset = PRESET_REWARD_ITEMS.find(p => p.slug === item.slug);
      return sum + (preset?.power_cost ?? 0) * item.quantity;
    }, 0);
  }, [quest.rewards.items]);

  const budgetRatio = powerBudget > 0 ? totalPowerCost / powerBudget : 0;
  const budgetColor =
    budgetRatio > 1 ? 'bg-red-500' : budgetRatio >= 0.8 ? 'bg-yellow-500' : 'bg-emerald-500';
  const budgetTextColor =
    budgetRatio > 1 ? 'text-red-400' : budgetRatio >= 0.8 ? 'text-yellow-400' : 'text-emerald-400';

  // Available items for add dropdown (exclude already-added)
  const availableItems = useMemo(
    () => PRESET_REWARD_ITEMS.filter(p => !quest.rewards.items.some(i => i.slug === p.slug)),
    [quest.rewards.items],
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-[320px] max-w-[85vw] bg-[#1a120e] border-l border-[#5c3c2a] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#5c3c2a] shrink-0">
          <h2 className="text-sm font-bold text-amber-400 tracking-wider">基本情報・報酬</h2>
          <button
            onClick={onClose}
            className="p-2 text-[#6d4c3d] hover:text-[#a38b6b] transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body – scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* ── 基本情報 Section ── */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold text-[#a38b6b] tracking-wider border-b border-[#5c3c2a]/50 pb-1">
              基本情報
            </h3>

            {/* Title */}
            <div>
              <label className={LABEL_CLS}>タイトル</label>
              <input
                type="text"
                value={quest.title}
                onChange={e => setField('title', e.target.value)}
                placeholder="クエスト名を入力..."
                className={INPUT_CLS}
              />
            </div>

            {/* Short desc */}
            <div>
              <label className={LABEL_CLS}>概要</label>
              <input
                type="text"
                value={quest.short_description}
                onChange={e => setField('short_description', e.target.value)}
                placeholder="クエストの簡単な説明..."
                className={INPUT_CLS}
              />
            </div>

            {/* Client name */}
            <div>
              <label className={LABEL_CLS}>依頼人</label>
              <input
                type="text"
                value={quest.client_name}
                onChange={e => setField('client_name', e.target.value)}
                placeholder="依頼人名..."
                className={INPUT_CLS}
              />
            </div>

            {/* Type */}
            <div>
              <label className={LABEL_CLS}>種別</label>
              <select
                value={quest.scenario_type}
                onChange={e =>
                  setField('scenario_type', e.target.value as BuilderQuest['scenario_type'])
                }
                className={SELECT_CLS}
              >
                <option value="Subjugation">討伐</option>
                <option value="Delivery">納品</option>
                <option value="Politics">政治</option>
                <option value="Dungeon">探索</option>
                <option value="Other">その他</option>
              </select>
            </div>

            {/* Difficulty + Level row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={LABEL_CLS}>難度</label>
                <select
                  value={quest.difficulty}
                  onChange={e => setField('difficulty', Number(e.target.value))}
                  className={SELECT_CLS}
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{'★'.repeat(n)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>推奨Lv</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={quest.rec_level}
                  onChange={e =>
                    setField('rec_level', Math.min(30, Math.max(1, Number(e.target.value))))
                  }
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* Days row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={LABEL_CLS}>成功日数</label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={quest.days_success}
                  onChange={e =>
                    setField('days_success', Math.min(14, Math.max(1, Number(e.target.value))))
                  }
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>失敗日数</label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={quest.days_failure}
                  onChange={e =>
                    setField('days_failure', Math.min(14, Math.max(1, Number(e.target.value))))
                  }
                  className={INPUT_CLS}
                />
              </div>
            </div>
          </section>

          {/* ── 報酬アイテム Section ── */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold text-[#a38b6b] tracking-wider border-b border-[#5c3c2a]/50 pb-1">
              報酬アイテム
            </h3>

            {/* Add item dropdown */}
            {quest.rewards.items.length < MAX_REWARD_ITEMS && (
              <div>
                <select
                  value=""
                  onChange={e => addRewardItem(e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="">アイテムを追加...</option>
                  {availableItems.map(item => (
                    <option key={item.slug} value={item.slug}>
                      {item.name} — {item.effect_summary} (PC:{item.power_cost})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selected rewards list */}
            {quest.rewards.items.length === 0 && (
              <p className="text-[10px] text-[#6d4c3d] text-center py-2">
                報酬アイテムが設定されていません
              </p>
            )}

            {quest.rewards.items.map((item, idx) => {
              const preset = PRESET_REWARD_ITEMS.find(p => p.slug === item.slug);
              if (!preset) return null;
              return (
                <div
                  key={item.slug}
                  className="flex items-center gap-2 bg-[#0d0907] border border-[#5c3c2a] rounded-lg px-3 py-2"
                >
                  <Package className="w-4 h-4 text-[#a38b6b] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#e3d5b8] truncate">{preset.name}</div>
                    <div className="text-[10px] text-[#6d4c3d]">
                      PC: {preset.power_cost * item.quantity}
                    </div>
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setRewardQuantity(idx, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-1.5 text-[#a38b6b] hover:text-amber-400 transition-colors active:scale-95 disabled:opacity-30 min-w-[32px] min-h-[32px] flex items-center justify-center"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-[#e3d5b8] w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setRewardQuantity(idx, item.quantity + 1)}
                      disabled={item.quantity >= MAX_ITEM_QTY}
                      className="p-1.5 text-[#a38b6b] hover:text-amber-400 transition-colors active:scale-95 disabled:opacity-30 min-w-[32px] min-h-[32px] flex items-center justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeRewardItem(idx)}
                    className="p-1.5 text-red-400/50 hover:text-red-400 transition-colors active:scale-95 min-w-[32px] min-h-[32px] flex items-center justify-center shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Power Cost budget bar */}
            <div className="bg-[#0d0907] border border-[#5c3c2a] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#8b5a2b]">パワーコスト予算</span>
                <span className={`text-xs font-bold ${budgetTextColor}`}>
                  {totalPowerCost} / {powerBudget}
                </span>
              </div>
              <div className="w-full h-2 bg-[#2a1f14] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${budgetColor}`}
                  style={{ width: `${Math.min(100, budgetRatio * 100)}%` }}
                />
              </div>
              {budgetRatio > 1 && (
                <p className="text-[10px] text-red-400">
                  ⚠ 予算超過: コストを{totalPowerCost - powerBudget}削減してください
                </p>
              )}
            </div>

            {/* Fixed note */}
            <p className="text-[10px] text-[#6d4c3d] bg-[#0d0907] rounded-lg px-3 py-2 border border-[#5c3c2a]/50">
              ※ ゴールド50G・EXP30は固定付与
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

const BasicInfoPanel = React.memo(BasicInfoPanelInner);
export default BasicInfoPanel;
