import React, { useState, useMemo } from 'react';
import { X, Scroll, AlertTriangle, ChevronRight, Info } from 'lucide-react';
import { Scenario, UserProfile } from '@/types/game';

interface QuestBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    quests: Scenario[];
    loading: boolean;
    userProfile: UserProfile | null;
    onSelect: (scenario: Scenario) => void;
}

type DifficultyTab = 'easy' | 'normal' | 'hard';

export default function QuestBoardModal({ isOpen, onClose, quests, loading, userProfile, onSelect }: QuestBoardModalProps) {
    const [activeTab, setActiveTab] = useState<DifficultyTab>('easy');
    const [detailQuest, setDetailQuest] = useState<Scenario | null>(null);
    const [showUrgentWarning, setShowUrgentWarning] = useState(false);
    const [pendingQuest, setPendingQuest] = useState<Scenario | null>(null);

    if (!isOpen) return null;

    const filteredQuests = quests.filter((q: any) => q.difficulty_tier === activeTab);

    const tabCounts = useMemo(() => ({
        easy: quests.filter((q: any) => q.difficulty_tier === 'easy').length,
        normal: quests.filter((q: any) => q.difficulty_tier === 'normal').length,
        hard: quests.filter((q: any) => q.difficulty_tier === 'hard').length,
    }), [quests]);

    const handleAccept = (quest: Scenario) => {
        const userLevel = userProfile?.level || 1;
        const questLevel = (quest as any).rec_level || 1;
        const isDangerous = questLevel > userLevel + 1;
        if (isDangerous) {
            setPendingQuest(quest);
            setShowUrgentWarning(true);
        } else {
            onSelect(quest);
        }
    };

    const confirmUrgentAccept = () => {
        if (pendingQuest) onSelect(pendingQuest);
        setShowUrgentWarning(false);
        setPendingQuest(null);
    };

    const tabs: { key: DifficultyTab; label: string; color: string }[] = [
        { key: 'easy', label: 'Easy', color: 'text-green-400' },
        { key: 'normal', label: 'Normal', color: 'text-amber-400' },
        { key: 'hard', label: 'Hard', color: 'text-red-400' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#e3d5b8] text-[#2c241b] w-full max-w-4xl h-[85vh] flex flex-col rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] border-4 border-[#8b5a2b] relative overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b-2 border-[#8b5a2b] bg-[#3e2723] text-[#e3d5b8]">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <Scroll className="w-5 h-5 text-amber-400" />
                            <h2 className="text-lg font-serif font-bold tracking-widest text-amber-400">依頼一覧</h2>
                        </div>
                        <p className="text-[10px] text-[#a38b6b] mt-0.5 font-serif italic">― 冒険者の手引き、腕に合った仕事を選べ ―</p>
                    </div>
                    <button onClick={onClose} className="text-[#a38b6b] hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs: Easy / Normal / Hard */}
                <div className="flex bg-[#2c1e1a] p-1 gap-1">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex-1 py-2 font-bold font-serif transition-colors flex items-center justify-center gap-1.5 text-sm ${activeTab === t.key
                                ? 'bg-[#8b5a2b] text-[#e3d5b8] shadow-inner'
                                : 'bg-[#3e2723] text-[#8b5a2b] hover:bg-[#4e342e]'
                                }`}
                        >
                            {t.label}
                            {tabCounts[t.key] > 0 && (
                                <span className={`text-[10px] px-1 rounded-full ${activeTab === t.key ? 'bg-amber-700 text-amber-200' : 'bg-[#4e342e] text-[#8b5a2b]'}`}>
                                    {tabCounts[t.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-[url('/textures/paper.png')] bg-repeat">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-[#5c4033] font-serif animate-pulse">
                            依頼を読み込み中...
                        </div>
                    ) : filteredQuests.length === 0 ? (
                        <div className="text-center py-12 text-[#8b5a2b]/70 font-serif">
                            {activeTab === 'easy' && '現在、初級の依頼はありません。'}
                            {activeTab === 'normal' && '現在、中級の依頼はありません。'}
                            {activeTab === 'hard' && '現在、上級の依頼はありません。'}
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {filteredQuests.map((s: any) => (
                                <div
                                    key={s.id}
                                    className={`group flex items-center gap-2 p-2.5 border rounded cursor-pointer transition-all hover:shadow-sm ${(() => {
                                        const userLevel = userProfile?.level || 1;
                                        const isDangerous = (s.rec_level || 1) > userLevel + 1;
                                        if (isDangerous) return 'bg-red-900/10 border-red-400/40 hover:border-red-500';
                                        return 'bg-[#fdfbf7] border-[#c2b280] hover:border-[#a38b6b]';
                                    })()}`}
                                    onClick={() => setDetailQuest(s)}
                                >
                                    {/* Quest Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-[#3e2723] text-sm font-serif truncate">{s.title}</h3>
                                        <p className="text-[11px] text-[#8b6f4e] line-clamp-1 mt-0.5">{s.short_flavor}</p>
                                    </div>

                                    {/* Badges + Level & Reward - Stacked */}
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        {(() => {
                                            const userLevel = userProfile?.level || 1;
                                            const isDangerous = (s.rec_level || 1) > userLevel + 1;
                                            const hasBadge = s.quest_type === 'special' || s.is_ugc || isDangerous;
                                            return hasBadge ? (
                                                <div className="flex gap-1 items-center">
                                                    {isDangerous && (
                                                        <span className="text-red-500 text-sm font-bold animate-pulse" title="推奨レベルを超えています">❗</span>
                                                    )}
                                                    {s.quest_type === 'special' && (
                                                        <span className="text-[9px] px-1 py-0.5 rounded bg-purple-700 text-white font-bold">Special</span>
                                                    )}
                                                    {s.is_ugc && (
                                                        <span className="text-[9px] px-1 py-0.5 rounded bg-blue-600 text-white font-bold">UGC</span>
                                                    )}
                                                </div>
                                            ) : null;
                                        })()}
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] w-[38px] text-center py-0.5 rounded font-bold bg-[#a38b6b] text-white">
                                                Lv.{s.rec_level || 1}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight className="w-4 h-4 text-[#a38b6b] opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Popup */}
            {detailQuest && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDetailQuest(null)}>
                    <div className="bg-[#fdfbf7] text-[#2c241b] w-full max-w-md rounded-lg shadow-2xl border-2 border-[#8b5a2b] overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Detail Header */}
                        <div className="bg-[#3e2723] p-4 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const userLevel = userProfile?.level || 1;
                                        const isDangerous = ((detailQuest as any).rec_level || 1) > userLevel + 1;
                                        return isDangerous && <span className="text-red-400 text-lg">❗</span>;
                                    })()}
                                    <h3 className="text-lg font-serif font-bold text-amber-400">{detailQuest.title}</h3>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-700 text-amber-200">
                                        Lv.{detailQuest.rec_level || 1}
                                    </span>
                                    {(detailQuest as any).quest_type === 'special' && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold">Special</span>
                                    )}
                                    {(detailQuest as any).is_ugc && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">UGC</span>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => setDetailQuest(null)} className="text-[#a38b6b] hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Detail Body */}
                        <div className="p-4 space-y-4">
                            {/* Long Flavor Text */}
                            <p className="text-sm leading-relaxed text-[#3e2723] whitespace-pre-wrap font-serif">
                                {(detailQuest as any).long_flavor || detailQuest.description || 'クエストの詳細情報は準備中です。'}
                            </p>

                            {/* Rewards Section */}
                            <div className="bg-[#f5deb3]/60 border border-[#c2b280] rounded p-3">
                                <div className="text-[11px] font-bold text-[#5d4037] mb-2 tracking-wider">報酬</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {((detailQuest as any).reward_gold > 0) && (
                                        <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-bold border border-yellow-300">
                                            💰 {(detailQuest as any).reward_gold}G
                                        </span>
                                    )}
                                    {((detailQuest as any).reward_reputation > 0) && (
                                        <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-1 rounded-full bg-sky-100 text-sky-800 font-bold border border-sky-300">
                                            ⭐ 名声 +{(detailQuest as any).reward_reputation}
                                        </span>
                                    )}
                                    {((detailQuest as any).reward_reputation < 0) && (
                                        <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-1 rounded-full bg-red-100 text-red-800 font-bold border border-red-300">
                                            💀 名声 {(detailQuest as any).reward_reputation}
                                        </span>
                                    )}
                                    {(detailQuest as any).reward_alignment?.order > 0 && (
                                        <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-300">
                                            ⚖️ 秩序 +{(detailQuest as any).reward_alignment.order}
                                        </span>
                                    )}
                                    {(detailQuest as any).reward_alignment?.chaos > 0 && (
                                        <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-1 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-300">
                                            🌀 混沌 +{(detailQuest as any).reward_alignment.chaos}
                                        </span>
                                    )}
                                    {(detailQuest as any).reward_alignment?.justice > 0 && (
                                        <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
                                            ✨ 正義 +{(detailQuest as any).reward_alignment.justice}
                                        </span>
                                    )}
                                    {(detailQuest as any).reward_alignment?.evil > 0 && (
                                        <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-1 rounded-full bg-red-100 text-red-800 font-bold border border-red-300">
                                            🔥 悪 +{(detailQuest as any).reward_alignment.evil}
                                        </span>
                                    )}
                                    {((detailQuest as any).reward_items?.length > 0) && (
                                        <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                                            🎁 アイテム ×{(detailQuest as any).reward_items.length}
                                        </span>
                                    )}
                                    {((detailQuest as any).reward_vitality !== 0) && (
                                        <span className={`inline-flex items-center gap-0.5 text-[11px] px-2 py-1 rounded-full font-bold border ${
                                            (detailQuest as any).reward_vitality < 0
                                                ? 'bg-orange-100 text-orange-800 border-orange-300'
                                                : 'bg-green-100 text-green-800 border-green-300'
                                        }`}>
                                            💪 VIT {(detailQuest as any).reward_vitality > 0 ? '+' : ''}{(detailQuest as any).reward_vitality}
                                        </span>
                                    )}
                                    {(detailQuest as any).reward_npc && (
                                        <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-300">
                                            👤 仲間加入
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Meta Info */}
                            <div className="bg-[#f5deb3]/40 p-3 rounded text-xs text-[#5d4037] space-y-1">
                                <div><span className="font-bold">依頼主:</span> {detailQuest.client_name || 'ギルド'}</div>
                                {(detailQuest as any).impacts && (
                                    <div className="flex gap-2">
                                        <span className="font-bold">影響:</span>
                                        <div className="flex gap-1 flex-wrap">
                                            {(detailQuest as any).impacts?.order > 0 && <span className="text-blue-800">秩序↑</span>}
                                            {(detailQuest as any).impacts?.chaos > 0 && <span className="text-purple-800">混沌↑</span>}
                                            {(detailQuest as any).impacts?.justice > 0 && <span className="text-yellow-800">正義↑</span>}
                                            {(detailQuest as any).impacts?.evil > 0 && <span className="text-red-800">悪↑</span>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Accept Button */}
                            <div className="flex justify-end">
                                <button
                                    className="text-sm px-6 py-2.5 rounded-lg shadow-lg transition-all transform tracking-wide font-bold bg-[#8b5a2b] text-white hover:bg-[#6b4522] active:scale-95 flex items-center gap-2"
                                    onClick={() => {
                                        handleAccept(detailQuest);
                                        setDetailQuest(null);
                                    }}
                                >
                                    <Scroll size={16} /> この依頼を受ける
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Urgent Warning Dialog */}
            {showUrgentWarning && pendingQuest && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#fdfbf7] text-[#2c241b] w-full max-w-sm rounded-lg shadow-2xl border-2 border-red-600 overflow-hidden">
                        <div className="bg-red-800 p-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-300" />
                            <h3 className="text-base font-serif font-bold text-red-200">危険な依頼</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <p className="text-sm text-[#3e2723]">
                                <strong>「{pendingQuest.title}」</strong>は危険な依頼です。十分な準備なく挑むと命を落とす可能性があります。
                            </p>
                            <p className="text-xs text-red-700 font-bold">本当にこの依頼を受けますか？</p>
                            <div className="flex gap-2 justify-end">
                                <button
                                    className="px-4 py-2 text-sm rounded border border-[#8b5a2b] text-[#5c4033] hover:bg-[#f5deb3] transition-colors"
                                    onClick={() => { setShowUrgentWarning(false); setPendingQuest(null); }}
                                >
                                    やめておく
                                </button>
                                <button
                                    className="px-4 py-2 text-sm rounded font-bold bg-red-700 text-white hover:bg-red-800 active:scale-95 transition-all"
                                    onClick={confirmUrgentAccept}
                                >
                                    覚悟の上で受ける
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
