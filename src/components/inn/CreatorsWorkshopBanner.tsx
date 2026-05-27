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
            <button
                onClick={onOpenWorkshop}
                className="w-full relative p-3 md:p-4 bg-gradient-to-r from-gray-900/40 to-slate-900 border border-[#2a4080]/50 rounded-2xl shadow-2xl overflow-hidden group text-left cursor-pointer hover:bg-slate-900/80 hover:border-amber-500/30 transition-all active:scale-95 flex items-center justify-center focus:outline-none"
            >
                <div className="absolute inset-0 opacity-10 bg-[url('/textures/paper.png')] mix-blend-overlay" />
                <div className="relative z-10 flex items-center justify-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#122042]/60 rounded-full flex items-center justify-center border border-[#2a4080]/30 shadow-inner text-amber-400 group-hover:text-amber-300 group-hover:bg-amber-500/10 transition-colors">
                            <PenTool size={20} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-[9px] font-black text-blue-200/50 uppercase tracking-[0.2em] mb-0.5">Workshop</h3>
                            <p className="text-sm md:text-base font-bold text-slate-100 group-hover:text-white transition-colors">クリエイターズ工房</p>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    );
}
