'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderKanban, Upload, Download, Calculator, Sparkles } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import MyWorksPanel from '@/components/ugc/MyWorksPanel';
import TemplateImportPanel from '@/components/ugc/TemplateImportPanel';
import TemplateDownloadPanel from '@/components/ugc/TemplateDownloadPanel';
import BalanceCalculatorPanel from '@/components/ugc/BalanceCalculatorPanel';

type Tab = 'works' | 'template' | 'import' | 'calculator';

export default function CreatorsWorkshopPage() {
  const router = useRouter();
  useAuthGuard();

  const [activeTab, setActiveTab] = useState<Tab>('works');
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'works', label: 'マイ作品', icon: <FolderKanban className="w-4 h-4" /> },
    { key: 'template', label: 'テンプレート', icon: <Download className="w-4 h-4" /> },
    { key: 'import', label: 'インポート', icon: <Upload className="w-4 h-4" /> },
    { key: 'calculator', label: 'バランス計算', icon: <Calculator className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0d0907] text-[#e3d5b8]">
      {/* Top Bar */}
      <div className="bg-[#1a120e] border-b border-[#5c3c2a] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[#a38b6b] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h1 className="text-lg font-serif font-bold tracking-widest text-amber-400">クリエイターズ工房</h1>
            </div>
            <p className="text-[10px] text-[#6d4c3d] font-serif italic">― Creator's Workshop ―</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-[#1a120e] border-b border-[#3e2723] px-2">
        <div className="flex gap-1 max-w-4xl mx-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-colors border-b-2 ${
                activeTab === t.key
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-[#8b5a2b] hover:text-[#a38b6b]'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {activeTab === 'works' && <MyWorksPanel key={refreshKey} />}
        {activeTab === 'template' && <TemplateDownloadPanel />}
        {activeTab === 'import' && <TemplateImportPanel onImportSuccess={() => { setActiveTab('works'); setRefreshKey(k => k + 1); }} />}
        {activeTab === 'calculator' && <BalanceCalculatorPanel />}
      </div>
    </div>
  );
}
