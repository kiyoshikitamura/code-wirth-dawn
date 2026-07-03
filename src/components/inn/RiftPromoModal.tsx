import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { soundManager } from '@/lib/soundManager';

interface Props {
    onClose: () => void;
}

export default function RiftPromoModal({ onClose }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleClose = () => {
        soundManager?.playSE('se_click');
        onClose();
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85 pointer-events-none" />
            <div className="relative z-10 w-full max-w-lg bg-[#0b0d19]/95 border border-amber-500/25 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* ヘッダー画像エリア */}
                <div className="relative w-full h-44 sm:h-48 bg-slate-950 border-b border-amber-500/10 flex items-center justify-center overflow-hidden shrink-0">
                    <img 
                        src="/images/quests/bg_rift_vargna_summon.png" 
                        alt="Rift Entrance Banner" 
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d19] via-transparent to-black/35" />
                    
                    {/* 右上の閉じるボタン */}
                    <button 
                        onClick={handleClose}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 border border-slate-800 text-slate-400 hover:text-white active:scale-95 transition-all z-20"
                    >
                        <X size={16} />
                    </button>

                    <div className="absolute bottom-4 left-6 right-6 text-left">
                        <span className="text-[10px] text-rose-400 font-black tracking-widest uppercase border border-rose-500/20 px-2 py-0.5 rounded bg-black/40">ギルド特報</span>
                        <h2 className="text-xl font-black text-white mt-1.5 tracking-wider drop-shadow-md">【警告】次元の裂け目の出現</h2>
                    </div>
                </div>

                {/* コンテンツ */}
                <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                    {/* 世界観に沿ったテキスト */}
                    <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-left">
                        <h3 className="text-sm font-black text-amber-400 mb-3 border-b border-amber-500/20 pb-1.5">各地の宿屋へ集う冒険者諸君へ。</h3>
                        <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed whitespace-pre-line tracking-wide">
                            {`近頃、世界の中心において空間が歪み、不気味な裂け目が発生しているとの報告が相次いでいる。ギルドではこれを『狭間の迷宮』と仮称し、直ちに警戒態勢を敷いた。

その最深部からは、これまで見たこともない異形の魔物たちの咆哮と、強大かつ禍々しい魔力の脈動が観測されている。また、内部には遥か古代に失われたはずの『未鑑定の遺物』が今なお眠っているという噂も囁かれている。

この裂け目は極めて危険であり、並大抵の力では生きて戻ることは叶わないだろう。よってギルドは、実力を認められた冒険者パーティにのみ、この狭間への立ち入りと調査を依頼したい。

自らの腕を信じ、次元の深淵へ挑む覚悟のある者は、心してギルド本部（クエスト掲示板）の調査令を確認せよ。

—— 冒険者ギルド本部より`}
                        </p>
                    </div>
                </div>

                {/* 操作エリア（閉じるボタンのみ） */}
                <div className="p-6 border-t border-slate-900 bg-slate-950 flex shrink-0">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 border border-amber-400/20 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(245,158,11,0.15)] active:scale-98"
                    >
                        <Check size={14} />
                        了解した
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}
