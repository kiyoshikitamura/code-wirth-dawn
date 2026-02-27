import React, { useState } from 'react';
import { AlertTriangle, X, Scroll } from 'lucide-react';
import { Scenario, UserProfile, Reputation } from '@/types/game';

interface QuestBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    normalQuests: Scenario[];
    specialQuests: Scenario[];
    loading: boolean;
    userProfile: UserProfile | null;
    reputation: Reputation | null;
    onSelect: (scenario: Scenario) => void;
}

export default function QuestBoardModal({ isOpen, onClose, normalQuests, specialQuests, loading, userProfile, reputation, onSelect }: QuestBoardModalProps) {
    const [activeTab, setActiveTab] = useState<'special' | 'normal'>('normal');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#e3d5b8] text-[#2c241b] w-full max-w-4xl h-[85vh] flex flex-col rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] border-4 border-[#8b5a2b] relative overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b-2 border-[#8b5a2b] bg-[#3e2723] text-[#e3d5b8]">
                    <div className="flex items-center gap-2">
                        <Scroll className="w-6 h-6 text-gold-500" />
                        <h2 className="text-xl font-serif font-bold tracking-widest text-gold-500">QUEST BOARD</h2>
                    </div>
                    <button onClick={onClose} className="text-[#a38b6b] hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-[#2c1e1a] p-1 gap-1">
                    <button
                        onClick={() => setActiveTab('normal')}
                        className={`flex-1 py-2 font-bold font-serif transition-colors ${activeTab === 'normal'
                            ? 'bg-[#8b5a2b] text-[#e3d5b8] shadow-inner'
                            : 'bg-[#3e2723] text-[#8b5a2b] hover:bg-[#4e342e]'
                            }`}
                    >
                        通常依頼
                    </button>
                    <button
                        onClick={() => setActiveTab('special')}
                        className={`flex-1 py-2 font-bold font-serif transition-colors flex items-center justify-center gap-2 ${activeTab === 'special'
                            ? 'bg-[#8b5a2b] text-[#e3d5b8] shadow-inner'
                            : 'bg-[#3e2723] text-[#8b5a2b] hover:bg-[#4e342e]'
                            }`}
                    >
                        特別依頼
                        {specialQuests.length > 0 && (
                            <span className="bg-red-600 text-white text-[10px] px-1.5 rounded-full animate-pulse">
                                {specialQuests.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[url('/textures/paper.png')] bg-repeat">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-[#5c4033] font-serif animate-pulse">
                            依頼を読み込み中...
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeTab === 'special' && (
                                <>
                                    <div className="text-center text-sm text-[#8b5a2b] mb-4 font-serif italic border-b border-[#8b5a2b]/30 pb-2">
                                        ― 選ばれし者にのみ開かれる運命の扉 ―
                                    </div>
                                    <QuestList
                                        quests={specialQuests}
                                        userProfile={userProfile}
                                        reputation={reputation}
                                        onSelect={onSelect}
                                        emptyMsg="現在、あなたへの特別依頼はありません。"
                                    />
                                </>
                            )}
                            {activeTab === 'normal' && (
                                <>
                                    <div className="text-center text-sm text-[#8b5a2b] mb-4 font-serif italic border-b border-[#8b5a2b]/30 pb-2">
                                        ― 日々の糧を得るための労働 ―
                                    </div>
                                    <QuestList
                                        quests={normalQuests}
                                        userProfile={userProfile}
                                        reputation={reputation}
                                        onSelect={onSelect}
                                        emptyMsg="現在、手頃な依頼はありません。"
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function QuestList({ quests, userProfile, reputation, onSelect, emptyMsg }: { quests: Scenario[], userProfile: UserProfile | null, reputation: Reputation | null, onSelect: (s: Scenario) => void, emptyMsg: string }) {
    if (quests.length === 0) {
        return <div className="text-center py-12 text-[#8b5a2b]/70 font-serif">{emptyMsg}</div>;
    }

    const userLevel = userProfile?.level || 1;
    const currentLocationId = userProfile?.current_location_id || '';
    const repScore = reputation?.score || 0;

    return (
        <div className="grid grid-cols-1 gap-4">
            {quests.map((s) => {
                const recLevel = s.rec_level || s.requirements?.min_level || 1;
                const isUrgent = s.is_urgent;

                // Reputation Logic
                let requiredRep = 0;
                if (typeof s.requirements?.min_reputation === 'number') {
                    requiredRep = s.requirements.min_reputation as number;
                } else if (s.requirements?.min_reputation && typeof s.requirements.min_reputation === 'object' && currentLocationId) {
                    requiredRep = (s.requirements.min_reputation as any)[currentLocationId] || 0;
                }

                const unmetConditions: string[] = [];
                if (recLevel > userLevel) unmetConditions.push(`要求レベル: ${recLevel}`);
                if (requiredRep > repScore) unmetConditions.push(`要求名声: ${requiredRep}`);
                if (s.location_id && s.location_id !== 'all' && s.location_id !== currentLocationId) unmetConditions.push(`異なる地域`);

                const canAccept = unmetConditions.length === 0;

                return (
                    <div key={s.id}
                        className={`group relative p-4 border shadow-sm transition-all
                        ${canAccept ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-60 bg-gray-300 border-gray-400 grayscale'}
                        ${canAccept ? (isUrgent ? 'bg-red-900/5 border-red-900/30' : 'bg-[#fdfbf7] border-[#c2b280] hover:bg-[#fffefc]') : ''}
                        `}
                        onClick={() => { if (canAccept) onSelect(s); }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                                <h3 className="font-bold text-[#3e2723] text-lg font-serif flex items-center gap-2">
                                    {isUrgent && <span className="text-red-600 animate-pulse text-[10px] border border-red-600 px-1 rounded tracking-wider">URGENT</span>}
                                    {s.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${!canAccept ? 'bg-gray-500 text-white' : 'bg-[#a38b6b] text-white'}`}>
                                        Lv.{recLevel}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs px-2 py-0.5 rounded ml-2 whitespace-nowrap font-mono ${!canAccept ? 'bg-gray-500 text-white' : 'bg-[#8b5a2b] text-[#e3d5b8]'}`}>
                                    {s.reward_gold} G
                                </span>
                            </div>
                        </div>

                        <p className={`text-sm mb-3 line-clamp-2 leading-relaxed ${!canAccept ? 'text-gray-700' : 'text-[#5d4037]'}`}>
                            {s.description}
                        </p>

                        {/* Unmet conditions warning */}
                        {!canAccept && (
                            <div className="text-red-600 text-xs font-bold flex flex-wrap gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4" />
                                <span>受注不可: </span>
                                {unmetConditions.map((cond, idx) => (
                                    <span key={idx} className="border-b border-red-400">{cond}</span>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3 text-xs text-[#5d4037]/70">
                                <span className="flex items-center gap-1">依頼主: {s.client_name}</span>
                                {s.impacts && (
                                    <div className="flex gap-2 opacity-80">
                                        {s.impacts.order > 0 && <span className="text-blue-800 font-bold">秩序↑</span>}
                                        {s.impacts.chaos > 0 && <span className="text-purple-800 font-bold">混沌↑</span>}
                                        {s.impacts.justice > 0 && <span className="text-yellow-800 font-bold">正義↑</span>}
                                        {s.impacts.evil > 0 && <span className="text-red-800 font-bold">悪↑</span>}
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={!canAccept}
                                className={`text-xs px-4 py-2 rounded shadow transition-all transform tracking-wide font-bold
                                ${canAccept
                                        ? 'bg-[#3e2723] text-gold-500 hover:bg-[#4e342e] active:scale-95'
                                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (canAccept) onSelect(s);
                                }}
                            >
                                受領する
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
