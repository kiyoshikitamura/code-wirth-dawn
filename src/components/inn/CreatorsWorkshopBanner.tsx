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
                className="w-full flex items-center gap-3 p-3 md:p-4 bg-[#122042]/80 border border-[#2a4080]/50 rounded-xl hover:bg-[#1a2d5a] hover:border-amber-500/30 transition-all active:scale-95 text-left group shadow-lg shadow-[#0a1628]/50 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
            >
                <div className="relative p-2 bg-amber-500/10 rounded-lg text-amber-400 group-hover:text-amber-300 group-hover:bg-amber-500/20 transition-colors">
                    <PenTool size={20} />
                </div>
                <div className="min-w-0">
                    <p className="text-[9px] text-blue-200/50 font-bold uppercase tracking-widest truncate">Workshop</p>
                    <p className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors whitespace-nowrap">クリエイターズ工房</p>
                </div>
            </button>
        </div>
    );
}
