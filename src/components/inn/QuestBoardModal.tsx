import React, { useState } from 'react';
import { X, Scroll } from 'lucide-react';
import { Scenario, UserProfile } from '@/types/game';

interface QuestBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    normalQuests: Scenario[];
    specialQuests: Scenario[];
    loading: boolean;
    userProfile: UserProfile | null;
    onSelect: (scenario: Scenario) => void;
}

export default function QuestBoardModal({ isOpen, onClose, normalQuests, specialQuests, loading, userProfile, onSelect }: QuestBoardModalProps) {
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

function QuestList({ quests, onSelect, emptyMsg }: { quests: Scenario[], onSelect: (s: Scenario) => void, emptyMsg: string }) {
    const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

    if (quests.length === 0) {
        return <div className="text-center py-12 text-[#8b5a2b]/70 font-serif">{emptyMsg}</div>;
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {quests.map((s) => {
                const recLevel = s.rec_level || s.requirements?.min_level || 1;
                const isUrgent = s.is_urgent;
                const isExpanded = expandedQuestId === String(s.id);

                return (
                    <div key={s.id}
                        className={`group relative p-4 border shadow-sm transition-all cursor-pointer hover:shadow-md ${isExpanded ? 'bg-[#fffefc] border-[#a38b6b]' : 'bg-[#fdfbf7] border-[#c2b280]'}`}
                        style={isUrgent ? { backgroundColor: 'rgba(127,29,29,0.04)', borderColor: 'rgba(127,29,29,0.3)' } : {}}
                        onClick={() => setExpandedQuestId(isExpanded ? null : String(s.id))}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                                <h3 className="font-bold text-[#3e2723] text-lg font-serif flex items-center gap-2">
                                    {isUrgent && <span className="text-red-600 animate-pulse text-[10px] border border-red-600 px-1 rounded tracking-wider">URGENT</span>}
                                    {s.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-[#a38b6b] text-white">
                                        Lv.{recLevel}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-xs px-2 py-0.5 rounded ml-2 whitespace-nowrap font-mono bg-[#8b5a2b] text-[#e3d5b8]">
                                    {s.reward_gold} G
                                </span>
                            </div>
                        </div>

                        {!isExpanded ? (
                            <p className="text-sm mb-1 line-clamp-2 leading-relaxed text-[#5d4037]">
                                {s.script_data?.short_description || s.short_description || s.description}
                            </p>
                        ) : (
                            <div className="mt-4 pt-4 border-t border-[#8b5a2b]/20 animate-in fade-in slide-in-from-top-2">
                                <p className="text-sm mb-4 leading-relaxed text-[#3e2723] whitespace-pre-wrap">
                                    {s.description}
                                </p>

                                <div className="bg-[#f5deb3]/30 p-3 rounded mb-4 text-xs text-[#5d4037]">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><span className="font-bold">依頼主:</span> {s.client_name}</div>
                                        {s.impacts && (
                                            <div className="flex gap-2">
                                                <span className="font-bold">世界への影響:</span>
                                                <div className="flex gap-1">
                                                    {s.impacts.order > 0 && <span className="text-blue-800">秩序↑</span>}
                                                    {s.impacts.chaos > 0 && <span className="text-purple-800">混沌↑</span>}
                                                    {s.impacts.justice > 0 && <span className="text-yellow-800">正義↑</span>}
                                                    {s.impacts.evil > 0 && <span className="text-red-800">悪↑</span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end mt-4">
                                    <button
                                        className="text-sm px-6 py-2.5 rounded shadow-lg transition-all transform tracking-wide font-bold bg-[#8b5a2b] text-white hover:bg-[#6b4522] active:scale-95 flex items-center gap-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect(s);
                                        }}
                                    >
                                        <Scroll size={16} /> この依頼を受ける
                                    </button>
                                </div>
                            </div>
                        )}

                        {!isExpanded && (
                            <div className="text-center mt-2 opacity-50 text-[10px] text-[#8b5a2b]">タップして詳細を見る</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
