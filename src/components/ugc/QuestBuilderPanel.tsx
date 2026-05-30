'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { BuilderQuest } from '@/types/builder';
import WizardStepIndicator from './builder/WizardStepIndicator';
import BasicInfoPanel from './builder/BasicInfoPanel';
import StepFlowBuilder from './builder/StepFlowBuilder';
import StepRewards from './builder/StepRewards';
import StepPreview from './builder/StepPreview';
import { validateBuilderQuest, type ValidationResult } from '@/lib/ugc/builderValidation';
import { convertBuilderToTemplate } from '@/lib/ugc/builderConverter';
import { getAuthHeaders } from '@/lib/authToken';

function createDefaultCanvasState() {
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

interface QuestBuilderPanelProps {
  onSaveSuccess?: () => void;
  onBack?: () => void;
}

export default function QuestBuilderPanel({ onSaveSuccess, onBack }: QuestBuilderPanelProps) {
  const [quest, setQuest] = useState<BuilderQuest>(createDefaultQuest);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // ── Quest metadata update ──
  const handleQuestUpdate = useCallback((updates: Partial<BuilderQuest>) => {
    setQuest(prev => ({ ...prev, ...updates }));
  }, []);

  // ── Save & Validate ──
  const handleValidate = useCallback(() => {
    const result = validateBuilderQuest(quest);
    setValidationResult(result);
  }, [quest]);

  // Run validation automatically when entering step 4
  useEffect(() => {
    if (currentStep === 4) {
      handleValidate();
    }
  }, [currentStep, handleValidate]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setValidationResult(null);

    try {
      // 1. バリデーション
      const result = validateBuilderQuest(quest);
      if (!result.valid) {
        setValidationResult(result);
        alert('バリデーションエラーがあります。内容を確認してください。');
        return;
      }

      // 警告がある場合は確認
      if (result.warnings.length > 0) {
        const msgs = result.warnings.map(w => `⚠ ${w.message}`).join('\n');
        const proceed = confirm(`警告があります:\n${msgs}\n\n保存を続けますか？`);
        if (!proceed) return;
      }

      // 2. BuilderQuest → UgcQuestTemplate 変換
      const converted = convertBuilderToTemplate(quest);

      // 3. API 送信
      const headers = await getAuthHeaders();
      const res = await fetch('/api/ugc/v2/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          content: JSON.stringify(converted),
          format: 'json',
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg = json.error ||
          json.errors?.map((e: { message: string }) => e.message).join('\n') ||
          '保存に失敗しました。';
        alert(`保存エラー:\n${errorMsg}`);
        return;
      }

      // 4. 成功
      onSaveSuccess?.();
    } catch (e) {
      console.error('[QuestBuilder] Save error:', e);
      alert('通信エラーが発生しました。ネットワーク接続を確認してください。');
    } finally {
      setSaving(false);
    }
  }, [quest, onSaveSuccess]);

  // Node and Battle counts for power budget
  const nodeCount = useMemo(() => quest.canvas.nodes.length, [quest.canvas.nodes]);
  const battleCount = useMemo(
    () => quest.canvas.nodes.filter(n => n.type === 'battle').length,
    [quest.canvas.nodes],
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
        <div className="text-[10px] text-[#8b5a2b] font-bold">
          ステップ {currentStep} / 4
        </div>
      </div>

      {/* ── Step Progress Indicator ── */}
      <WizardStepIndicator currentStep={currentStep} />

      {/* ── Active Wizard Step Content ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#0d0907]" style={{
        backgroundImage: 'radial-gradient(circle, #5c3c2a10 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}>
        {currentStep === 1 && (
          <BasicInfoPanel quest={quest} onUpdate={handleQuestUpdate} />
        )}
        {currentStep === 2 && (
          <StepFlowBuilder quest={quest} onUpdate={handleQuestUpdate} />
        )}
        {currentStep === 3 && (
          <StepRewards
            quest={quest}
            onUpdate={handleQuestUpdate}
            nodeCount={nodeCount}
            battleCount={battleCount}
          />
        )}
        {currentStep === 4 && (
          <StepPreview
            quest={quest}
            validationResult={validationResult}
            saving={saving}
            onSaveDraft={handleSave}
            onValidate={handleValidate}
          />
        )}
      </div>

      {/* ── Bottom Navigation Footer ── */}
      <div className="shrink-0 bg-[#1a120e] border-t border-[#5c3c2a] px-4 py-3 flex items-center justify-between gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {currentStep > 1 ? (
          <button
            onClick={() => setCurrentStep(s => s - 1)}
            className="flex-1 py-2.5 bg-[#2a1f14] hover:bg-[#3d2f21] border border-[#5c3c2a] rounded-lg text-xs font-bold text-[#a38b6b] active:scale-95 transition-all text-center min-h-[40px] flex items-center justify-center"
          >
            ← 戻る
          </button>
        ) : (
          <div className="flex-1" />
        )}

        {currentStep < 4 ? (
          <button
            onClick={() => {
              if (currentStep === 1) {
                if (!quest.title.trim()) {
                  alert('クエストタイトルを入力してください。');
                  return;
                }
              }
              setCurrentStep(s => s + 1);
            }}
            className="flex-1 py-2.5 bg-[#4e2f1d] hover:bg-[#613d28] border border-[#a38b6b]/40 rounded-lg text-xs font-bold text-amber-300 hover:text-amber-200 active:scale-95 transition-all text-center min-h-[40px] flex items-center justify-center"
          >
            次へ →
          </button>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
