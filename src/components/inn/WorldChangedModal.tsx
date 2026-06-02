import React from 'react';
import { Hourglass, Newspaper, X } from 'lucide-react';
import { soundManager } from '@/lib/soundManager';

interface WorldChangedModalProps {
    onOpenGougai: () => void;
    onClose: () => void;
}

export default function WorldChangedModal({ onOpenGougai, onClose }: WorldChangedModalProps) {
    React.useEffect(() => {
        // コンポーネント表示時にSE再生
        soundManager?.playSE('se_modal_open');
    }, []);

    const handleConfirm = () => {
        soundManager?.playSE('se_click');
        onOpenGougai();
    };

    const handleCancel = () => {
        soundManager?.playSE('se_click');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-sm bg-[#0d1b3e]/90 text-gray-200 border-2 border-amber-500/40 rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center gap-4 text-center overflow-hidden">
                
                {/* Decorative background glow */}
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Rotating Hourglass Icon */}
                <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/30 mb-2 relative">
                    <Hourglass 
                        className="w-10 h-10 text-amber-400"
                        style={{ animation: 'spin 8s linear infinite' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 border border-amber-500/20 rounded-full animate-ping duration-1000" />
                    </div>
                </div>

                <h3 className="text-xl font-serif font-black tracking-wider text-amber-300">
                    世界の情勢が変化しました
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed font-serif px-2">
                    6時間の周期が巡り、世界各国の勢力バランスと拠点の繁栄度が更新されました。<br />最新の出来事を確認しますか？
                </p>

                <div className="w-full flex flex-col gap-2 mt-4">
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40"
                    >
                        <Newspaper className="w-4 h-4" />
                        号外を読む
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/50 hover:border-slate-600 rounded-xl"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}
