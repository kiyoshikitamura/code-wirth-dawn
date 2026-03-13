'use client';

import React from 'react';
import { Settings, MapPin, Info, LogOut, X } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

interface QuestSettingsModalProps {
    onClose: () => void;
    onGiveUp: () => void;
    title?: string;
    description?: string;
}

export default function QuestSettingsModal({ onClose, onGiveUp, title, description }: QuestSettingsModalProps) {
    const { userProfile, worldState } = useGameStore();
    const location = userProfile?.locations;

    return (
        <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full bg-slate-900 border border-amber-900/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80%]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 shrink-0">
                    <h2 className="text-amber-500 font-bold flex items-center gap-2">
                        <Settings size={18} /> システム設定
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <section>
                        <h3 className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                            <MapPin size={12} /> Current Location
                        </h3>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <p className="text-slate-200 text-sm font-bold">{location?.name || '未知の領域'}</p>
                            <p className="text-slate-500 text-[10px] mt-1">
                                座標: X-{location?.x ?? '??'}, Y-{location?.y ?? '??'} / 繁栄度: {location?.prosperity_level ?? '?'}
                            </p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                            <Info size={12} /> Quest Details
                        </h3>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <p className="text-amber-200 text-xs font-serif leading-relaxed whitespace-pre-wrap">
                                <span className="font-bold text-amber-500 block mb-1">依頼: {title || '探索'}</span>
                                {description || '現在進行中のクエスト詳細はありません。'}
                            </p>
                        </div>
                    </section>

                    <section className="pt-4 border-t border-slate-800">
                        <button
                            onClick={onGiveUp}
                            className="w-full py-3 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-400 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors"
                        >
                            <LogOut size={16} /> クエストをギブアップ
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
}
