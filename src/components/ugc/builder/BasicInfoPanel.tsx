'use client';

import React, { useCallback } from 'react';
import type { BuilderQuest } from '@/types/builder';

const INPUT_CLS =
  'w-full px-3 py-2.5 bg-[#1a120e] border border-[#5c3c2a] rounded-lg text-xs text-[#e3d5b8] placeholder-[#6d4c3d] focus:border-amber-400 focus:outline-none transition-colors min-h-[40px]';
const SELECT_CLS =
  'w-full px-3 py-2.5 bg-[#1a120e] border border-[#5c3c2a] rounded-lg text-xs text-[#e3d5b8] focus:border-amber-400 focus:outline-none transition-colors min-h-[40px]';
const LABEL_CLS = 'block text-[10px] text-[#8b5a2b] font-bold mb-1';

interface BasicInfoPanelProps {
  quest: BuilderQuest;
  onUpdate: (updates: Partial<BuilderQuest>) => void;
}

function BasicInfoPanelInner({ quest, onUpdate }: BasicInfoPanelProps) {
  const setField = useCallback(
    <K extends keyof BuilderQuest>(key: K, value: BuilderQuest[K]) => {
      onUpdate({ [key]: value } as Partial<BuilderQuest>);
    },
    [onUpdate],
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-md mx-auto w-full">
      <div className="space-y-1">
        <h2 className="text-sm font-serif font-bold text-amber-400">📝 クエストの基本設定</h2>
        <p className="text-[11px] text-[#6d4c3d] leading-relaxed">
          作成するクエストの基本パラメータを入力します。難易度や推奨レベルは、報酬を設定する際の「パワー予算」に影響します。
        </p>
      </div>

      <div className="space-y-3.5">
        {/* Title */}
        <div>
          <label className={LABEL_CLS}>クエストタイトル</label>
          <input
            type="text"
            value={quest.title}
            onChange={e => setField('title', e.target.value)}
            placeholder="例: 森のゴブリン退治"
            className={INPUT_CLS}
          />
        </div>

        {/* Short desc */}
        <div>
          <label className={LABEL_CLS}>概要説明（冒険者の手帳等に記載されます）</label>
          <textarea
            value={quest.short_description}
            onChange={e => setField('short_description', e.target.value)}
            placeholder="例: 森に棲みついたゴブリンを退治して、街道の安全を確保する。"
            rows={3}
            className={`${INPUT_CLS} resize-none font-serif leading-relaxed text-[11px]`}
          />
        </div>

        {/* Client name */}
        <div>
          <label className={LABEL_CLS}>依頼人</label>
          <input
            type="text"
            value={quest.client_name}
            onChange={e => setField('client_name', e.target.value)}
            placeholder="例: 村長アルベルト"
            className={INPUT_CLS}
          />
        </div>

        {/* Type */}
        <div>
          <label className={LABEL_CLS}>クエスト種別</label>
          <select
            value={quest.scenario_type}
            onChange={e =>
              setField('scenario_type', e.target.value as BuilderQuest['scenario_type'])
            }
            className={SELECT_CLS}
          >
            <option value="Subjugation">⚔️ 討伐（エネミーの撃破）</option>
            <option value="Delivery">📦 納品（アイテムの調達）</option>
            <option value="Politics">📜 政治（対話や交渉）</option>
            <option value="Dungeon">🧭 探索（遺跡やダンジョンの踏破）</option>
            <option value="Other">🛡️ その他（護衛や調査など）</option>
          </select>
        </div>

        {/* Difficulty + Level row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS}>難易度</label>
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
            <label className={LABEL_CLS}>推奨レベル (1 - 30)</label>
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS}>成功日数制限</label>
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
            <label className={LABEL_CLS}>失敗日数制限</label>
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
      </div>
    </div>
  );
}

const BasicInfoPanel = React.memo(BasicInfoPanelInner);
export default BasicInfoPanel;
