import React from 'react';
import { User, X } from 'lucide-react';

export interface NpcDialogData {
    facilityName: string;
    role: string;
    name: string;
    dialogue: string;
}

interface NpcDialogModalProps {
    npcData: NpcDialogData;
    onClose: () => void;
    onAction: () => void;
    buttonText?: string;
    isDisabled?: boolean;
}

export default function NpcDialogModal({ npcData, onClose, onAction, buttonText, isDisabled }: NpcDialogModalProps) {
    if (!npcData) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-start pt-28 justify-center p-4 sm:p-6">
            <div className="w-full max-w-md bg-slate-900 border border-amber-900/50 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-top duration-300">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <h2 className="text-amber-500 font-bold flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">{npcData.facilityName}</span>
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 rounded">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex gap-4 mb-6">
                        <div className="w-20 h-20 bg-slate-800 rounded-xl border border-amber-600/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                            <User size={48} className="text-amber-600/40" />
                        </div>
                        <div className="flex-1 pt-1">
                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1">{npcData.role}</p>
                            <h3 className="text-xl font-black text-slate-100 mb-2">{npcData.name}</h3>
                            <div className="h-0.5 w-12 bg-amber-600/50 rounded" />
                        </div>
                    </div>

                    <div className="bg-black/40 border border-slate-800 rounded-xl p-5 min-h-[100px] flex items-center shadow-inner relative">
                        <div className="absolute top-0 left-4 -translate-y-1/2 bg-slate-900 border border-slate-800 px-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dialog</div>
                        <p className="text-sm md:text-base text-slate-200 leading-relaxed font-serif italic pb-1">
                            「{npcData.dialogue}」
                        </p>
                    </div>

                    <button
                        onClick={isDisabled ? undefined : onAction}
                        disabled={isDisabled}
                        className={`w-full mt-6 py-4 rounded-xl font-bold text-sm shadow-lg transition-all focus:outline-none focus:ring-2 
                            ${isDisabled
                                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                : 'bg-amber-900/40 hover:bg-amber-800/60 border border-amber-600 text-amber-100 active:scale-95 focus:ring-amber-500'}`}
                    >
                        {buttonText || `${npcData.facilityName}の機能を利用する`}
                    </button>
                </div>
            </div>
        </div>
    );
}
