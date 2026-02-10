
import React from 'react';
import { Shield, Heart, Zap, Award, Coins, ArrowRight } from 'lucide-react';

interface LevelUpInfo {
    oldLevel: number;
    newLevel: number;
    hpDiff: number;
    costDiff: number;
    newHp: number;
    newCost: number;
}

interface QuestChanges {
    gold_gained: number;
    old_age: number;
    new_age: number;
    aged_up: boolean;
    vit_penalty: number;
    level_up?: LevelUpInfo;
}

interface QuestResultModalProps {
    onClose: () => void;
    changes: QuestChanges;
    rewards: any;
    daysPassed: number;
}

export default function QuestResultModal({ onClose, changes, rewards, daysPassed }: QuestResultModalProps) {
    const { level_up, gold_gained, aged_up } = changes;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-900 border border-amber-500/50 rounded-lg max-w-md w-full shadow-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-transparent pointer-events-none" />

                <header className="p-6 text-center border-b border-gray-800 relative z-10">
                    <h2 className="text-2xl font-serif font-bold text-amber-500 mb-1">QUEST COMPLETE</h2>
                    <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full" />
                </header>

                <div className="p-6 space-y-6 relative z-10">

                    {/* Rewards */}
                    <div className="space-y-3">
                        <h3 className="text-sm text-gray-400 font-bold uppercase tracking-wider">Rewards</h3>
                        <div className="flex flex-col gap-2">
                            {gold_gained > 0 && (
                                <div className="flex items-center gap-3 bg-black/40 p-3 rounded border border-gray-800">
                                    <div className="p-2 bg-amber-900/30 rounded-full text-amber-400">
                                        <Coins className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-amber-300 font-bold text-lg">+{gold_gained} G</div>
                                        <div className="text-xs text-gray-500">報酬金</div>
                                    </div>
                                </div>
                            )}
                            {rewards?.exp && (
                                <div className="flex items-center gap-3 bg-black/40 p-3 rounded border border-gray-800">
                                    <div className="p-2 bg-blue-900/30 rounded-full text-blue-400">
                                        <Award className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-blue-300 font-bold text-lg">+{rewards.exp} Exp</div>
                                        <div className="text-xs text-gray-500">経験値</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Level Up */}
                    {level_up && (
                        <div className="animate-slide-up bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/50 p-4 rounded-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Award className="w-24 h-24 text-white" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded">LEVEL UP!</span>
                                </div>
                                <div className="flex items-end gap-3 mb-4">
                                    <div className="text-gray-400 text-sm">Lv.{level_up.oldLevel}</div>
                                    <ArrowRight className="w-5 h-5 text-blue-400 mb-1" />
                                    <div className="text-3xl font-bold text-white">Lv.{level_up.newLevel}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 text-sm text-green-300">
                                        <Heart className="w-4 h-4" />
                                        <span>Max HP +{level_up.hpDiff}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-cyan-300">
                                        <Zap className="w-4 h-4" />
                                        <span>Deck Cost +{level_up.costDiff}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Aging & Decay */}
                    {aged_up && (
                        changes.vit_penalty > 0 ? (
                            <div className="relative overflow-hidden rounded-lg border border-red-900/50 bg-black/80 p-6 text-center animate-fade-in">
                                {/* Ominous Background Animation */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(80,0,0,0.4)_0%,transparent_70%)] animate-pulse-slow pointer-events-none"></div>

                                <div className="relative z-10 space-y-2">
                                    <div className="text-red-600 font-serif font-bold text-xl tracking-widest animate-pulse">
                                        ⚠ DECAY DETECTED ⚠
                                    </div>
                                    <div className="text-gray-400 text-sm">
                                        {changes.new_age}歳の誕生日を迎えました...
                                    </div>
                                    <p className="text-red-400 font-serif italic text-sm">
                                        "肉体の衰えを感じる..."
                                    </p>

                                    <div className="flex items-center justify-center gap-4 mt-4">
                                        <div className="flex flex-col items-center">
                                            <Heart className="w-8 h-8 text-red-700 animate-heartbeat" />
                                            <span className="text-[10px] text-red-500 mt-1">Vitality</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-600" />
                                        <div className="text-2xl font-bold text-red-600">
                                            -{changes.vit_penalty}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded flex items-center gap-4 animate-slide-up">
                                <div className="p-3 bg-amber-900/50 rounded-full text-amber-500">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-amber-300 font-bold text-lg">Happy Birthday!</div>
                                    <div className="text-sm text-amber-400">
                                        無事に {changes.new_age} 歳を迎えました。
                                    </div>
                                </div>
                            </div>
                        )
                    )}

                    {!aged_up && daysPassed > 0 && (
                        <div className="text-center text-xs text-gray-600 italic mt-2 border-t border-gray-800 pt-2">
                            {daysPassed}日が経過しました...
                        </div>
                    )}
                </div>

                <footer className="p-4 bg-black/40 text-center border-t border-gray-800 relative z-10">
                    <button
                        onClick={onClose}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded transition-colors shadow-lg hover:shadow-amber-500/20"
                    >
                        Continue Adventure
                    </button>
                </footer>
            </div>
        </div>
    );
}
