'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Copy, Check, X, Sparkles } from 'lucide-react';
import {
  generatePromptGuide,
  type PromptTemplateType,
} from '@/lib/ugc/ugcPromptGuide';

interface PromptGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateType: PromptTemplateType;
}

const TYPE_LABELS: Record<PromptTemplateType, string> = {
  quest: 'クエスト',
  enemy: 'エネミー',
  item: 'アイテム',
  skill_card: 'スキルカード',
  npc: 'NPC',
};

export default function PromptGuideModal({
  isOpen,
  onClose,
  templateType,
}: PromptGuideModalProps) {
  const [outputFormat, setOutputFormat] = useState<'json' | 'md'>('json');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const promptText = isOpen
    ? generatePromptGuide(templateType, outputFormat)
    : '';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = promptText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [promptText]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-[450px] max-h-[90vh] flex flex-col bg-[#0d0907] border border-[#3e2723] rounded-lg shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#3e2723] bg-[#1a120e]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-[#e3d5b8]">
              AIプロンプトガイド — {TYPE_LABELS[templateType]}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#3e2723] transition-colors"
            aria-label="閉じる"
          >
            <X className="w-4 h-4 text-[#a38b6b]" />
          </button>
        </div>

        {/* Instruction */}
        <div className="px-4 py-2.5 border-b border-[#3e2723]/60 bg-[#1a120e]/60">
          <p className="text-[10px] leading-relaxed text-[#a38b6b]">
            下記のプロンプトをコピーして、ChatGPT・Gemini・Claude等のAIに貼り付けてください。AIとの対話でテンプレートを作成し、完成したJSON/MDを「インポート」タブから取り込めます。
          </p>
        </div>

        {/* Format Toggle + Copy Button */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#3e2723]/40">
          {/* Format Toggle */}
          <div className="flex rounded overflow-hidden border border-[#3e2723]">
            <button
              onClick={() => setOutputFormat('json')}
              className={`px-3 py-1 text-[10px] font-bold transition-colors ${
                outputFormat === 'json'
                  ? 'bg-amber-400/20 text-amber-400 border-r border-[#3e2723]'
                  : 'bg-[#1a120e] text-[#6d4c3d] hover:text-[#a38b6b] border-r border-[#3e2723]'
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setOutputFormat('md')}
              className={`px-3 py-1 text-[10px] font-bold transition-colors ${
                outputFormat === 'md'
                  ? 'bg-amber-400/20 text-amber-400'
                  : 'bg-[#1a120e] text-[#6d4c3d] hover:text-[#a38b6b]'
              }`}
            >
              MD
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
              copied
                ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-600/50'
                : 'bg-[#3e2723] text-[#e3d5b8] hover:bg-[#4e342e] border border-[#3e2723]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                コピー済み ✅
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                📋 クリップボードにコピー
              </>
            )}
          </button>
        </div>

        {/* Prompt Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <pre className="text-[10px] leading-relaxed text-[#c4b496] font-mono whitespace-pre-wrap break-words select-all">
            {promptText}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#3e2723] bg-[#1a120e]">
          <span className="text-[10px] text-[#6d4c3d]">
            {promptText.length.toLocaleString()} 文字
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#3e2723] text-[#e3d5b8] text-xs font-bold rounded hover:bg-[#4e342e] transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
