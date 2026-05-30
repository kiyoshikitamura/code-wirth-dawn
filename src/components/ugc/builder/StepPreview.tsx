'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Loader2, Save, FileText, Package, AlertTriangle } from 'lucide-react';
import type { BuilderQuest, BuilderNode } from '@/types/builder';
import type { ValidationResult } from '@/lib/ugc/builderValidation';
import { PRESET_REWARD_ITEMS } from '@/lib/ugc/builderPresets';

interface StepPreviewProps {
  quest: BuilderQuest;
  validationResult: ValidationResult | null;
  saving: boolean;
  onSaveDraft: () => void;
  onValidate: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  text: '📝 テキスト',
  battle: '⚔️ バトル',
  delivery: '📦 納品',
  trap: '⚠️ トラップ',
  success: '🏁 成功',
  failure: '💀 失敗',
};

function StepPreviewInner({
  quest,
  validationResult,
  saving,
  onSaveDraft,
  onValidate,
}: StepPreviewProps) {
  const { nodes, edges } = quest.canvas;

  // Find root nodes (no incoming edges)
  const rootNodes = nodes.filter(
    (n) => !edges.some((e) => e.target === n.id)
  );

  // Quick summary of rewards
  const rewardsSummary = quest.rewards.items
    .map((item) => {
      const preset = PRESET_REWARD_ITEMS.find((p) => p.slug === item.slug);
      return preset ? `${preset.name} × ${item.quantity}` : '';
    })
    .filter(Boolean)
    .join(', ') || 'なし';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 max-w-md mx-auto w-full">
      <div className="space-y-1">
        <h2 className="text-sm font-serif font-bold text-amber-400">📋 作成内容の確認と保存</h2>
        <p className="text-[11px] text-[#6d4c3d] leading-relaxed">
          設定内容とフローを最終確認し、エラーがないことを検証した上で保存を行ってください。
        </p>
      </div>

      {/* 1. 基本情報サマリー */}
      <div className="bg-[#1a120e] border border-[#5c3c2a] rounded-lg p-3.5 space-y-2.5">
        <h3 className="text-[10px] font-bold text-[#8b5a2b] tracking-wider border-b border-[#5c3c2a]/50 pb-1">
          基本設定
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-[#e3d5b8]">
          <div className="col-span-2">
            <span className="text-[#8b5a2b] font-bold">タイトル: </span>
            <span className="font-bold">{quest.title || '（未入力）'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-[#8b5a2b] font-bold">概要: </span>
            <span className="text-[#a38b6b]">{quest.short_description || '（未入力）'}</span>
          </div>
          <div>
            <span className="text-[#8b5a2b] font-bold">依頼人: </span>
            {quest.client_name || '（未入力）'}
          </div>
          <div>
            <span className="text-[#8b5a2b] font-bold">種別: </span>
            {quest.scenario_type === 'Subjugation'
              ? '討伐'
              : quest.scenario_type === 'Delivery'
              ? '納品'
              : quest.scenario_type === 'Politics'
              ? '政治'
              : quest.scenario_type === 'Dungeon'
              ? '探索'
              : 'その他'}
          </div>
          <div>
            <span className="text-[#8b5a2b] font-bold">難度: </span>
            <span className="text-amber-400">{'★'.repeat(quest.difficulty)}</span>
          </div>
          <div>
            <span className="text-[#8b5a2b] font-bold">推奨レベル: </span>
            Lv {quest.rec_level}
          </div>
          <div>
            <span className="text-[#8b5a2b] font-bold">成功日数制限: </span>
            {quest.days_success}日
          </div>
          <div>
            <span className="text-[#8b5a2b] font-bold">失敗日数制限: </span>
            {quest.days_failure}日
          </div>
          <div className="col-span-2 border-t border-[#5c3c2a]/30 pt-1.5 mt-1">
            <span className="text-[#8b5a2b] font-bold">報酬アイテム: </span>
            <span className="text-amber-300">{rewardsSummary}</span>
          </div>
        </div>
      </div>

      {/* 2. 簡易フロービュー */}
      <div className="bg-[#1a120e] border border-[#5c3c2a] rounded-lg p-3.5 space-y-2.5">
        <h3 className="text-[10px] font-bold text-[#8b5a2b] tracking-wider border-b border-[#5c3c2a]/50 pb-1">
          フローマップ（簡易）
        </h3>
        {nodes.length === 0 ? (
          <p className="text-[11px] text-[#6d4c3d] text-center py-2">
            フローが定義されていません
          </p>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {nodes.map((node, index) => {
              const nodeEdges = edges.filter((e) => e.source === node.id);
              const nodeText =
                node.type === 'text'
                  ? node.data.text
                  : node.type === 'battle'
                  ? `推奨Lv ${node.data.enemy_level}`
                  : node.type === 'delivery'
                  ? `${node.data.delivery_item_slug} × ${node.data.delivery_quantity}`
                  : node.type === 'trap'
                  ? `ダメージ ${node.data.damage_pct}%`
                  : '';

              const cleanText =
                nodeText && nodeText.length > 25
                  ? nodeText.substring(0, 25) + '...'
                  : nodeText;

              return (
                <div key={node.id} className="text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#a38b6b] font-mono shrink-0">#{index + 1}</span>
                    <div className="flex-1 bg-[#0d0907] border border-[#5c3c2a]/80 px-2.5 py-1.5 rounded flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-[#e3d5b8] text-[10px] mr-1.5">
                          {TYPE_LABELS[node.type] || node.type}
                        </span>
                        {cleanText && (
                          <span className="text-[#6d4c3d] font-serif text-[10px]">
                            — {cleanText}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Show child connections */}
                  {nodeEdges.length > 0 && (
                    <div className="pl-6 border-l border-[#5c3c2a]/40 ml-[11px] py-1 space-y-1">
                      {nodeEdges.map((edge) => {
                        const targetIdx = nodes.findIndex((n) => n.id === edge.target);
                        const hIdx = edge.handleIndex ?? 0;
                        const label =
                          node.type === 'text' && node.data.choices?.[hIdx]
                            ? `選択肢「${node.data.choices[hIdx].label}」`
                            : '遷移';

                        return (
                          <div key={edge.id} className="text-[10px] text-[#8b5a2b] flex items-center gap-1">
                            <span>↳ {label} →</span>
                            <span className="font-bold text-amber-500 font-mono">
                              #{targetIdx !== -1 ? targetIdx + 1 : '?'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Show standard down arrow if not text node or choice doesn't cover all transitions */}
                  {nodeEdges.length === 0 && index < nodes.length - 1 && (
                    <div className="h-4 flex items-center pl-[11px]">
                      <div className="w-[1px] h-full bg-[#5c3c2a]/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. 検証結果 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-[10px] text-[#8b5a2b] font-bold">検証結果</label>
          <button
            onClick={onValidate}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#1a120e] hover:bg-[#2a1f14] border border-[#5c3c2a] rounded text-[10px] font-bold text-[#a38b6b] hover:text-amber-400 transition-colors active:scale-95 min-h-[32px]"
          >
            <FileText className="w-3 h-3" />
            再検証する
          </button>
        </div>

        {validationResult ? (
          <div
            className={`border rounded-lg p-3 text-[11px] space-y-2.5 shadow-md animate-in fade-in duration-200`}
            style={{
              backgroundColor: validationResult.valid
                ? 'rgba(6, 78, 59, 0.4)'
                : 'rgba(127, 29, 29, 0.4)',
              borderColor: validationResult.valid
                ? 'rgba(16, 185, 129, 0.5)'
                : 'rgba(239, 68, 68, 0.5)',
            }}
          >
            <div className="flex items-center gap-2">
              {validationResult.valid ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="font-bold text-[#e3d5b8]">
                {validationResult.valid
                  ? '検証OK: 保存可能です'
                  : `エラーが発生しています (${validationResult.errors.length}件)`}
              </span>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="space-y-1.5 pl-1.5 border-l border-red-500/30">
                {validationResult.errors.map((err, i) => {
                  // Find index of the node
                  const nodeIdx = nodes.findIndex((n) => n.id === err.nodeId);
                  return (
                    <div key={i} className="text-red-300 leading-relaxed text-[10px]">
                      {nodeIdx !== -1 && (
                        <span className="font-mono text-red-400 font-bold mr-1">
                          [#{nodeIdx + 1}]
                        </span>
                      )}
                      {err.message}
                    </div>
                  );
                })}
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="space-y-1.5 pl-1.5 border-l border-amber-500/30 pt-1 border-t border-[#5c3c2a]/20">
                <div className="text-amber-400 font-bold text-[10px] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  警告があります（保存可能）:
                </div>
                {validationResult.warnings.map((warn, i) => {
                  const nodeIdx = nodes.findIndex((n) => n.id === warn.nodeId);
                  return (
                    <div key={i} className="text-amber-300 text-[10px] leading-relaxed">
                      {nodeIdx !== -1 && (
                        <span className="font-mono text-amber-400 font-bold mr-1">
                          [#{nodeIdx + 1}]
                        </span>
                      )}
                      {warn.message}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-5 border border-dashed border-[#5c3c2a]/40 bg-[#1a120e]/30 rounded-lg">
            <p className="text-[11px] text-[#6d4c3d]">
              「再検証する」を押してエラーチェックを行ってください
            </p>
          </div>
        )}
      </div>

      {/* 4. 保存アクション */}
      <button
        onClick={onSaveDraft}
        disabled={saving || !validationResult?.valid}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#4e2f1d] hover:bg-[#613d28] disabled:bg-[#1a120e] disabled:opacity-40 disabled:border-[#5c3c2a] border border-[#a38b6b]/40 rounded-lg text-xs font-bold text-amber-300 hover:text-amber-200 transition-all active:scale-95 disabled:scale-100 shadow-lg min-h-[44px]"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            保存中...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            下書きとして保存する
          </>
        )}
      </button>
    </div>
  );
}

const StepPreview = React.memo(StepPreviewInner);
export default StepPreview;
