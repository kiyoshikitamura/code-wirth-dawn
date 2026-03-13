'use client';

import React from 'react';
import { Location } from '@/types/game';
import { User as UserIcon, Map as MapIcon } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

export interface MappedLocation extends Location {
    isCurrent: boolean;
    reachable: boolean;
    statusLabel: string;
    typeStyle: 'prosperous' | 'normal' | 'collapsed';
    emblem: string;
    travelDays: number;
    travelCost: number;
}

interface Props {
    visibleLocations: MappedLocation[];
    onSelectLocation: (loc: MappedLocation) => void;
    onOpenWorldMap: () => void;
}

export default function LocalMapView({ visibleLocations, onSelectLocation, onOpenWorldMap }: Props) {
    const { userProfile } = useGameStore();
    const containerRef = React.useRef<HTMLDivElement>(null);
    const canvasRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // Automatically scroll to the current location on mount or when visibleLocations change
        if (containerRef.current && canvasRef.current) {
            const currentLoc = visibleLocations.find(l => l.isCurrent);
            if (currentLoc && currentLoc.x !== null && currentLoc.y !== null) {
                const canvasW = canvasRef.current.clientWidth;
                const canvasH = canvasRef.current.clientHeight;

                // Calculate pixel position of the current location based on percentage
                const locPixelX = canvasW * (currentLoc.x / 100);
                const locPixelY = canvasH * (currentLoc.y / 100);

                const containerW = containerRef.current.clientWidth;
                const containerH = containerRef.current.clientHeight;

                // Center the scroll
                const scrollLeft = locPixelX - (containerW / 2);
                const scrollTop = locPixelY - (containerH / 2);

                containerRef.current.scrollTo({
                    left: Math.max(0, scrollLeft),
                    top: Math.max(0, scrollTop),
                    behavior: 'smooth'
                });
            }
        }
    }, [visibleLocations]);

    return (
        <div ref={containerRef} className="relative w-full flex-1 bg-[#050b14] overflow-auto scrollbar-hide">
            {/* Background Texture Container */}
            <div ref={canvasRef} className="relative min-w-[1200px] min-h-[1200px] w-full h-full bg-slate-900 overflow-hidden">
                <div
                    className="absolute inset-0 bg-no-repeat bg-cover bg-center opacity-80 mix-blend-screen"
                    style={{ backgroundImage: 'url("/backgrounds/worldmap.png")' }}
                />
                <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-leather.png")' }} />

                {/* Dotted lines for connections could go here if we want to draw them between current and reachable (Optional enhancement) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                    {visibleLocations.filter(l => !l.isCurrent && l.reachable).map(loc => {
                        const currentLoc = visibleLocations.find(l => l.isCurrent);
                        if (!currentLoc) return null;
                        return (
                            <line
                                key={`path-${loc.id}`}
                                x1={`${currentLoc.x}%`} y1={`${currentLoc.y}%`}
                                x2={`${loc.x}%`} y2={`${loc.y}%`}
                                stroke="#b45309" strokeWidth="2" strokeDasharray="6,4" className="drop-shadow-md"
                            />
                        );
                    })}
                </svg>

                {visibleLocations.map((loc, i) => {
                    const centerFallbackX = 50 + (Math.cos(i) * 20); // create a semi-random circle if missing
                    const centerFallbackY = 50 + (Math.sin(i) * 20);
                    const prosperity = loc.prosperity_level || 3;
                    const isZenith = prosperity >= 5;
                    const isRuined = prosperity <= 1;

                    return (
                        <div
                            key={loc.id}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group ${loc.isCurrent ? 'cursor-default z-30' : 'cursor-pointer z-20'}`}
                            style={{ left: `${loc.x ?? centerFallbackX}%`, top: `${loc.y ?? centerFallbackY}%` }}
                            onClick={() => { if (!loc.isCurrent) onSelectLocation(loc) }}
                        >
                            {/* Prosperity Effects */}
                            {isZenith && <div className="absolute w-24 h-24 bg-amber-400 rounded-full mix-blend-overlay blur-xl animate-pulse-slow opacity-60 pointer-events-none" />}
                            {isRuined && <div className="absolute w-20 h-20 bg-red-950 rounded-full mix-blend-multiply blur-xl animate-pulse-slow opacity-80 pointer-events-none" />}

                            <div className={`
                    relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-900 border-2 flex items-center justify-center text-xl md:text-2xl shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:scale-110
                    ${isZenith ? 'border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''}
                    ${isRuined ? 'border-red-900 text-red-500 shadow-[0_0_15px_rgba(127,29,29,0.8)] grayscale' : ''}
                    ${!isZenith && !isRuined ? (loc.typeStyle === 'prosperous' ? 'border-amber-600' : 'border-slate-700') : ''}
                  `}>
                                <span className={`z-10 ${isRuined ? 'opacity-50' : ''}`}>{loc.emblem}</span>
                                {loc.reachable && (
                                    <div className="absolute -inset-1 rounded-full border border-blue-500/40 animate-pulse pointer-events-none" />
                                )}
                            </div>
                            <span className={`mt-2 text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded border whitespace-nowrap drop-shadow-md
                                ${isRuined ? 'text-red-300 bg-red-950/80 border-red-900/50' : 'text-amber-100/90 bg-black/80 border-amber-900/40'}
                            `}>
                                {loc.name}
                            </span>

                            {loc.isCurrent && (
                                <div className="absolute -top-14 md:-top-16 flex flex-col items-center animate-bounce z-40">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-amber-400 bg-slate-900 flex items-center justify-center text-amber-500 shadow-[0_5px_15px_rgba(251,191,36,0.4)] overflow-hidden pointer-events-none">
                                        {userProfile?.avatar_url ? (
                                            <img src={userProfile.avatar_url} alt="You" className="object-cover w-full h-full" />
                                        ) : (
                                            <UserIcon size={24} />
                                        )}
                                    </div>
                                    <div className="w-1 h-4 md:h-5 bg-gradient-to-b from-amber-400 to-transparent" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 世界地図アイコン - Fixed to viewport bottom right, outside the scrollable map area */}
            <div className="fixed bottom-24 right-6 z-40 transform translate-x-0 sm:-translate-x-[calc(50vw-224px)] md:-translate-x-[calc(50vw-224px)] lg:-translate-x-[calc(50vw-224px)]">
                <button
                    onClick={onOpenWorldMap}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className="w-14 h-14 bg-slate-900 border-2 border-amber-600 rounded-2xl flex items-center justify-center shadow-2xl text-amber-500 group-hover:bg-amber-950 transition-colors active:scale-95">
                        <MapIcon size={28} />
                    </div>
                    <span className="text-[10px] font-bold text-amber-500 bg-black/80 px-2 py-1 rounded shadow-lg border border-amber-900/50 whitespace-nowrap">地図を広げる</span>
                </button>
            </div>
        </div>
    );
}
