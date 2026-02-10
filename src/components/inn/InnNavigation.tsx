
import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface InnNavigationProps {
    onOpenTavern: () => void;
    onOpenShop: () => void;
    onOpenStatus: () => void;
    onOpenPrayer: () => void;
    theme: {
        border: string;
        text: string;
        accent: string;
        bg: string;
    };
}

export default function InnNavigation({ onOpenTavern, onOpenShop, onOpenStatus, onOpenPrayer, theme }: InnNavigationProps) {
    return (
        <>
            {/* Mobile Navigation (Visible only on small screens) */}
            <section className="grid md:hidden grid-cols-2 gap-3 mb-4">
                <button
                    onClick={onOpenTavern}
                    className="bg-[#2b1d12] border border-[#a38b6b] p-3 rounded flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                    <span className="text-2xl">🍺</span>
                    <span className="text-xs font-bold text-[#e3d5b8]">酒場</span>
                </button>
                <button
                    onClick={onOpenShop}
                    className="bg-[#2b1d12] border border-[#a38b6b] p-3 rounded flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                    <span className="text-2xl">💰</span>
                    <span className="text-xs font-bold text-[#e3d5b8]">商店</span>
                </button>
                <button
                    onClick={onOpenStatus}
                    className="bg-[#1a1510] border border-[#4a3b2b] p-3 rounded flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                    <ShieldCheck className="w-6 h-6 text-gray-400" />
                    <span className="text-xs font-bold text-gray-300">ステータス</span>
                </button>
                <button
                    onClick={onOpenPrayer}
                    className="bg-[#1a1510] border border-gold-600/50 p-3 rounded flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                    <span className="text-2xl">🙏</span>
                    <span className="text-xs font-bold text-gold-400">祈り</span>
                </button>
            </section>

            {/* Navigation Menu (Desktop Only) */}
            <section className="hidden md:grid grid-cols-1 gap-4">
                <button
                    onClick={onOpenTavern}
                    className="bg-[#2b1d12] border border-[#a38b6b] p-4 flex items-center gap-4 hover:bg-[#3e2b1b] transition-all group"
                >
                    <div className="bg-black/30 p-3 rounded-full text-amber-500 group-hover:text-amber-300">
                        <span className="text-2xl">🍺</span>
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-serif font-bold text-[#e3d5b8] group-hover:text-white">酒場へ行く</div>
                        <div className="text-xs text-[#8b7355]">仲間を探す・情報を集める</div>
                    </div>
                </button>

                <button
                    onClick={onOpenShop}
                    className="bg-[#2b1d12] border border-[#a38b6b] p-4 flex items-center gap-4 hover:bg-[#3e2b1b] transition-all group"
                >
                    <div className="bg-black/30 p-3 rounded-full text-amber-500 group-hover:text-amber-300">
                        <span className="text-2xl">💰</span>
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-serif font-bold text-[#e3d5b8] group-hover:text-white">商店へ行く</div>
                        <div className="text-xs text-gray-500">アイテム・スキルの購入</div>
                    </div>
                </button>

                <button
                    onClick={onOpenStatus}
                    className="bg-[#1a1510] border border-[#4a3b2b] p-4 flex items-center gap-4 hover:bg-[#2a221b] transition-all group"
                >
                    <div className="bg-black/30 p-3 rounded-full text-gray-400 group-hover:text-gray-200">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-serif font-bold text-gray-300 group-hover:text-white">ステータス</div>
                        <div className="text-xs text-gray-600">所持品・スキルの確認</div>
                    </div>
                </button>

                <button
                    onClick={onOpenPrayer}
                    className="bg-[#1a1510] border border-gold-600/30 p-4 flex items-center gap-4 hover:bg-[#2d2416] transition-all group"
                >
                    <div className="bg-black/30 p-3 rounded-full text-gold-500 group-hover:text-gold-300">
                        <span className="text-2xl">🙏</span>
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-serif font-bold text-gold-200 group-hover:text-white">祈りを捧げる</div>
                        <div className="text-xs text-gold-500/70">世界への介入・属性支援</div>
                    </div>
                </button>
            </section>
        </>
    );
}
