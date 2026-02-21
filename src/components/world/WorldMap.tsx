
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LocationDB } from '@/types/game';
import { MapPin } from 'lucide-react';

interface Props {
    currentLocationName?: string;
    destinationName?: string;
    className?: string;
}

export default function WorldMap({ currentLocationName, destinationName, className = "" }: Props) {
    const [locations, setLocations] = useState<LocationDB[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLocations = async () => {
            const { data, error } = await supabase.from('locations').select('*');
            if (data) {
                setLocations(data as LocationDB[]);
            }
            setLoading(false);
        };
        fetchLocations();
    }, []);

    if (loading) return <div className="text-center text-gray-500 animate-pulse">Loading Map...</div>;

    // Determine current and dest IDs/Coordinates
    const currentLoc = locations.find(l => l.name === currentLocationName);
    const destLoc = locations.find(l => l.name === destinationName);

    // Simple projection: assume x,y are 0-100 or similar.
    // Spec says x,y exist.
    // If not, random fallback? No, data should have it.
    // Let's assume a 800x600 coordinate system mapped to %

    return (
        <div className={`relative w-full h-full min-h-[300px] bg-[#1a120b] border-2 border-[#8b5a2b] overflow-hidden rounded-lg shadow-inner ${className}`}>
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-20 bg-[url('/assets/map_texture.jpg')] bg-cover bg-center mix-blend-overlay pointer-events-none" />

            {/* Grid Lines (Decoration) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(139,90,43,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,90,43,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Connections (Optional - requires neighbor data) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                {locations.map(loc => {
                    // Draw lines if neighbors exist. 
                    // Since neighbors is JSONB, checking if we can parse.
                    // For now, draw simple line between current and dest if both exist
                    return null;
                })}
                {currentLoc && destLoc && (
                    <line
                        x1={`${currentLoc.map_x || 50}%`} y1={`${currentLoc.map_y || 50}%`}
                        x2={`${destLoc.map_x || 50}%`} y2={`${destLoc.map_y || 50}%`}
                        stroke="#e3d5b8" strokeWidth="2" strokeDasharray="5,5"
                        className="animate-pulse"
                    />
                )}
            </svg>

            {/* Locations */}
            {locations.map(loc => {
                const isCurrent = loc.name === currentLocationName;
                const isDest = loc.name === destinationName;
                const isHighlight = isCurrent || isDest;

                // Fallback coordinates if missing
                const left = loc.map_x ?? (Math.random() * 80 + 10);
                const top = loc.map_y ?? (Math.random() * 80 + 10);

                return (
                    <div
                        key={loc.id}
                        className={`absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500
                            ${isHighlight ? 'z-20 scale-110' : 'z-10 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105'}
                        `}
                        style={{ left: `${left}%`, top: `${top}%` }}
                    >
                        <div className={`
                            w-3 h-3 md:w-4 md:h-4 rounded-full border-2 shadow-[0_0_10px_black]
                            ${isCurrent ? 'bg-blue-500 border-white shadow-[0_0_15px_blue]' :
                                isDest ? 'bg-red-500 border-white shadow-[0_0_15px_red] animate-bounce' :
                                    'bg-[#8b5a2b] border-[#3e2723]'}
                        `} />

                        <span className={`
                            mt-1 text-[10px] md:text-xs whitespace-nowrap px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-[#a38b6b]/30
                            ${isHighlight ? 'text-[#e3d5b8] font-bold border-[#e3d5b8]/50' : 'text-gray-400'}
                        `}>
                            {loc.name}
                        </span>

                        {isCurrent && <div className="absolute -top-6 text-blue-400 text-[10px] font-bold animate-bounce">YOU</div>}
                        {isDest && <div className="absolute -top-6 text-red-400 text-[10px] font-bold animate-bounce hidden md:block">GOAL</div>}
                    </div>
                );
            })}
        </div>
    );
}
