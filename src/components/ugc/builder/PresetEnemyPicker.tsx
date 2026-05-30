'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { PRESET_ENEMIES, scaleEnemyStats } from '@/lib/ugc/builderPresets';
import type { PresetEnemy } from '@/types/builder';

// ── Category config ──

const CATEGORIES: { key: PresetEnemy['category']; label: string; dot: string }[] = [
  { key: 'beginner',     label: '初級', dot: '🟢' },
  { key: 'intermediate', label: '中級', dot: '🟡' },
  { key: 'advanced',     label: '上級', dot: '🟠' },
  { key: 'boss',         label: 'ボス', dot: '🔴' },
];

// ── Props ──

interface PresetEnemyPickerProps {
  selectedEnemyId: string;
  selectedLevel: number;
  onSelect: (enemyId: string) => void;
  onLevelChange: (level: number) => void;
}

// ── Component ──

function PresetEnemyPickerInner({
  selectedEnemyId,
  selectedLevel,
  onSelect,
  onLevelChange,
}: PresetEnemyPickerProps) {
  const [activeCategory, setActiveCategory] = useState<PresetEnemy['category']>(() => {
    // Default to the category of the currently selected enemy, or 'beginner'
    const found = PRESET_ENEMIES.find(e => e.id === selectedEnemyId);
    return found?.category ?? 'beginner';
  });

  const filteredEnemies = useMemo(
    () => PRESET_ENEMIES.filter(e => e.category === activeCategory),
    [activeCategory],
  );

  const selectedEnemy = useMemo(
    () => PRESET_ENEMIES.find(e => e.id === selectedEnemyId) ?? null,
    [selectedEnemyId],
  );

  const scaledStats = useMemo(() => {
    if (!selectedEnemy) return null;
    return scaleEnemyStats(selectedEnemy, selectedLevel);
  }, [selectedEnemy, selectedLevel]);

  const handleLevelSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onLevelChange(Number(e.target.value));
    },
    [onLevelChange],
  );

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors active:scale-95 min-h-[44px] ${
                isActive
                  ? 'text-amber-400 bg-amber-400/10 border-b-2 border-amber-400'
                  : 'text-[#a38b6b] bg-[#0d0907] border border-[#5c3c2a] hover:text-[#e3d5b8]'
              }`}
            >
              <span>{cat.dot}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Enemy cards grid */}
      <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
        {filteredEnemies.map(enemy => {
          const isSelected = selectedEnemyId === enemy.id;
          return (
            <button
              key={enemy.id}
              onClick={() => onSelect(enemy.id)}
              className={`text-left p-2.5 rounded-lg border transition-all active:scale-95 ${
                isSelected
                  ? 'ring-2 ring-amber-400 bg-amber-400/10 border-amber-400/50'
                  : 'bg-[#0d0907] border-[#5c3c2a] hover:border-[#a38b6b]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#e3d5b8] truncate">{enemy.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a1f14] text-[#a38b6b] font-bold shrink-0">
                  Lv{enemy.baseLevel}
                </span>
              </div>
              <div className="flex gap-2 text-[10px] text-[#8b5a2b] mb-1">
                <span>HP{enemy.hp}</span>
                <span>ATK{enemy.atk}</span>
                <span>DEF{enemy.def}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {enemy.skills.map(skill => (
                  <span
                    key={skill}
                    className="text-[9px] px-1 py-0.5 bg-[#1a120e] text-[#6d4c3d] rounded"
                  >
                    {skill.replace('skill_', '')}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Level slider + scaled stats */}
      {selectedEnemy && (
        <div className="bg-[#0d0907] border border-[#5c3c2a] rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8b5a2b]">レベル調整</span>
            <span className="text-xs font-bold text-amber-400">Lv.{selectedLevel}</span>
          </div>

          <input
            type="range"
            min={1}
            max={50}
            value={selectedLevel}
            onChange={handleLevelSlider}
            className="w-full h-2 bg-[#2a1f14] rounded-lg appearance-none cursor-pointer accent-amber-400"
            style={{ minHeight: '44px' }}
          />

          {scaledStats && (
            <div className="flex justify-between text-xs">
              <div className="text-center">
                <div className="text-[10px] text-[#6d4c3d]">HP</div>
                <div className="font-bold text-red-400">{scaledStats.hp}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[#6d4c3d]">ATK</div>
                <div className="font-bold text-orange-400">{scaledStats.atk}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[#6d4c3d]">DEF</div>
                <div className="font-bold text-blue-400">{scaledStats.def}</div>
              </div>
            </div>
          )}

          {/* Skills list */}
          <div className="pt-1 border-t border-[#5c3c2a]/50">
            <span className="text-[10px] text-[#6d4c3d]">スキル: </span>
            {selectedEnemy.skills.map(skill => (
              <span
                key={skill}
                className="text-[10px] px-1.5 py-0.5 bg-[#2a1f14] text-[#a38b6b] rounded mr-1"
              >
                {skill.replace('skill_', '')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const PresetEnemyPicker = React.memo(PresetEnemyPickerInner);
export default PresetEnemyPicker;
