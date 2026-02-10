
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Scenario } from '@/types/game';

interface QuestBoardProps {
    scenarios: Scenario[];
    loading: boolean;
    userLevel: number;
    onSelect: (scenario: Scenario) => void;
}

export default function QuestBoard({ scenarios, loading, userLevel, onSelect }: QuestBoardProps) {
    return (
        <div className="bg-[#e3d5b8] text-[#2c241b] p-4 md:p-6 rounded-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] border-4 border-[#8b5a2b] relative h-fit pb-8">
            {/* Board Header */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#8b5a2b] text-[#e3d5b8] px-4 py-1 text-xs font-bold tracking-widest shadow-md">
                QUEST BOARD
            </div>

            {loading ? (
                <div className="text-center py-12 text-[#5c4033] font-serif">
                    依頼を読み込み中...
                </div>
            ) : (
                <div className="space-y-4 pt-4">
                    {scenarios.map((s) => {
                        const recLevel = s.rec_level || 1;
                        const isRisky = recLevel > userLevel;
                        const isUrgent = s.is_urgent;

                        return (
                            <div key={s.id} className={`group hover:bg-[#d4c5a5] p-4 transition-colors border-b border-[#c2b280] last:border-0 cursor-pointer relative ${isUrgent ? 'bg-red-900/10' : ''}`} onClick={() => onSelect(s)}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-[#3e2723] text-lg font-serif flex items-center gap-2">
                                            {isUrgent && <span className="text-red-600 animate-pulse text-xs border border-red-600 px-1 rounded">URGENT</span>}
                                            {s.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${isRisky ? 'bg-red-600 text-white' : 'bg-[#a38b6b] text-white'}`}>
                                                Lv.{recLevel}
                                            </span>
                                            {isRisky && (
                                                <span className="text-red-600 text-xs font-bold flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> 危険
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="bg-[#8b5a2b] text-[#e3d5b8] text-xs px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                                        金貨 {s.reward_gold}
                                    </span>
                                </div>
                                <p className="text-[#5d4037] text-sm mb-3 line-clamp-2">
                                    {s.description}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-[#5d4037]/80">
                                    <span>依頼主: {s.client_name}</span>
                                    <div className="flex gap-2">
                                        {s.impacts?.order && s.impacts.order > 0 && <span className="text-blue-800">秩序↑</span>}
                                        {s.impacts?.chaos && s.impacts.chaos > 0 && <span className="text-purple-800">混沌↑</span>}
                                        {s.impacts?.justice && s.impacts.justice > 0 && <span className="text-yellow-800">正義↑</span>}
                                    </div>
                                </div>

                                <button
                                    className={`absolute right-4 bottom-4 text-xs px-4 py-2 rounded shadow-lg transition-transform hover:scale-105 active:scale-95 ${isRisky ? 'bg-red-800 text-white' : 'bg-[#3e2723] text-gold-500'}`}
                                    onClick={(e) => { e.stopPropagation(); onSelect(s); }}
                                >
                                    {isRisky ? '危険を承知で受ける' : '受領する'}
                                </button>
                            </div>
                        );
                    })}
                    {scenarios.length === 0 && (
                        <div className="text-center py-8 text-[#5d4037]">現在、依頼はありません。</div>
                    )}
                </div>
            )}
        </div>
    );
}
