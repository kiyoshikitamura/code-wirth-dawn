'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderKanban, Upload, Download, Calculator, Sparkles, BookOpen, Wand2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import MyWorksPanel from '@/components/ugc/MyWorksPanel';
import TemplateImportPanel from '@/components/ugc/TemplateImportPanel';
import TemplateDownloadPanel from '@/components/ugc/TemplateDownloadPanel';
import BalanceCalculatorPanel from '@/components/ugc/BalanceCalculatorPanel';

const QuestBuilderPanel = dynamic(() => import('@/components/ugc/QuestBuilderPanel'), { ssr: false });

type Tab = 'works' | 'builder' | 'template' | 'import' | 'calculator';

export default function CreatorsWorkshopPage() {
  const router = useRouter();
  useAuthGuard();

  const [activeTab, setActiveTab] = useState<Tab>('works');
  const [refreshKey, setRefreshKey] = useState(0);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabContainerRef.current) {
      const scrollAmount = direction === 'left' ? -120 : 120;
      tabContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'works', label: 'マイ作品', icon: <FolderKanban className="w-4 h-4" /> },
    { key: 'builder', label: '簡易作成', icon: <Wand2 className="w-4 h-4" /> },
    { key: 'template', label: 'テンプレート', icon: <Download className="w-4 h-4" /> },
    { key: 'import', label: 'インポート', icon: <Upload className="w-4 h-4" /> },
    { key: 'calculator', label: 'バランス計算', icon: <Calculator className="w-4 h-4" /> },
  ];

  return (
    <div className="h-screen w-screen bg-[#070e1e] flex justify-center items-center font-sans overflow-hidden text-[#e3d5b8]">
      <div className="relative w-full max-w-[450px] h-[100dvh] md:h-[min(844px,92vh)] bg-[#0d0907] md:border-4 md:border-[#3e2723] md:rounded-[24px] shadow-2xl flex flex-col overflow-hidden">
        
        {activeTab === 'builder' ? (
          <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-[#0d0907]">
            <QuestBuilderPanel
              onSaveSuccess={() => { setActiveTab('works'); setRefreshKey(k => k + 1); }}
              onBack={() => setActiveTab('works')}
            />
          </div>
        ) : (
          <>
            {/* Top Bar */}
            <div className="bg-[#1a120e] border-b border-[#5c3c2a] px-4 py-3 flex items-center justify-between shrink-0">
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
              <button
                onClick={() => router.push('/play-guide/ugc')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4e2f1d] hover:bg-[#613d28] border border-[#a38b6b]/40 rounded-lg text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors focus:outline-none"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>UGCガイド</span>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="bg-[#1a120e] border-b border-[#3e2723] px-1 shrink-0 flex items-center justify-between">
              {/* Left scroll button */}
              <button
                onClick={() => scrollTabs('left')}
                className="p-1.5 text-[#8b5a2b] hover:text-amber-400 active:scale-95 transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="左にスクロール"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>

              {/* Scrollable Tabs Wrapper */}
              <div
                ref={tabContainerRef}
                className="flex-1 flex gap-1 overflow-x-auto no-scrollbar scroll-smooth justify-start"
              >
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-3 text-[11px] font-bold transition-colors border-b-2 whitespace-nowrap shrink-0 ${
                      activeTab === t.key
                        ? 'border-amber-400 text-amber-400'
                        : 'border-transparent text-[#8b5a2b] hover:text-[#a38b6b]'
                    }`}
                  >
                    {t.icon} <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Right scroll button */}
              <button
                onClick={() => scrollTabs('right')}
                className="p-1.5 text-[#8b5a2b] hover:text-amber-400 active:scale-95 transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="右にスクロール"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-[#0d0907] p-4 space-y-4 min-h-0">
              {activeTab === 'works' && <MyWorksPanel key={refreshKey} />}
              {activeTab === 'template' && <TemplateDownloadPanel />}
              {activeTab === 'import' && <TemplateImportPanel onImportSuccess={() => { setActiveTab('works'); setRefreshKey(k => k + 1); }} />}
              {activeTab === 'calculator' && <BalanceCalculatorPanel />}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
