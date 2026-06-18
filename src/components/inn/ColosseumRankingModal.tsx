import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '@/lib/authToken';
import { useGameStore } from '@/store/gameStore';
import { Trophy, Award, Flame, X, ArrowLeft, Loader2 } from 'lucide-react';

interface RankingEntry {
    rank: number;
    userId: string;
    name: string;
    wins: number;
    maxStreak: number;
}

interface UserStats {
    wins: number;
    losses: number;
    currentStreak: number;
    maxStreak: number;
    winsRank: number | null;
    streakRank: number | null;
}

interface ColosseumRankingModalProps {
    onClose: () => void;
}

export default function ColosseumRankingModal({ onClose }: ColosseumRankingModalProps) {
    const { userProfile } = useGameStore();
    const currentUserId = userProfile?.id;
    const [activeTab, setActiveTab] = useState<'wins' | 'streaks'>('wins');
    const [loading, setLoading] = useState(true);
    const [winsRanking, setWinsRanking] = useState<RankingEntry[]>([]);
    const [streakRanking, setStreakRanking] = useState<RankingEntry[]>([]);
    const [myStats, setMyStats] = useState<UserStats | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const fetchRankings = async () => {
            setLoading(true);
            setErrorMsg(null);
            try {
                const authHeaders = await getAuthHeaders();
                const res = await fetch('/api/ranking/colosseum', {
                    headers: authHeaders
                });

                if (res.ok) {
                    const data = await res.json();
                    setWinsRanking(data.winsRanking || []);
                    setStreakRanking(data.streakRanking || []);
                    setMyStats(data.myStats || null);
                } else {
                    const data = await res.json();
                    setErrorMsg(data.error || 'ランキングの取得に失敗しました。');
                }
            } catch (err) {
                console.error('[ColosseumRankingModal] Fetch Error:', err);
                setErrorMsg('通信エラーが発生しました。');
            } finally {
                setLoading(false);
            }
        };

        fetchRankings();
    }, []);

    const getRankBadgeColor = (rank: number) => {
        if (rank === 1) return 'bg-amber-400 text-[#070e1e] font-black shadow-[0_0_8px_rgba(245,158,11,0.5)]';
        if (rank === 2) return 'bg-slate-300 text-[#070e1e] font-black shadow-[0_0_8px_rgba(203,213,225,0.5)]';
        if (rank === 3) return 'bg-amber-700 text-white font-black shadow-[0_0_8px_rgba(180,83,9,0.5)]';
        return 'bg-[#152542] text-slate-400 border border-[#233f6a]/30';
    };

    const currentRanking = activeTab === 'wins' ? winsRanking : streakRanking;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b14]/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-[#0c1628]/95 border border-[#1e345b] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(30,52,91,0.5)] flex flex-col h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#11203b]/80 border-b border-[#1e345b]">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={16} />
                        戻る
                    </button>
                    <h2 className="font-black tracking-widest text-base text-slate-100 flex items-center gap-2">
                        <Trophy size={18} className="text-amber-400" />
                        闘技場殿堂 (ランキング)
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* My Stats Box (Fixed at top of content area) */}
                <div className="bg-[#12223f]/80 border-b border-[#1d3357] px-6 py-4 space-y-2">
                    <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                        <Award size={12} />
                        あなたの闘技場成績
                    </h3>
                    {loading ? (
                        <div className="h-10 flex items-center justify-center">
                            <Loader2 size={16} className="animate-spin text-slate-400" />
                        </div>
                    ) : myStats ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-2 bg-[#0a1526]/80 rounded border border-[#1b3152]/50">
                                <div className="text-[9px] text-slate-400 font-bold">勝利数 順位</div>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <span className="text-sm font-black text-slate-100">
                                        {myStats.winsRank ? `${myStats.winsRank}位` : '圏外'}
                                    </span>
                                    <span className="text-[10px] text-emerald-400 font-bold">({myStats.wins}勝)</span>
                                </div>
                            </div>
                            <div className="p-2 bg-[#0a1526]/80 rounded border border-[#1b3152]/50">
                                <div className="text-[9px] text-slate-400 font-bold">連勝数 順位</div>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <span className="text-sm font-black text-slate-100">
                                        {myStats.streakRank ? `${myStats.streakRank}位` : '圏外'}
                                    </span>
                                    <span className="text-[10px] text-orange-400 font-bold">({myStats.maxStreak}連勝)</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-slate-400 font-bold text-center py-2 bg-[#0a1526]/40 border border-[#1b3152]/20 rounded">
                            未挑戦：コロシアムに挑戦するとランキングに掲載されます
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex bg-[#0a1322] border-b border-[#1d3357]">
                    <button
                        onClick={() => setActiveTab('wins')}
                        className={`flex-1 py-3 text-xs font-black tracking-widest text-center transition-all flex items-center justify-center gap-1.5 border-b-2 ${
                            activeTab === 'wins'
                                ? 'text-amber-400 border-amber-500 bg-[#11203b]/30'
                                : 'text-slate-400 border-transparent hover:text-slate-200'
                        }`}
                    >
                        <Award size={14} />
                        勝利数ランキング
                    </button>
                    <button
                        onClick={() => setActiveTab('streaks')}
                        className={`flex-1 py-3 text-xs font-black tracking-widest text-center transition-all flex items-center justify-center gap-1.5 border-b-2 ${
                            activeTab === 'streaks'
                                ? 'text-amber-400 border-amber-500 bg-[#11203b]/30'
                                : 'text-slate-400 border-transparent hover:text-slate-200'
                        }`}
                    >
                        <Flame size={14} />
                        最大連勝ランキング
                    </button>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="h-full flex items-center justify-center flex-col gap-2">
                            <Loader2 className="animate-spin text-amber-400" size={32} />
                            <span className="text-xs text-slate-400 font-bold">殿堂情報をロード中...</span>
                        </div>
                    ) : errorMsg ? (
                        <div className="h-full flex items-center justify-center text-center">
                            <span className="text-xs text-red-400 font-bold">{errorMsg}</span>
                        </div>
                    ) : currentRanking.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center">
                            <span className="text-xs text-slate-500 font-bold">未挑戦者以外のランキングデータはありません。</span>
                        </div>
                    ) : (
                        <div className="space-y-1.5 pb-4">
                            {currentRanking.map((entry) => (
                                <div
                                    key={entry.userId}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                        currentUserId && entry.userId === currentUserId ? 'bg-amber-500/10 border-amber-500/40 shadow-inner' : 'bg-[#101d33]/50 border-[#1c3258]/40 hover:bg-[#152542]/70'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Rank Badge */}
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${getRankBadgeColor(entry.rank)}`}>
                                            {entry.rank}
                                        </div>
                                        {/* Player Name */}
                                        <span className="text-xs font-black text-slate-100 truncate">{entry.name}</span>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 flex-shrink-0 text-right">
                                        <div>
                                            <span className="text-[10px] text-slate-500 block font-bold">累計勝利</span>
                                            <span className="text-xs text-emerald-400 font-black">{entry.wins}勝</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 block font-bold">最大連勝</span>
                                            <span className="text-xs text-orange-400 font-black">{entry.maxStreak}連勝</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
