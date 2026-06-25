import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Key, Coins, Check, ArrowRight, Loader2 } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { soundManager } from '@/lib/soundManager';

interface Props {
    onClose: () => void;
    onOpenBilling: () => void;
}

export default function StarterPackPromoModal({ onClose, onOpenBilling }: Props) {
    const { userProfile } = useGameStore();
    const [isCancelling, setIsCancelling] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const hasStarter = !!userProfile?.has_purchased_starter;
    const hasElite = !!userProfile?.has_purchased_elite;

    // 両方購入済みの場合は基本表示されないが、念のための安全ガード
    if (hasStarter && hasElite) {
        return null;
    }

    const handleConfirm = () => {
        soundManager?.playSE('se_click');
        onOpenBilling();
        onClose();
    };

    const handleCancel = () => {
        setIsCancelling(true);
        soundManager?.playSE('se_click');
        setTimeout(() => {
            onClose();
        }, 250);
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85 pointer-events-none" />
            <div className="relative z-10 w-full max-w-2xl bg-[#0b0d19]/95 border border-amber-500/25 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* ヘッダー画像エリア */}
                <div className="relative w-full h-44 sm:h-52 bg-slate-950 border-b border-amber-500/10 flex items-center justify-center overflow-hidden shrink-0">
                    <img 
                        src="/images/promos/promo_starter_pack.png" 
                        alt="Promo Banner" 
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d19] via-transparent to-black/35" />
                    
                    {/* 右上の閉じるボタン */}
                    <button 
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 border border-slate-800 text-slate-400 hover:text-white active:scale-95 transition-all z-20 disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>

                    <div className="absolute bottom-4 left-6 right-6 text-left">
                        <span className="text-[10px] text-amber-400 font-black tracking-widest uppercase border border-amber-500/20 px-2 py-0.5 rounded bg-black/40">特別パッケージ案内</span>
                        <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-wider drop-shadow-md">旅路を拓く古の契約</h2>
                    </div>
                </div>

                {/* スクロールコンテンツ */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 世界観に沿ったテキスト */}
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center">
                        <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed whitespace-pre-line tracking-wide">
                            {`「見事であった。\n険しさを増すこれからの旅路に備え、旅人の力となる『スターターパック』、そして深淵なる知識を秘めた『エリートパック』に興味はあるか？興味があるのであれば、内容を確認し、汝のデッキをさらに強固なものとするが良い……」`}
                        </p>
                    </div>

                    {/* 2つのパッケージの比較カード */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* スターターパック */}
                        <div className={`rounded-xl border p-4 flex flex-col justify-between relative bg-black/35 transition-all ${
                            hasStarter ? 'border-slate-800/80 opacity-60' : 'border-slate-700/80 hover:border-slate-600'
                        }`}>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-amber-500 font-black tracking-wider uppercase">STARTER PACK</span>
                                    {hasStarter && (
                                        <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-500 font-bold px-1.5 py-0.5 rounded">購入済み</span>
                                    )}
                                </div>
                                <h3 className="text-sm font-black text-slate-200">新米旅人の魔導スターターパック</h3>
                                
                                <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                                    <div className="flex justify-between items-center bg-[#070914]/60 p-1.5 rounded border border-slate-900">
                                        <span>🪙 無償ゴールド</span>
                                        <span className="font-bold text-amber-400">15,000 G</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-[#070914]/60 p-1.5 rounded border border-slate-900">
                                        <span>🔑 知識と契約 of 鍵 (basic)</span>
                                        <span className="font-bold text-slate-200">x 3</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 text-right mt-1 font-semibold">
                                        パック開封価値換算: <span className="text-amber-500">実質 30,000 G分</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-slate-900/50 flex justify-between items-center">
                                <span className="text-[10px] text-slate-400">初回1回限り</span>
                                <span className="text-sm font-black text-amber-100">480円 (税込)</span>
                            </div>
                        </div>

                        {/* エリートパック */}
                        <div className={`rounded-xl border p-4 flex flex-col justify-between relative bg-black/35 transition-all ${
                            hasElite ? 'border-slate-800/80 opacity-60' : 'border-indigo-500/20 hover:border-indigo-500/45'
                        }`}>
                            <div className="absolute -top-2.5 right-3 text-[7px] text-amber-400 font-black uppercase tracking-wider border border-amber-500/35 px-1.5 py-0.5 rounded bg-black/80">
                                超お得！
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-indigo-400 font-black tracking-wider uppercase">ELITE SPECIAL</span>
                                    {hasElite && (
                                        <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-500 font-bold px-1.5 py-0.5 rounded">購入済み</span>
                                    )}
                                </div>
                                <h3 className="text-sm font-black text-slate-200">深淵の知恵エリートスペシャルパック</h3>
                                
                                <div className="mt-3 space-y-1.5 text-xs text-slate-355">
                                    <div className="flex justify-between items-center bg-[#070914]/60 p-1.5 rounded border border-slate-900">
                                        <span>🪙 無償ゴールド</span>
                                        <span className="font-bold text-amber-400">30,000 G</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-[#070914]/60 p-1.5 rounded border border-slate-900">
                                        <span>🔑 知識と契約 of 鍵 (basic)</span>
                                        <span className="font-bold text-slate-200">x 8</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-[#070914]/60 p-1.5 rounded border border-slate-900">
                                        <span>🔑 魔道と鉄壁 of 鍵 (academy)</span>
                                        <span className="font-bold text-slate-200">x 5</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 text-right mt-1 font-semibold">
                                        パック開封価値換算: <span className="text-amber-500">実質 79,000 G分</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-slate-900/50 flex justify-between items-center">
                                <span className="text-[10px] text-slate-400">初回1回限り</span>
                                <span className="text-sm font-black text-amber-100">1,980円 (税込)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* フッター操作ボタン */}
                <div className="p-6 border-t border-slate-900 bg-slate-950 flex flex-col sm:flex-row gap-3 shrink-0">
                    <button
                        onClick={handleConfirm}
                        disabled={isCancelling}
                        className="flex-1 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 border border-amber-400/20 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_15px_rgba(245,158,11,0.15)] active:scale-98 disabled:opacity-50"
                    >
                        内容を確認する (ショップへ進む)
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="py-3.5 px-6 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-350 border border-slate-800 rounded-xl font-bold text-xs tracking-wider transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isCancelling ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                準備中...
                            </>
                        ) : (
                            'すぐに冒険を開始する'
                        )}
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}
