import React from 'react';
import { BookOpen, MessageSquare, MapPin } from 'lucide-react';
import { WorldState } from '@/types/game';

interface MainVisualAreaProps {
    worldState: WorldState | null;
    onOpenHistory: () => void;
    onOpenRumors: () => void;
}

export default function MainVisualArea({ worldState, onOpenHistory, onOpenRumors }: MainVisualAreaProps) {
    // 繁栄度に応じたエフェクトの決定
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
            {/* メインビジュアル背景（今回はマップアイコンの巨大版とグラデーションで代用） */}
            <div className={`absolute inset-0 opacity-40 pointer-events-none ${bgEffect}`} />
            <div className={`absolute inset-0 flex items-center justify-center ${iconColor} opacity-20 scale-[2.5]`}>
                <MapPin size={180} />
            </div>

            {/* アクションボタン群を右下に配置 */}
            <div className="absolute bottom-4 right-4 flex gap-3 z-10">
                <button
                    onClick={onOpenHistory}
                    className="w-12 h-12 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-600/50 shadow-lg flex items-center justify-center text-amber-500 hover:bg-amber-900/80 hover:text-amber-300 transition-colors active:scale-95 focus:outline-none"
                >
                    <BookOpen size={24} />
                </button>
                <button
                    onClick={onOpenRumors}
                    className="w-12 h-12 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-600/50 shadow-lg flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors active:scale-95 focus:outline-none"
                >
                    <MessageSquare size={24} />
                </button>
            </div>
        </div>
    );
}
