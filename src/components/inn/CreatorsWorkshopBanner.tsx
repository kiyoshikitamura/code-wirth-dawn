import React from 'react';
import { PenTool } from 'lucide-react';

interface CreatorsWorkshopBannerProps {
    onOpenWorkshop: () => void;
    locationName: string;
}

export default function CreatorsWorkshopBanner({ onOpenWorkshop, locationName }: CreatorsWorkshopBannerProps) {
    // 名もなき旅人の拠所でのみ表示
    if (locationName !== '名もなき旅人の拠所' && locationName !== 'Hub') {
        return null;
    }

    return (
        <div className="px-4 pb-12 w-full max-w-lg mx-auto">
            <button
                onClick={onOpenWorkshop}
                className="w-full relative p-5 md:p-6 bg-gradient-to-r from-amber-900/40 to-slate-900 border border-amber-900/50 rounded-2xl shadow-2xl overflow-hidden group transition-all active:scale-95 outline-none focus:ring-2 focus:ring-amber-600/50"
            >
                <div className="absolute inset-0 opacity-10 bg-[url('/textures/paper.png')] mix-blend-overlay" />
                <div className="relative z-10 flex items-center justify-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center border border-amber-600/30 shadow-inner group-hover:bg-amber-900/40 transition-colors">
                            <PenTool size={24} className="text-amber-500" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] mb-0.5">Workshop</h3>
                            <p className="text-sm md:text-base font-bold text-amber-100 font-serif italic">クリエイターズ工房</p>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    );
}
