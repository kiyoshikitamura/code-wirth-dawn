'use client';

import React, { useState } from 'react';
import { Download, FileJson, FileText } from 'lucide-react';

const getAuthHeaders = async () => {
  const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
  const token = session?.access_token;
  return {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

type TemplateType = 'quest' | 'enemy' | 'item' | 'skill_card' | 'npc';

const TEMPLATE_TYPES: { key: TemplateType; label: string; desc: string }[] = [
  { key: 'quest', label: 'クエスト', desc: 'シナリオ全体（フロー・バトル・報酬を含む）' },
  { key: 'enemy', label: 'エネミー', desc: 'カスタムモンスター定義' },
  { key: 'item', label: 'アイテム', desc: 'カスタム消耗品/換金素材' },
  { key: 'skill_card', label: 'スキルカード', desc: 'カスタム戦闘スキル' },
  { key: 'npc', label: 'NPC', desc: 'カスタム仲間キャラクター' },
];

export default function TemplateDownloadPanel() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: TemplateType, format: 'json' | 'md') => {
    setDownloading(`${type}_${format}`);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({ type, format });
      const res = await fetch(`/api/ugc/v2/template?${params}`, { headers });

      if (!res.ok) {
        alert('ダウンロードに失敗しました。');
        return;
      }

      const blob = await res.blob();
      const ext = format === 'md' ? 'md' : 'json';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_template.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#a38b6b] mb-4">
        テンプレートをダウンロードし、お好みのテキストエディタで編集してください。
        編集後は「インポート」タブから取り込めます。
      </p>

      {TEMPLATE_TYPES.map(t => (
        <div key={t.key} className="bg-[#fdfbf7] border border-[#c2b280] rounded-lg p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-[#3e2723] font-serif">{t.label}テンプレート</h4>
              <p className="text-[10px] text-[#8b6f4e] mt-0.5">{t.desc}</p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0 ml-3">
              <button
                onClick={() => handleDownload(t.key, 'json')}
                disabled={downloading === `${t.key}_json`}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded bg-[#3e2723] text-[#e3d5b8] hover:bg-[#4e342e] disabled:opacity-30 font-bold transition-colors"
              >
                <FileJson className="w-3 h-3" /> JSON
              </button>
              {t.key === 'quest' && (
                <button
                  onClick={() => handleDownload(t.key, 'md')}
                  disabled={downloading === `${t.key}_md`}
                  className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded bg-[#3e2723] text-[#e3d5b8] hover:bg-[#4e342e] disabled:opacity-30 font-bold transition-colors"
                >
                  <FileText className="w-3 h-3" /> MD
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="bg-[#2c1e1a] rounded p-3 mt-4">
        <h4 className="text-xs font-bold text-amber-400 mb-2">📖 テンプレート編集のヒント</h4>
        <ul className="text-[10px] text-[#a38b6b] space-y-1">
          <li>• JSONファイルは VS Code などのエディタで編集するのが便利です</li>
          <li>• MDファイルは Markdown エディタ（Typora等）で視覚的に編集できます</li>
          <li>• 画像は「ugc://images/enemies/xxx.webp」形式で参照します</li>
          <li>• バランス計算タブで TP/NP/PB を事前確認できます</li>
        </ul>
      </div>
    </div>
  );
}
