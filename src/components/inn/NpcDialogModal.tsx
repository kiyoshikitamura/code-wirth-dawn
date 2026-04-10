import React, { useState, useEffect, useRef } from 'react';
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
    onClose: () => void;
    onAction: () => void;
    buttonText?: string;
    isDisabled?: boolean;
    secondaryActions?: SecondaryAction[];
}

// Typewriter hook
function useTypewriter(text: string, speed: number = 30) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    const indexRef = useRef(0);

    useEffect(() => {
        setDisplayed('');
        setDone(false);
        indexRef.current = 0;

        if (!text) { setDone(true); return; }

        const timer = setInterval(() => {
            indexRef.current++;
            if (indexRef.current >= text.length) {
                setDisplayed(text);
                setDone(true);
                clearInterval(timer);
            } else {
                setDisplayed(text.slice(0, indexRef.current));
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed]);

    const skip = () => { setDisplayed(text); setDone(true); };

    return { displayed, done, skip };
}

export default function NpcDialogModal({ npcData, onClose, onAction, buttonText, isDisabled, secondaryActions }: NpcDialogModalProps) {
    if (!npcData) return null;

    const isBanned = npcData.isBanned;
    const { displayed, done, skip } = useTypewriter(npcData.dialogue, 30);

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
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 rounded p-1">
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
                            「{displayed}{!done && <span className="inline-block w-0.5 h-4 bg-amber-500/70 animate-pulse ml-0.5 align-middle" />}」
                        </p>
                    </div>

                    {/* ボタン群 */}
                    <div className="w-full mt-5 flex flex-col gap-2.5">
                        {/* メインボタン */}
                        <button
                            onClick={(isDisabled || isBanned) ? undefined : onAction}
                            disabled={isDisabled || isBanned}
                            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all focus:outline-none focus:ring-2 
                                ${isBanned
                                    ? 'bg-red-900/40 text-red-300 border border-red-700 cursor-not-allowed'
                                    : isDisabled
                                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                        : 'bg-amber-900/40 hover:bg-amber-800/60 border border-amber-600 text-amber-100 active:scale-95 focus:ring-amber-500'}`}
                        >
                            {isBanned ? '出入り禁止' : buttonText || `${npcData.facilityName}の機能を利用する`}
                        </button>

                        {/* セカンダリボタン（宿屋の「冒険者を探す」等） */}
                        {!isBanned && secondaryActions?.map((action, i) => (
                            <button
                                key={i}
                                onClick={action.onClick}
                                className="w-full py-3 rounded-xl font-bold text-sm border border-amber-600 bg-amber-900/30 text-amber-100 hover:bg-amber-800/50 hover:text-white transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
