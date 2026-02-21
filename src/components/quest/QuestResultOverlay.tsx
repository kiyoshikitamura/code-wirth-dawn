
import React from 'react';
import { useRouter } from 'next/navigation';
import { Scroll, Coins, MapPin, ArrowRight } from 'lucide-react';

interface QuestResultOverlayProps {
    result: 'success' | 'failure';
    rewards?: {
        gold?: number;
        exp?: number;
        items?: any[];
    };
    changes?: {
        gold_gained?: number;
        level_up?: any;
        new_location?: string;
    };
    onClose: () => void;
}

export default function QuestResultOverlay({ result, rewards, changes, onClose }: QuestResultOverlayProps) {
    const isSuccess = result === 'success';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-500">
            <div className={`
                relative w-full max-w-lg p-1 bg-[#1a120b] border-4 shadow-2xl transform transition-all scale-100
                ${isSuccess ? 'border-yellow-600 shadow-yellow-900/50' : 'border-red-900 shadow-red-900/50'}
            `}>
                {/* Inner Border & Content */}
                <div className="border border-[#e3d5b8]/20 p-8 flex flex-col items-center gap-6 bg-[url('/textures/paper.png')] bg-cover bg-blend-overlay">

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h2 className={`text-4xl md:text-5xl font-serif font-bold tracking-widest ${isSuccess ? 'text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-red-500'}`}>
                            {isSuccess ? 'QUEST CLEARED' : 'QUEST FAILED'}
                        </h2>
                        <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-[#e3d5b8] to-transparent opacity-50" />
                    </div>

                    {/* Rewards Section (Success Only) */}
                    {isSuccess && (
                        <div className="w-full space-y-4 bg-black/40 p-4 rounded border border-[#e3d5b8]/10">

                            {/* Gold */}
                            {(changes?.gold_gained || 0) > 0 && (
                                <div className="flex items-center justify-between text-[#e3d5b8]">
                                    <div className="flex items-center gap-2">
                                        <Coins className="text-yellow-500 w-5 h-5" />
                                        <span className="font-serif">Rewards</span>
                                    </div>
                                    <span className="text-xl font-bold text-yellow-300">+{changes?.gold_gained} G</span>
                                </div>
                            )}

                            {/* Location Update */}
                            {changes?.new_location && (
                                <div className="flex items-center justify-between text-gray-400 text-sm border-t border-white/10 pt-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="text-green-500 w-4 h-4" />
                                        <span>New Location</span>
                                    </div>
                                    <span>Updating...</span>
                                </div>
                            )}

                            {/* Level Up (if any) */}
                            {changes?.level_up && (
                                <div className="bg-gradient-to-r from-blue-900/50 to-transparent p-2 rounded text-blue-200 text-sm border-l-2 border-blue-500">
                                    <span className="font-bold text-blue-100">LEVEL UP!</span> Lv.{changes.level_up.oldLevel} → <span className="text-lg font-bold text-white">Lv.{changes.level_up.newLevel}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {!isSuccess && (
                        <p className="text-gray-400 italic text-center">
                            目的を達成できなかった...<br />
                            傷を癒やし、再び挑戦しよう。
                        </p>
                    )}

                    {/* Button */}
                    <button
                        onClick={onClose}
                        className={`
                            px-8 py-3 w-full font-bold text-lg tracking-widest transition-all duration-300 border
                            flex items-center justify-center gap-2 group
                            ${isSuccess
                                ? 'bg-[#3e2723] text-[#e3d5b8] border-[#8b5a2b] hover:bg-[#5d4037] hover:tracking-[0.2em]'
                                : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'}
                        `}
                    >
                        <span>{isSuccess ? 'COMPLETE' : 'RETURN'}</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
