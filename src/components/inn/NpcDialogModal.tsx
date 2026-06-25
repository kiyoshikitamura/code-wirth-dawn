import React, { useState, useEffect } from 'react';
import { User, X, Ban } from 'lucide-react';

export interface NpcDialogData {
    facilityName: string;
    role: string;
    name: string;
    dialogue: string;
    imageUrl?: string;
    isBanned?: boolean;
}

export interface SecondaryAction {
    label: string;
    onClick: () => void;
}

interface NpcDialogModalProps {
    npcData: NpcDialogData;
    onClose: () => void | Promise<void>;
    onAction: () => void | Promise<void>;
    buttonText?: string;
    isDisabled?: boolean;
    secondaryActions?: SecondaryAction[];
}

// Typewriter hook
function useTypewriter(text: string, speed: number = 30) {
    const [prevText, setPrevText] = useState(text);
    const [displayed, setDisplayed] = useState(speed <= 0 ? text : '');
    const [done, setDone] = useState(speed <= 0 ? true : false);

    if (text !== prevText) {
        setPrevText(text);
        if (speed <= 0) {
            setDisplayed(text);
            setDone(true);
        } else {
            setDisplayed('');
            setDone(text ? false : true);
        }
    }

    useEffect(() => {
        if (!text || speed <= 0) return;

        const timer = setInterval(() => {
            setDisplayed(prev => {
                const nextLen = prev.length + 1;
                if (nextLen >= text.length) {
                    setDone(true);
                    clearInterval(timer);
                    return text;
                }
                return text.slice(0, nextLen);
            });
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed]);

    const skip = () => { setDisplayed(text); setDone(true); };

    return { displayed, done, skip };
}

export default function NpcDialogModal({ npcData, onClose, onAction, buttonText, isDisabled, secondaryActions }: NpcDialogModalProps) {
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [clickedAction, setClickedAction] = useState<'main' | 'close' | number | null>(null);
    
    if (!npcData) return null;

    const isBanned = npcData.isBanned;
    const isTheodore = npcData.name === 'テオドール';
    const { displayed, done, skip } = useTypewriter(npcData.dialogue, isTheodore ? 0 : 30);

    const handleClose = async () => {
        if (isActionLoading) return;
        setIsActionLoading(true);
        setClickedAction('close');
        setTimeout(async () => {
            try {
                await onClose();
            } catch (e) {
                console.error('[NpcDialogModal] onClose failed:', e);
                setIsActionLoading(false);
                setClickedAction(null);
            }
        }, 0);
    };

    const handleAction = async () => {
        if (isActionLoading || isDisabled || isBanned) return;
        setIsActionLoading(true);
        setClickedAction('main');
        setTimeout(async () => {
            try {
                await onAction();
            } catch (e) {
                console.error('[NpcDialogModal] onAction failed:', e);
                setIsActionLoading(false);
                setClickedAction(null);
            }
        }, 0);
    };

    const handleSecondaryAction = async (onClick: () => void | Promise<void>, index: number) => {
        if (isActionLoading) return;
        setIsActionLoading(true);
        setClickedAction(index);
        setTimeout(async () => {
            try {
                await onClick();
            } catch (e) {
                console.error('[NpcDialogModal] secondaryAction failed:', e);
                setIsActionLoading(false);
                setClickedAction(null);
            }
        }, 0);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-start pt-20 justify-center p-4 sm:p-6">
            <div className={`w-full max-w-md border rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-top duration-300 ${
                isBanned ? 'bg-red-950/90 border-red-800/60' : 'bg-slate-900 border-amber-900/50'
            }`}>

                {/* Header */}
                <div className={`px-5 py-3 border-b flex justify-between items-center ${
                    isBanned ? 'border-red-800/40 bg-red-950/50' : 'border-slate-800 bg-slate-950/50'
                }`}>
                    <h2 className={`font-bold flex items-center gap-2 ${isBanned ? 'text-red-400' : 'text-amber-500'}`}>
                        {isBanned && <Ban size={14} className="text-red-500" />}
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">{npcData.facilityName}</span>
                    </h2>
                    <button 
                        onClick={handleClose} 
                        disabled={isActionLoading}
                        className="text-slate-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 rounded p-1 disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content — 縦積みレイアウト */}
                <div className="px-6 pt-5 pb-6 flex flex-col items-center">

                    {/* 役職 + 名前 */}
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5 ${
                        isBanned ? 'text-red-400' : 'text-amber-500'
                    }`}>{npcData.role}</p>
                    <h3 className="text-xl font-black text-slate-100 mb-3 tracking-wide">{npcData.name}</h3>

                    {/* ポートレート (大きめ) */}
                    <div className={`w-36 h-36 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden mb-5 ${
                        isBanned ? 'border-red-700/50 bg-red-950/40' : 'border-amber-600/30 bg-slate-800'
                    }`}>
                        {npcData.imageUrl ? (
                            <img src={npcData.imageUrl} alt={npcData.name} className="w-full h-full object-cover" />
                        ) : (
                            <User size={64} className="text-amber-600/30" />
                        )}
                    </div>

                    {/* セリフ欄 — DIALOG ラベルなし、タイプライター演出 */}
                    <div
                        className={`w-full border rounded-xl p-4 min-h-[80px] flex items-start shadow-inner cursor-pointer ${
                            isBanned ? 'bg-red-950/40 border-red-800/40' : 'bg-black/40 border-slate-800'
                        }`}
                        onClick={!done ? skip : undefined}
                    >
                        <p className={`text-sm md:text-base leading-relaxed font-serif italic ${
                            isBanned ? 'text-red-200' : 'text-slate-200'
                        }`}>
                            「{isTheodore ? npcData.dialogue : displayed}{!(isTheodore || done) && <span className="inline-block w-0.5 h-4 bg-amber-500/70 animate-pulse ml-0.5 align-middle" />}」
                        </p>
                    </div>

                    {/* ボタン群 */}
                    <div className="w-full mt-5 flex flex-col gap-2.5">
                        {/* メインボタン */}
                        <button
                            onClick={handleAction}
                            disabled={isDisabled || isBanned || isActionLoading}
                            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all focus:outline-none focus:ring-2 
                                ${isBanned
                                    ? 'bg-red-900/40 text-red-300 border border-red-700 cursor-not-allowed'
                                    : (isDisabled || isActionLoading)
                                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                        : 'bg-amber-900/40 hover:bg-amber-800/60 border border-amber-600 text-amber-100 active:scale-95 focus:ring-amber-500'}`}
                        >
                            {isActionLoading && clickedAction === 'main' ? '読み込み中…' : (isBanned ? '出入り禁止' : buttonText || `${npcData.facilityName}の機能を利用する`)}
                        </button>

                        {/* セカンダリボタン（宿屋の「冒険者を探す」等） */}
                        {!isBanned && secondaryActions?.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => handleSecondaryAction(action.onClick, i)}
                                disabled={isActionLoading}
                                className={`w-full py-3 rounded-xl font-bold text-sm border transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500
                                    ${isActionLoading
                                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                        : 'border-amber-600 bg-amber-900/30 text-amber-100 hover:bg-amber-800/50 hover:text-white'}`}
                            >
                                {isActionLoading && clickedAction === i ? '読み込み中…' : action.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
