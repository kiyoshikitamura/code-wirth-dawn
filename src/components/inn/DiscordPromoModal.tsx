import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink } from 'lucide-react';
import { soundManager } from '@/lib/soundManager';

interface Props {
    onClose: () => void;
}

export default function DiscordPromoModal({ onClose }: Props) {
    const [mounted, setMounted] = useState(false);

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

    const handleJoinDiscord = () => {
        soundManager?.playSE('se_click');
        window.open('https://discord.gg/TUa7FZRhb', '_blank', 'noopener,noreferrer');
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
                        src="/images/quests/bg_tavern_night.png" 
                        alt="Tavern Night Banner" 
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
                        <span className="text-[10px] text-rose-400 font-black tracking-widest uppercase border border-rose-500/20 px-2 py-0.5 rounded bg-black/40">コミュニティ</span>
                        <h2 className="text-xl font-black text-white mt-1.5 tracking-wider drop-shadow-md">【お知らせ】プレイヤーコミュニティ（Discord）</h2>
                    </div>
                </div>

                {/* コンテンツ */}
                <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                    <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-left">
                        <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed whitespace-pre-line tracking-wide">
                            {`『Code:Wirth-Dawn』をプレイしていただきありがとうございます。

プレイヤーの皆様が攻略情報の交換や雑談、交流を行えるコミュニティサーバー（Discord）をご紹介します。 クラスのビルド相談、クエストの攻略情報、ファンアートの共有など、冒険をより楽しむための情報が日々交わされています。

皆様の旅路をより豊かにするため、ぜひお気軽にご参加ください。`}
                        </p>
                    </div>
                </div>

                {/* 操作エリア */}
                <div className="p-6 border-t border-slate-900 bg-slate-950 flex flex-col gap-3 shrink-0">
                    <button
                        onClick={handleJoinDiscord}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 border border-amber-400/20 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(245,158,11,0.15)] active:scale-98"
                    >
                        <ExternalLink size={14} />
                        コミュニティサーバー（Discord）はこちら
                    </button>
                    <button
                        onClick={handleClose}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl font-bold text-xs tracking-wider transition-all active:scale-98"
                    >
                        閉じる
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}
