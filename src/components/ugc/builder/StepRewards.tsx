'use client';

import React, { useCallback, useMemo } from 'react';
import { Plus, Minus, Trash2, Package } from 'lucide-react';
import type { BuilderQuest } from '@/types/builder';
import { PRESET_REWARD_ITEMS } from '@/lib/ugc/builderPresets';

const MAX_REWARD_ITEMS = 3;
const MAX_ITEM_QTY = 5;

const SELECT_CLS =
  'w-full px-3 py-3 bg-[#1a120e] border border-[#5c3c2a] rounded-lg text-sm text-[#e3d5b8] focus:border-amber-400 focus:outline-none transition-colors min-h-[44px]';

interface StepRewardsProps {
  quest: BuilderQuest;
  onUpdate: (updates: Partial<BuilderQuest>) => void;
  nodeCount: number;
  battleCount: number;
}

function StepRewardsInner({ quest, onUpdate, nodeCount, battleCount }: StepRewardsProps) {
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
    return quest.rec_level * 2 + battleCount * 5 + nodeCount * 1;
  }, [quest.rec_level, battleCount, nodeCount]);

  const totalPowerCost = useMemo(() => {
    return quest.rewards.items.reduce((sum, item) => {
      const preset = PRESET_REWARD_ITEMS.find(p => p.slug === item.slug);
      return sum + (preset?.power_cost ?? 0) * item.quantity;
    }, 0);
  }, [quest.rewards.items]);

  const budgetRatio = powerBudget > 0 ? totalPowerCost / powerBudget : 0;
  const budgetColor =
    budgetRatio > 1 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : budgetRatio >= 0.8 ? 'bg-yellow-500' : 'bg-emerald-500';
  const budgetTextColor =
    budgetRatio > 1 ? 'text-red-400 font-bold animate-pulse' : budgetRatio >= 0.8 ? 'text-yellow-400' : 'text-emerald-400';

  const availableItems = useMemo(
    () => PRESET_REWARD_ITEMS.filter(p => !quest.rewards.items.some(i => i.slug === p.slug)),
    [quest.rewards.items],
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 max-w-md mx-auto w-full">
      <div className="space-y-1">
        <h2 className="text-sm font-serif font-bold text-amber-400">🎁 報酬アイテムの設定</h2>
        <p className="text-[11px] text-[#6d4c3d] leading-relaxed">
          クエスト完了時にプレイヤーに与えられる報酬を設定します。推奨レベルやフロー内のノード数に応じて「パワー予算」が増加します。最大3種類まで。
        </p>
      </div>

      {/* Power Cost budget bar */}
      <div className="bg-[#1a120e] border border-[#5c3c2a] rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#8b5a2b]">パワーコスト予算</span>
          <span className={`text-xs font-mono font-bold ${budgetTextColor}`}>
            {totalPowerCost} / {powerBudget}
          </span>
        </div>
        <div className="w-full h-2 bg-[#0d0907] border border-[#5c3c2a]/30 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${budgetColor}`}
            style={{ width: `${Math.min(100, budgetRatio * 100)}%` }}
          />
        </div>
        {budgetRatio > 1 && (
          <p className="text-[10px] text-red-400">
            ⚠ 予算超過しています。報酬を減らすか、クエストの推奨Lv・バトルノード数を増やすことでパワー予算が上がります。
          </p>
        )}
      </div>

      {/* Add item dropdown */}
      {quest.rewards.items.length < MAX_REWARD_ITEMS && (
        <div className="space-y-1.5">
          <label className="block text-[10px] text-[#8b5a2b] font-bold">アイテムを追加</label>
          <select
            value=""
            onChange={e => addRewardItem(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">アイテムを選択して追加...</option>
            {availableItems.map(item => (
              <option key={item.slug} value={item.slug}>
                {item.name} — {item.effect_summary} (PC:{item.power_cost})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selected rewards list */}
      <div className="space-y-2.5">
        <label className="block text-[10px] text-[#8b5a2b] font-bold">設定中の報酬</label>
        {quest.rewards.items.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[#5c3c2a]/40 bg-[#1a120e]/30 rounded-lg">
            <Package className="w-6 h-6 text-[#6d4c3d] mx-auto mb-1.5 opacity-50" />
            <p className="text-[11px] text-[#6d4c3d]">
              報酬アイテムが設定されていません
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {quest.rewards.items.map((item, idx) => {
              const preset = PRESET_REWARD_ITEMS.find(p => p.slug === item.slug);
              if (!preset) return null;
              return (
                <div
                  key={item.slug}
                  className="flex items-center gap-2 bg-[#1a120e] border border-[#5c3c2a] rounded-lg px-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  <Package className="w-4 h-4 text-amber-400/80 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#e3d5b8] truncate">{preset.name}</div>
                    <div className="text-[10px] text-[#8b5a2b]">
                      PC: {preset.power_cost * item.quantity} ({preset.power_cost}×{item.quantity})
                    </div>
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setRewardQuantity(idx, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-1.5 text-[#a38b6b] hover:text-amber-400 transition-colors active:scale-95 disabled:opacity-30 min-w-[32px] min-h-[32px] flex items-center justify-center bg-[#0d0907] border border-[#5c3c2a] rounded"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono font-bold text-[#e3d5b8] w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setRewardQuantity(idx, item.quantity + 1)}
                      disabled={item.quantity >= MAX_ITEM_QTY}
                      className="p-1.5 text-[#a38b6b] hover:text-amber-400 transition-colors active:scale-95 disabled:opacity-30 min-w-[32px] min-h-[32px] flex items-center justify-center bg-[#0d0907] border border-[#5c3c2a] rounded"
                    >
                      <Plus className="w-3 h-3" />
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
          </div>
        )}
      </div>

      {/* Fixed note */}
      <div className="p-3 bg-[#1a120e]/40 border border-[#5c3c2a]/50 rounded-lg">
        <h4 className="text-[10px] font-bold text-[#a38b6b] mb-1">💡 クエストの固定報酬</h4>
        <p className="text-[10px] text-[#6d4c3d] leading-relaxed">
          アイテム報酬に加えて、クエストクリア時には**50Gのゴールド**と**30EXPの経験値**がプレイヤーへ固定で付与されます。
        </p>
      </div>
    </div>
  );
}

const StepRewards = React.memo(StepRewardsInner);
export default StepRewards;
