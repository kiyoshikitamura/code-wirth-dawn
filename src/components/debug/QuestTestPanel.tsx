'use client';

import React, { useState, useEffect } from 'react';
import { ScrollText, ChevronDown, ChevronUp, Play, Search } from 'lucide-react';

interface QuestTestPanelProps {
    userId?: string;
    onSelectQuest: (id: number) => void;
}

interface QuestEntry {
    id: number;
    slug: string;
    title: string;
    quest_type: string;
    rec_level: number;
    difficulty: number;
}

/**
 * デバッグ用クエスト選択パネル
 * 全クエストをDBから取得し、条件を無視して直接プレイ可能にする
 */
export default function QuestTestPanel({ userId, onSelectQuest }: QuestTestPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [quests, setQuests] = useState<QuestEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');

    const fetchAllQuests = async () => {
        if (quests.length > 0) return; // already fetched
        setLoading(true);
        try {
            const res = await fetch('/api/debug/list-quests');
            if (res.ok) {
                const data = await res.json();
                setQuests(data.quests || []);
            }
        } catch (e) {
            console.error('[QuestTestPanel] fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        const next = !isOpen;
        setIsOpen(next);
        if (next) fetchAllQuests();
    };

    const filtered = quests.filter(q => {
        if (!filter) return true;
        const lf = filter.toLowerCase();
        return q.title.toLowerCase().includes(lf) ||
            q.slug.toLowerCase().includes(lf) ||
            String(q.id).includes(lf);
    });

    // Group by type
    const grouped: Record<string, QuestEntry[]> = {};
    for (const q of filtered) {
        const key = q.quest_type || 'unknown';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(q);
    }

    const typeLabels: Record<string, string> = {
        special: '🏰 スペシャル / メイン',
        normal: '📋 ノーマル',
    };

    const difficultyColor = (d: number) => {
        if (d >= 5) return 'text-red-400';
        if (d >= 3) return 'text-orange-400';
        return 'text-green-400';
    };

    return (
        <div className="w-[90%] max-w-xs mt-2">
            <button
                onClick={handleToggle}
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-950 to-indigo-900 border-2 border-indigo-600 rounded-xl text-sm font-bold text-indigo-200 hover:from-indigo-900 hover:to-indigo-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50"
            >
                <ScrollText size={16} />
                クエストテスト
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isOpen && (
                <div className="mt-2 bg-[#0d1b3e]/90 border border-indigo-800/60 rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {/* Search */}
                    <div className="p-2 border-b border-indigo-800/40">
                        <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-400/50" />
                            <input
                                type="text"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="ID / タイトル / slug で検索..."
                                className="w-full pl-7 pr-2 py-1.5 bg-[#070e1e] border border-indigo-800/40 rounded-lg text-[11px] text-indigo-200 placeholder-indigo-500/50 outline-none focus:border-indigo-500/60"
                            />
                        </div>
                    </div>

                    {/* Quest List */}
                    <div className="max-h-[320px] overflow-y-auto no-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 gap-2">
                                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[11px] text-indigo-400/70">読み込み中...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-6 text-center text-[11px] text-indigo-400/50">
                                {quests.length === 0 ? 'クエストが見つかりません' : '該当なし'}
                            </div>
                        ) : (
                            Object.entries(grouped).map(([type, items]) => (
                                <div key={type}>
                                    <div className="sticky top-0 px-3 py-1.5 bg-indigo-950/90 border-b border-indigo-800/30 text-[10px] font-bold text-indigo-300/80 tracking-wider backdrop-blur-sm z-10">
                                        {typeLabels[type] || type} ({items.length})
                                    </div>
                                    {items.map(q => (
                                        <button
                                            key={q.id}
                                            onClick={() => {
                                                if (window.confirm(`[${q.id}] ${q.title}\nこのクエストを開始しますか？`)) {
                                                    onSelectQuest(q.id);
                                                }
                                            }}
                                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-indigo-900/30 transition-colors border-b border-indigo-800/20 group text-left"
                                        >
                                            <span className="text-[10px] font-mono text-indigo-500 w-8 shrink-0">{q.id}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] text-indigo-100 truncate group-hover:text-white transition-colors">{q.title}</div>
                                                <div className="text-[9px] text-indigo-500/70 truncate">{q.slug}</div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-[9px] text-indigo-400/60">Lv{q.rec_level}</span>
                                                <span className={`text-[9px] font-bold ${difficultyColor(q.difficulty)}`}>★{q.difficulty}</span>
                                                <Play size={10} className="text-indigo-400/40 group-hover:text-indigo-300 transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-1.5 border-t border-indigo-800/40 text-[9px] text-indigo-500/50 text-center">
                        ⚠ 出現条件を無視してクエストを直接開始します
                    </div>
                </div>
            )}
        </div>
    );
}
