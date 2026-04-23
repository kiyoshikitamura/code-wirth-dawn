'use client';

import React, { useState } from 'react';
import { Settings, MapPin, Info, LogOut, X, Volume2, VolumeX, Music, Bell } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { soundManager } from '@/lib/soundManager';

interface QuestSettingsModalProps {
    onClose: () => void;
    onGiveUp: () => void;
    title?: string;
    description?: string;
}

export default function QuestSettingsModal({ onClose, onGiveUp, title, description }: QuestSettingsModalProps) {
    const { userProfile } = useGameStore();
    const location = userProfile?.locations;

    // サウンド設定
    const [bgmOn, setBgmOn] = useState(soundManager?.getBgmEnabled() ?? true);
    const [seOn, setSeOn] = useState(soundManager?.getSeEnabled() ?? true);

    const toggleBgm = () => {
        const next = !bgmOn;
        setBgmOn(next);
        soundManager?.setBgmEnabled(next);
    };
    const toggleSe = () => {
        const next = !seOn;
        setSeOn(next);
        soundManager?.setSeEnabled(next);
    };

    return (
        <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full bg-slate-900 border border-amber-900/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80%]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 shrink-0">
                    <h2 className="text-amber-500 font-bold flex items-center gap-2">
                        <Settings size={18} /> クエスト設定
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* 現在地 */}
                    <section>
                        <h3 className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                            <MapPin size={12} /> 現在地
                        </h3>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <p className="text-slate-200 text-sm font-bold">{location?.name || '未知の領域'}</p>
                        </div>
                    </section>

                    {/* サウンド設定 */}
                    <section>
                        <h3 className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                            <Volume2 size={12} /> サウンド設定
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                <div className="flex items-center gap-2">
                                    <Music size={14} className="text-amber-500" />
                                    <span className="text-slate-300 text-sm">BGM</span>
                                </div>
                                <button
                                    onClick={toggleBgm}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${bgmOn ? 'bg-amber-600' : 'bg-slate-700'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${bgmOn ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                <div className="flex items-center gap-2">
                                    <Bell size={14} className="text-amber-500" />
                                    <span className="text-slate-300 text-sm">効果音</span>
                                </div>
                                <button
                                    onClick={toggleSe}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${seOn ? 'bg-amber-600' : 'bg-slate-700'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${seOn ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* クエスト詳細 */}
                    <section>
                        <h3 className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                            <Info size={12} /> クエスト詳細
                        </h3>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <p className="text-amber-200 text-xs font-serif leading-relaxed whitespace-pre-wrap">
                                <span className="font-bold text-amber-500 block mb-1">依頼: {title || '探索'}</span>
                                {description || '現在進行中のクエスト詳細はありません。'}
                            </p>
                        </div>
                    </section>

                    {/* ギブアップ */}
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
