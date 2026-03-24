import React from 'react';
import { BookOpen, MessageSquare, MapPin } from 'lucide-react';
import { WorldState } from '@/types/game';

interface MainVisualAreaProps {
    worldState: WorldState | null;
    onOpenHistory: () => void;
    onOpenRumors: () => void;
    showHistoryBadge?: boolean;
    showRumorsBadge?: boolean;
}

export default function MainVisualArea({ worldState, onOpenHistory, onOpenRumors, showHistoryBadge, showRumorsBadge }: MainVisualAreaProps) {
    const prosperity = worldState?.prosperity_level || 3;
    let bgEffect = "bg-[radial-gradient(circle_at_center,_transparent_0%,_#1a1a1a_100%)]";
    let iconColor = "text-slate-800";

    if (prosperity >= 4) {
        bgEffect = "bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(212,175,55,0.1)_100%)]";
        iconColor = "text-amber-900/40";
    } else if (prosperity <= 2) {
        bgEffect = "bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(153,27,27,0.1)_100%)]";
        iconColor = "text-red-950/60";
    }

    return (
        <div className="relative h-48 md:h-64 bg-slate-900 overflow-hidden shrink-0 border-b border-amber-900/50 shadow-inner">
            <div className={`absolute inset-0 opacity-40 pointer-events-none ${bgEffect}`} />
            <div className={`absolute inset-0 flex items-center justify-center ${iconColor} opacity-20 scale-[2.5]`}>
                <MapPin size={180} />
            </div>

            <div className="absolute bottom-4 right-4 flex gap-3 z-10">
                <button
                    onClick={onOpenHistory}
                    className="relative w-12 h-12 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-600/50 shadow-lg flex items-center justify-center text-amber-500 hover:bg-amber-900/80 hover:text-amber-300 transition-colors active:scale-95 focus:outline-none"
                >
                    <BookOpen size={24} />
                    {showHistoryBadge && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[10px] text-white font-black animate-bounce shadow-lg border-2 border-slate-950">
                            !
                        </span>
                    )}
                </button>
                <button
                    onClick={onOpenRumors}
                    className="relative w-12 h-12 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-600/50 shadow-lg flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors active:scale-95 focus:outline-none"
                >
                    <MessageSquare size={24} />
                    {showRumorsBadge && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[10px] text-white font-black animate-bounce shadow-lg border-2 border-slate-950">
                            !
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
