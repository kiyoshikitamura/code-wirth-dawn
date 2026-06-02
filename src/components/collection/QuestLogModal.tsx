'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardList, Swords, Crown, ScrollText, X } from 'lucide-react';
import { getAuthToken } from '@/lib/authToken';
import QuestDetailPopup from './QuestDetailPopup';

type TabKey = 'main' | 'special' | 'normal';

interface QuestEntry {
    id: number;
    slug: string;
    quest_type: string;
    category: string;
    completed: boolean;
    title: string | null;
    description: string | null;
    rec_level: number;
    difficulty: number;
    client_name: string | null;
    short_flavor: string | null;
    long_flavor: string | null;
    reward_gold: number | null;
    reward_exp: number | null;
    reward_reputation: number | null;
    reward_items: any[] | null;
    reward_alignment: any | null;
    reward_vitality: number | null;
    reward_npc: any | null;
    impacts: any | null;
}

interface QuestLogData {
    total: number;
    completed: number;
    quests: QuestEntry[];
}

interface Props {
    onClose: () => void;
}

export default function QuestLogModal({ onClose }: Props) {
    const [data, setData] = useState<QuestLogData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('main');
    const [selectedQuest, setSelectedQuest] = useState<QuestEntry | null>(null);

    useEffect(() => {
        fetchQuestLog();
    }, []);

    const fetchQuestLog = async () => {
        try {
            const token = await getAuthToken();
            if (!token) return;

            const res = await fetch('/api/quest-log', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error('[QuestLog] Fetch failed:', e);
        } finally {
            setLoading(false);
        }
    };

    const tabs: { key: TabKey; label: string; icon: any }[] = [
        { key: 'main', label: 'メイン', icon: Crown },
        { key: 'special', label: 'スペシャル', icon: ScrollText },
        { key: 'normal', label: 'ノーマル', icon: Swords },
    ];

    const filteredQuests = data?.quests.filter(q => q.category === activeTab) || [];
    const tabCompleted = filteredQuests.filter(q => q.completed).length;
    const tabTotal = filteredQuests.length;
    const progressPct = tabTotal > 0 ? Math.round((tabCompleted / tabTotal) * 100) : 0;

    const content = createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-2">
            <div className="bg-[#0d1a2e] border-2 border-[#2a4080]/70 w-full max-w-lg h-[90dvh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-[#1a2d5a] to-[#0d1a2e] p-4 flex items-center justify-between border-b border-[#2a4080]/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <ClipboardList className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white tracking-wider font-serif">クエスト記録</h2>
                            <p className="text-[9px] text-blue-300/50 tracking-widest uppercase">Quest Log</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-[#0a1226] border-b border-[#2a4080]/30">
                    {tabs.map(tab => {
                        const tQuests = data?.quests.filter(q => q.category === tab.key) || [];
                        const tCompleted = tQuests.filter(q => q.completed).length;
                        const tTotal = tQuests.length;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 transition-all relative ${
                                    isActive
                                        ? 'text-emerald-400 bg-[#122042]/80'
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-[#122042]/40'
                                }`}
                            >
                                <tab.icon size={16} />
                                <span className="text-[10px] font-bold tracking-wider">{tab.label}</span>
                                {tTotal > 0 && (
                                    <span className={`text-[9px] font-mono ${isActive ? 'text-emerald-400/70' : 'text-gray-600'}`}>
                                        {tCompleted}/{tTotal}
                                    </span>
                                )}
                                {isActive && (
                                    <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-emerald-400 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Progress Bar */}
                {tabTotal > 0 && (
                    <div className="px-4 py-2 bg-[#0a1226]/80 border-b border-[#2a4080]/20">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-400">
                                達成率: <span className="text-emerald-400 font-bold">{tabCompleted}</span> / {tabTotal}
                            </span>
                            <span className={`text-[10px] font-bold font-mono ${
                                progressPct >= 100 ? 'text-emerald-400' : progressPct >= 50 ? 'text-amber-400' : 'text-gray-400'
                            }`}>
                                {progressPct}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#1a2d5a] rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    progressPct >= 100
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                        : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                                }`}
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : !data ? (
                        <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
                            データの取得に失敗しました
                        </div>
                    ) : filteredQuests.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-gray-600 text-sm font-serif italic">
                            このカテゴリのクエストはまだありません
                        </div>
                    ) : (
                        <div className="divide-y divide-[#2a4080]/20">
                            {filteredQuests.map((quest) => (
                                <button
                                    key={quest.id}
                                    onClick={() => {
                                        if (!quest.completed) return;
                                        setSelectedQuest(quest);
                                    }}
                                    disabled={!quest.completed}
                                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                                        quest.completed
                                            ? 'hover:bg-[#122042]/60 active:bg-[#1a2d5a]/60 cursor-pointer'
                                            : 'cursor-default opacity-40'
                                    }`}
                                >
                                    {/* ID */}
                                    <span className="text-[10px] font-mono text-slate-400 w-12 flex-shrink-0">
                                        No.{String(quest.id).padStart(4, '0')}
                                    </span>

                                    {/* Name or placeholder */}
                                    {quest.completed ? (
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm text-slate-200 font-medium truncate block">
                                                {quest.title}
                                            </span>
                                            {quest.short_flavor && (
                                                <span className="text-[10px] text-gray-500 truncate block mt-0.5">
                                                    {quest.short_flavor.substring(0, 40)}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-500 flex-1 tracking-widest">
                                            ─────
                                        </span>
                                    )}

                                    {/* Level + Status */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <span className="text-[9px] font-mono text-slate-400">
                                            Lv.{quest.rec_level}
                                        </span>
                                        {quest.completed && (
                                            <span className="text-[9px] text-emerald-500/70">✓</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-2 border-t border-[#2a4080]/30 bg-[#0a1226] text-center">
                    <p className="text-[9px] text-gray-600 font-serif italic">
                        ※ クエスト達成時に記録されます
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );

    return (
        <>
            {content}
            {selectedQuest && (
                <QuestDetailPopup
                    quest={selectedQuest}
                    onClose={() => setSelectedQuest(null)}
                />
            )}
        </>
    );
}
