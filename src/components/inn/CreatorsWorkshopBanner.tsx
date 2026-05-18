import React from 'react';
import { PenTool } from 'lucide-react';

interface CreatorsWorkshopBannerProps {
    onOpenWorkshop: () => void;
    isHub: boolean; // v27.0: 定数ではなくフラグで制御
}

export default function CreatorsWorkshopBanner({ onOpenWorkshop, isHub }: CreatorsWorkshopBannerProps) {
    // 名もなき旅人の拠所でのみ表示 (v27.0: isHub propsで判定)
    if (!isHub) {
        return null;
    }

    return (
        <div className="px-4 pb-12 w-full max-w-lg mx-auto">
            <div
                className="w-full relative p-3 md:p-4 bg-gradient-to-r from-gray-900/40 to-slate-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden group"
            >
                {/* 開発中オーバーレイ */}
                <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center">
                    <div className="px-4 py-1.5 bg-black/50 border border-gray-600/50 rounded-full backdrop-blur-sm">
                        <span className="text-gray-300 font-bold tracking-widest text-sm">【 開発中 】</span>
                    </div>
                </div>

                <div className="absolute inset-0 opacity-10 bg-[url('/textures/paper.png')] mix-blend-overlay" />
                <div className="relative z-10 flex items-center justify-center grayscale opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center border border-gray-600/30 shadow-inner">
                            <PenTool size={20} className="text-gray-500" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">Workshop</h3>
                            <p className="text-sm md:text-base font-bold text-gray-300 font-serif italic">クリエイターズ工房</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
