import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Sword } from 'lucide-react';
import { soundManager } from '@/lib/soundManager';

interface Props {
    onClose: () => void;
}

export default function ArenaPromoModal({ onClose }: Props) {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        soundManager?.playSE('se_click');
        onClose();
    };

    const handleGoToPlayGuide = () => {
        soundManager?.playSE('se_click');
        router.push('/play-guide');
        onClose();
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/85 pointer-events-none" />
            <div className="relative z-10 w-full max-w-lg bg-[#0b0d19]/95 border border-amber-500/25 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* ヘッダー画像エリア */}
                <div className="relative w-full h-44 sm:h-48 bg-slate-950 border-b border-amber-500/10 flex items-center justify-center overflow-hidden shrink-0">
                    <img 
                        src="/images/quests/bg_fort.png" 
                        alt="Arena Release Banner" 
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d19] via-transparent to-black/35" />
                    
                    {/* 右上の閉じるボタン */}
                    <button 
                        onClick={handleClose}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 border border-slate-800 text-slate-400 hover:text-white active:scale-95 transition-all z-20 cursor-pointer"
                    >
                        <X size={16} />
                    </button>

                    <div className="absolute bottom-4 left-6 right-6 text-left">
                        <span className="text-[10px] text-amber-400 font-black tracking-widest uppercase border border-amber-500/20 px-2 py-0.5 rounded bg-black/40">RELEASE</span>
                        <h2 className="text-xl font-black text-white mt-1.5 tracking-wider drop-shadow-md flex items-center gap-2">
                            <Sword size={20} className="text-amber-400" />
                            アリーナ（対人戦）ついに解禁！
                        </h2>
                    </div>
                </div>

                {/* コンテンツ */}
                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                    <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-left space-y-4">
                        <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed tracking-wide">
                            {`宿屋の闘技場（コロシアム）メニューから、他プレイヤーの防衛デッキと競い合う「アリーナ（対人戦）」が正式リリースされました。

自慢のパーティを率いて全国の冒険者の防衛デッキに挑戦し、アリーナレートを高めてランキングの頂点を目指しましょう。`}
                        </p>

                        <div className="border-t border-amber-500/20 pt-4">
                            <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                ★ アリーナリリース記念！残影・英霊 of 雇用費用が「半額」に！
                            </h3>
                            <p className="text-xs text-slate-300 font-medium leading-relaxed tracking-wide mt-2">
                                {`アリーナの正式解禁を記念し、他プレイヤーの「残影（Shadow）」および「英霊（Heroic）」を酒場で雇用する際の契約金を、従来の「半額」に引き下げました。

※ご自身の引退した歴代キャラクター（英霊）の雇用費用も同様に半額（Premiumプランならさらにお得な割引が適用）となります。

強力な仲間を引き連れ、アリーナや高難易度クエストの攻略へ出発しましょう！`}
                            </p>
                        </div>

                        <div className="border-t border-slate-800/80 pt-4 flex flex-col items-center justify-center gap-2">
                            <span className="text-[11px] text-slate-400 font-medium">↓詳細なルールはこちら↓</span>
                            <button
                                onClick={handleGoToPlayGuide}
                                className="px-5 py-2.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded-xl text-xs font-bold text-amber-400 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md"
                            >
                                📖 公式プレイガイドで確認する
                            </button>
                        </div>
                    </div>
                </div>

                {/* 操作エリア */}
                <div className="p-6 border-t border-slate-900 bg-slate-950 flex flex-col gap-3 shrink-0">
                    <button
                        onClick={handleClose}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 border border-amber-400/20 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(245,158,11,0.15)] active:scale-98 cursor-pointer"
                    >
                        冒険に戻る（閉じる）
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}
