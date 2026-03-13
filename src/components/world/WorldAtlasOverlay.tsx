'use client';

import React from 'react';
import { MappedLocation } from './LocalMapView';
import { Map as MapIcon, X } from 'lucide-react';

interface Props {
    show: boolean;
    allLocations: MappedLocation[];
    onClose: () => void;
}

export default function WorldAtlasOverlay({ show, allLocations, onClose }: Props) {
    if (!show) return null;

    return (
        <div className="absolute inset-0 z-50 bg-[#120e0a] flex flex-col">
            <header className="p-4 flex items-center justify-between border-b border-amber-900/30 bg-slate-950">
                <h2 className="text-lg font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                    <MapIcon size={18} /> World Atlas
                </h2>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </header>

            <div className="flex-1 relative overflow-auto flex items-center justify-center bg-[#050b14] p-4">
                {/* Texture background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-leather.png")' }} />

                <div className="w-full max-w-sm md:max-w-md aspect-square relative border-2 border-amber-900/50 rounded-xl bg-slate-900 shadow-2xl shadow-black overflow-hidden">
                    <div className="absolute inset-0 bg-no-repeat bg-cover bg-center opacity-80 mix-blend-screen" style={{ backgroundImage: 'url("/backgrounds/worldmap.png")' }} />
                    <div className="absolute inset-0 z-10">
                        {/* ドットマップ表示（全拠点版） */}
                        {allLocations.map(loc => (
                            <div
                                key={loc.id}
                                className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                                style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                            >
                                <div className={`
                        w-3 h-3 rounded-full border 
                        ${loc.isCurrent ? 'bg-amber-400 border-white shadow-[0_0_10px_rgba(251,191,36,0.8)]' :
                                        loc.reachable ? 'bg-blue-400 border-blue-200' :
                                            loc.typeStyle === 'collapsed' ? 'bg-red-900 border-red-500' :
                                                'bg-slate-700 border-slate-600'}
                      `} />
                                <span className="text-[6px] md:text-[8px] text-amber-100/90 bg-black/80 px-1 py-0.5 mt-1 rounded border border-amber-900/40 whitespace-nowrap drop-shadow-md">{loc.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-amber-900/30 flex gap-4 text-[10px] text-slate-400 justify-center flex-wrap">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> 現在地</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400" /> 移動可能</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-800" /> 未踏/遠方</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full border border-red-500 bg-red-900" /> 崩壊域</div>
            </div>
        </div>
    );
}
