'use client';

import React from 'react';
import { MappedLocation } from './LocalMapView';
import { X, ShieldAlert, Clock, Coins, Navigation } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

interface Props {
    selectedLocation: MappedLocation | null;
    onClose: () => void;
    onTravel: (loc: MappedLocation) => void;
}

export default function LocationDetailSheet({ selectedLocation, onClose, onTravel }: Props) {
    const { gold: playerGold } = useGameStore();

    if (!selectedLocation) return null;

    const canTravel = selectedLocation.reachable && playerGold >= selectedLocation.travelCost;
    const isCurrent = selectedLocation.isCurrent;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Modal */}
            <div className={`
              fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#1a120b] border-2 border-[#a38b6b]/60 rounded-xl p-6 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200
            `}>
                <button
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>

                <div className="flex gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
                        {selectedLocation.emblem}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase font-bold text-amber-500">{selectedLocation.statusLabel}</span>
                            <span className="text-[10px] text-slate-400">|</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <ShieldAlert size={10} />
                                所属: {selectedLocation.ruling_nation_id || '中立'}
                            </span>
                        </div>
                        <h2 className="text-xl font-black text-slate-100">{selectedLocation.name}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-black/40 p-3 rounded-xl border border-slate-800/50">
                        <span className="block text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Clock size={12} /> 所要日数</span>
                        <span className="text-lg font-bold text-slate-200">{selectedLocation.travelDays} Days</span>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-slate-800/50">
                        <span className="block text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Coins size={12} /> 移動費用</span>
                        <span className={`text-lg font-bold ${playerGold < selectedLocation.travelCost ? 'text-red-500' : 'text-amber-400'}`}>
                            {selectedLocation.travelCost} G
                        </span>
                    </div>
                </div>

                {!selectedLocation.reachable && !isCurrent && (
                    <div className="mb-4 text-[10px] text-red-400 bg-red-950/30 p-2 rounded border border-red-900/30 flex items-center gap-2">
                        <ShieldAlert size={12} />
                        現在地から直接移動することはできません。
                    </div>
                )}

                <button
                    onClick={() => onTravel(selectedLocation)}
                    className={`
                  w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                  ${isCurrent ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : ''}
                  ${!isCurrent && !selectedLocation.reachable ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : ''}
                  ${!isCurrent && canTravel ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(217,119,6,0.3)]' : ''}
                  ${!isCurrent && selectedLocation.reachable && !canTravel ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : ''}
                `}
                    disabled={isCurrent || !canTravel}
                >
                    {isCurrent ? '現在地' : (
                        <>
                            <Navigation size={18} />
                            出発する
                        </>
                    )}
                </button>
            </div>
        </>
    );
}
