import React from 'react';
import { ShieldCheck, Settings } from 'lucide-react';
import { HUB_LOCATION_ID } from '@/utils/constants';

interface InnNavigationProps {
    onOpenTavern: () => void;
    onOpenShop: () => void;
    onOpenStatus: () => void;
    onOpenPrayer: () => void;
    onOpenAccount: () => void;
    onOpenEditor?: () => void;
    theme: {
        border: string;
        text: string;
        accent: string;
        bg: string;
    };
    isEmbargoed?: boolean;
    locationId?: string;
}

export default function InnNavigation({ onOpenTavern, onOpenShop, onOpenStatus, onOpenPrayer, onOpenAccount, onOpenEditor, theme, isEmbargoed, locationId }: InnNavigationProps) {
    return (
        <>
            {/* Mobile Navigation (Visible only on small screens) */}
            <section className="grid md:hidden grid-cols-2 gap-3 mb-4">
                <button
                    onClick={isEmbargoed ? undefined : onOpenTavern}
                    disabled={isEmbargoed}
                    className={`bg-[#2b1d12] border ${isEmbargoed ? 'border-red-900 opacity-50 cursor-not-allowed' : 'border-[#a38b6b] active:scale-95 transition-transform'} p-3 rounded flex flex-col items-center justify-center gap-1`}
                >
                    <span className="text-2xl">🍺</span>
                    <span className="text-xs font-bold text-[#e3d5b8]">酒場</span>
                </button>
                <button
                    onClick={isEmbargoed ? undefined : onOpenShop}
                    disabled={isEmbargoed}
                    className={`bg-[#2b1d12] border ${isEmbargoed ? 'border-red-900 opacity-50 cursor-not-allowed' : 'border-[#a38b6b] active:scale-95 transition-transform'} p-3 rounded flex flex-col items-center justify-center gap-1`}
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
                <button
                    onClick={onOpenAccount}
                    className="col-span-2 bg-[#1a1510] border border-[#a38b6b]/50 p-3 rounded flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                    <Settings className="w-6 h-6 text-gray-400" />
                    <span className="text-xs font-bold text-gray-300">データ引継ぎ / 設定</span>
                </button>
                {locationId === HUB_LOCATION_ID && onOpenEditor && (
                    <button
                        onClick={onOpenEditor}
                        className="col-span-2 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/50 p-3 rounded flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform animate-pulse"
                    >
                        <span className="text-2xl">✍️</span>
                        <span className="text-xs font-bold text-purple-200">クエストを創る (UGC)</span>
                    </button>
                )}
            </section>

            {/* Navigation Menu (Desktop Only) */}
            < section className="hidden md:grid grid-cols-1 gap-4" >
                <button
                    onClick={isEmbargoed ? undefined : onOpenTavern}
                    disabled={isEmbargoed}
                    className={`bg-[#2b1d12] border p-4 flex items-center gap-4 group transition-all ${isEmbargoed ? 'border-red-900 opacity-50 cursor-not-allowed' : 'border-[#a38b6b] hover:bg-[#3e2b1b]'}`}
                >
                    <div className="bg-black/30 p-3 rounded-full text-amber-500 group-hover:text-amber-300">
                        <span className="text-2xl">🍺</span>
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-serif font-bold text-[#e3d5b8] group-hover:text-white">酒場へ行く</div>
                        <div className={`text-xs ${isEmbargoed ? 'text-red-400 font-bold' : 'text-[#8b7355]'}`}>{isEmbargoed ? '出禁：名声が低すぎるため入店できません' : '仲間を探す・情報を集める'}</div>
                    </div>
                </button>

                <button
                    onClick={isEmbargoed ? undefined : onOpenShop}
                    disabled={isEmbargoed}
                    className={`bg-[#2b1d12] border p-4 flex items-center gap-4 group transition-all ${isEmbargoed ? 'border-red-900 opacity-50 cursor-not-allowed' : 'border-[#a38b6b] hover:bg-[#3e2b1b]'}`}
                >
                    <div className="bg-black/30 p-3 rounded-full text-amber-500 group-hover:text-amber-300">
                        <span className="text-2xl">💰</span>
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-serif font-bold text-[#e3d5b8] group-hover:text-white">商店へ行く</div>
                        <div className={`text-xs ${isEmbargoed ? 'text-red-400 font-bold' : 'text-gray-500'}`}>{isEmbargoed ? '出禁：名声が低すぎるため取引できません' : 'アイテム・スキルの購入'}</div>
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

                <button
                    onClick={onOpenAccount}
                    className="bg-[#1a1510] border border-[#a38b6b]/30 p-4 flex items-center gap-4 hover:bg-[#2a221b] transition-all group"
                >
                    <div className="bg-black/30 p-3 rounded-full text-gray-400 group-hover:text-gray-200">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-serif font-bold text-[#e3d5b8] group-hover:text-white">データ引継ぎ</div>
                        <div className="text-xs text-gray-500">外部アカウント情報の連携・設定</div>
                    </div>
                </button>

                {locationId === HUB_LOCATION_ID && onOpenEditor && (
                    <button
                        onClick={onOpenEditor}
                        className="bg-gradient-to-r from-[#1a0f2e] to-[#2a1b4d] border border-purple-700/50 p-4 flex items-center gap-4 hover:border-purple-400 transition-all group shadow-[0_0_15px_rgba(128,90,213,0.3)] hover:shadow-[0_0_25px_rgba(128,90,213,0.6)]"
                    >
                        <div className="bg-black/40 p-3 rounded-full text-purple-400 group-hover:text-purple-200 group-hover:bg-purple-900/40 transition-colors">
                            <span className="text-2xl">✍️</span>
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-serif font-bold text-purple-200 group-hover:text-white">クエストを創る</div>
                            <div className="text-xs text-purple-400/80">クリエイターエディタへのアクセス</div>
                        </div>
                    </button>
                )}
            </section>
        </>
    );
}
