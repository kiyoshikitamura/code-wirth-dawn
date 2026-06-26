'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, Star, Flame, X, ArrowUpDown, Clock, Loader2 } from 'lucide-react';
import { getAuthToken } from '@/lib/authToken';
import XShareButton from '../shared/XShareButton';
import SimpleUserProfilePopup from '@/components/shared/SimpleUserProfilePopup';

type TabKey = 'reputation' | 'alignment';
type RepSort = 'desc' | 'asc';

interface RankEntry {
    rank: number;
    userId?: string;
    name: string;
    value?: number;
    order?: number;
    chaos?: number;
    justice?: number;
    evil?: number;
    total?: number;
}

interface RankingData {
    reputation: {
        status: 'ready' | 'aggregating';
        aggregated_at: string | null;
        top_desc: RankEntry[];
        top_asc: RankEntry[];
        my_value: number;
    };
    alignment: {
        status: 'ready' | 'aggregating';
        aggregated_at: string | null;
        cycle_started_at: string;
        cycle_ends_at: string;
        top: RankEntry[];
        my_values: { order: number; chaos: number; justice: number; evil: number; total: number };
    };
}

interface Props {
    onClose: () => void;
}

export default function RankingModal({ onClose }: Props) {
    const [data, setData] = useState<RankingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('reputation');
    const [repSort, setRepSort] = useState<RepSort>('desc');
    const [countdown, setCountdown] = useState('');
    const [selectedUser, setSelectedUser] = useState<{
        name: string;
        avatarUrl?: string;
        epithet?: string;
        introduction?: string;
        level?: number;
        age?: number;
    } | null>(null);

    const handleUserClick = async (userId?: string) => {
        if (!userId) return;
        try {
            const token = await getAuthToken();
            if (!token) return;
            const res = await fetch(`/api/profile?profileId=${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const profileData = await res.json();
                setSelectedUser({
                    name: profileData.name || '名もなき旅人',
                    avatarUrl: profileData.avatar_url,
                    epithet: profileData.title_name,
                    introduction: profileData.introduction || '',
                    level: profileData.level,
                    age: (profileData.age || 18) + Math.floor((profileData.accumulated_days || 0) / 365)
                });
            }
        } catch (e) {
            console.error('[Ranking] Failed to fetch clicked user profile:', e);
        }
    };

    useEffect(() => {
        fetchRanking();
    }, []);

    // Countdown timer
    useEffect(() => {
        if (!data?.alignment.cycle_ends_at) return;
        const target = new Date(data.alignment.cycle_ends_at).getTime();
        const tick = () => {
            const diff = Math.max(0, target - Date.now());
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [data?.alignment.cycle_ends_at]);

    const fetchRanking = async () => {
        try {
            const token = await getAuthToken();
            if (!token) return;
            const res = await fetch('/api/ranking', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) setData(await res.json());
        } catch (e) {
            console.error('[Ranking] Fetch failed:', e);
        } finally {
            setLoading(false);
        }
    };

    const tabs: { key: TabKey; label: string; icon: any }[] = [
        { key: 'reputation', label: '名声', icon: Star },
        { key: 'alignment', label: 'アライメント', icon: Flame },
    ];

    const formatTime = (iso: string | null) => {
        if (!iso) return '---';
        const d = new Date(iso);
        return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const repList = useMemo(() => {
        if (!data) return [];
        return repSort === 'desc' ? data.reputation.top_desc : data.reputation.top_asc;
    }, [data, repSort]);

    const content = createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-2">
            <div className="bg-[#0d1a2e] border-2 border-[#2a4080]/70 w-full max-w-lg h-[90dvh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-[#1a2d5a] to-[#0d1a2e] p-4 flex items-center justify-between border-b border-[#2a4080]/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Trophy className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white tracking-wider font-serif">ランキング</h2>
                            <p className="text-[9px] text-blue-300/50 tracking-widest uppercase">Ranking</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-[#0a1226] border-b border-[#2a4080]/30">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 transition-all relative ${
                                    isActive ? 'text-amber-400 bg-[#122042]/80' : 'text-gray-500 hover:text-gray-300 hover:bg-[#122042]/40'
                                }`}
                            >
                                <tab.icon size={16} />
                                <span className="text-[10px] font-bold tracking-wider">{tab.label}</span>
                                {isActive && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-amber-400 rounded-full" />}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar md:custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : !data ? (
                        <div className="flex items-center justify-center h-40 text-gray-500 text-sm">データの取得に失敗しました</div>
                    ) : activeTab === 'reputation' ? (
                        /* ===== Reputation Tab ===== */
                        <div>
                            {/* Status / Aggregation Info */}
                            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setRepSort(repSort === 'desc' ? 'asc' : 'desc')}
                                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[#122042] border border-[#2a4080]/40 text-gray-300 hover:text-white hover:border-amber-500/50 transition-all"
                                    >
                                        <ArrowUpDown size={10} />
                                        {repSort === 'desc' ? '名声高い順' : '悪名高い順'}
                                    </button>
                                </div>
                                {data.reputation.status === 'aggregating' ? (
                                    <span className="flex items-center gap-1 text-[9px] text-amber-400">
                                        <Loader2 size={10} className="animate-spin" /> 集計中...
                                    </span>
                                ) : (
                                    <span className="text-[9px] text-gray-600">
                                        集計: {formatTime(data.reputation.aggregated_at)}
                                    </span>
                                )}
                            </div>

                            {/* My Value */}
                            <div className="mx-4 mb-3 p-2.5 rounded-lg bg-amber-900/20 border border-amber-800/30">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-amber-400/70 font-bold">あなたの名声値</span>
                                    <span className={`text-lg font-bold font-mono ${data.reputation.my_value >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {data.reputation.my_value >= 0 ? '+' : ''}{data.reputation.my_value}
                                    </span>
                                </div>
                            </div>

                            {/* Ranking List */}
                            <div className="divide-y divide-[#2a4080]/20">
                                {repList.length === 0 ? (
                                    <div className="text-center py-10 text-gray-600 text-sm font-serif italic">データがありません</div>
                                ) : repList.map((entry, i) => (
                                    <div key={i} className="px-4 py-2 flex items-center gap-3">
                                        <span className={`w-7 text-center font-bold font-mono text-sm ${
                                            entry.rank === 1 ? 'text-yellow-400' :
                                            entry.rank === 2 ? 'text-gray-300' :
                                            entry.rank === 3 ? 'text-amber-600' : 'text-gray-600'
                                        }`}>
                                            {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                                        </span>
                                        <span 
                                            onClick={() => handleUserClick(entry.userId)}
                                            className="flex-1 text-sm text-slate-200 truncate hover:text-amber-400 cursor-pointer transition-colors"
                                        >
                                            {entry.name}
                                        </span>
                                        <span className={`text-sm font-mono font-bold ${
                                            (entry.value ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                            {(entry.value ?? 0) >= 0 ? '+' : ''}{entry.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* ===== Alignment Tab ===== */
                        <div>
                            {/* Countdown */}
                            <div className="px-4 py-1.5 flex items-center justify-between border-b border-[#2a4080]/20 bg-[#122042]/40">
                                <span className="text-[10px] text-gray-400">世界の変換まで:</span>
                                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                                    <Clock size={12} className="text-amber-500/50" />
                                    {countdown || '--:--:--'}
                                </span>
                            </div>

                            {/* Status */}
                            <div className="px-4 pb-2 flex items-center justify-end">
                                {data.alignment.status === 'aggregating' ? (
                                    <span className="flex items-center gap-1 text-[9px] text-amber-400">
                                        <Loader2 size={10} className="animate-spin" /> 集計中...
                                    </span>
                                ) : (
                                    <span className="text-[9px] text-gray-600">
                                        集計: {formatTime(data.alignment.aggregated_at)}
                                    </span>
                                )}
                            </div>

                            {/* My Values */}
                            <div className="mx-4 mb-3 p-2.5 rounded-lg bg-purple-900/15 border border-purple-800/30">
                                <div className="text-[10px] text-purple-400/70 font-bold mb-1.5">あなたの今期間の貢献</div>
                                <div className="grid grid-cols-5 gap-1 text-center">
                                    {[
                                        { label: '秩序', val: data.alignment.my_values.order, color: 'text-blue-400' },
                                        { label: '混沌', val: data.alignment.my_values.chaos, color: 'text-purple-400' },
                                        { label: '正義', val: data.alignment.my_values.justice, color: 'text-amber-400' },
                                        { label: '悪', val: data.alignment.my_values.evil, color: 'text-red-400' },
                                        { label: '合計', val: data.alignment.my_values.total, color: 'text-white' },
                                    ].map(a => (
                                        <div key={a.label}>
                                            <div className="text-[8px] text-gray-500">{a.label}</div>
                                            <div className={`text-sm font-bold font-mono ${a.color}`}>{a.val}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Ranking List */}
                            {/* Header */}
                            <div className="px-4 py-1 flex items-center gap-2 text-[8px] text-gray-600 border-b border-[#2a4080]/20">
                                <span className="w-7 text-center">#</span>
                                <span className="flex-1">名前</span>
                                <span className="w-8 text-center">秩序</span>
                                <span className="w-8 text-center">混沌</span>
                                <span className="w-8 text-center">正義</span>
                                <span className="w-8 text-center">悪</span>
                                <span className="w-10 text-center">合計</span>
                            </div>
                            <div className="divide-y divide-[#2a4080]/15">
                                {data.alignment.top.length === 0 ? (
                                    <div className="text-center py-10 text-gray-600 text-sm font-serif italic">データがありません</div>
                                ) : data.alignment.top.map((entry, i) => (
                                    <div key={i} className="px-4 py-1.5 flex items-center gap-2">
                                        <span className={`w-7 text-center font-bold font-mono text-[11px] ${
                                            entry.rank === 1 ? 'text-yellow-400' :
                                            entry.rank === 2 ? 'text-gray-300' :
                                            entry.rank === 3 ? 'text-amber-600' : 'text-gray-600'
                                        }`}>
                                            {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                                        </span>
                                        <span 
                                            onClick={() => handleUserClick(entry.userId)}
                                            className="flex-1 text-[11px] text-slate-200 truncate hover:text-amber-400 cursor-pointer transition-colors"
                                        >
                                            {entry.name}
                                        </span>
                                        <span className="w-8 text-center text-[10px] font-mono text-blue-400">{entry.order}</span>
                                        <span className="w-8 text-center text-[10px] font-mono text-purple-400">{entry.chaos}</span>
                                        <span className="w-8 text-center text-[10px] font-mono text-amber-400">{entry.justice}</span>
                                        <span className="w-8 text-center text-[10px] font-mono text-red-400">{entry.evil}</span>
                                        <span className="w-10 text-center text-[11px] font-mono font-bold text-white">{entry.total}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer + ランキング1位シェア */}
                <div className="p-2 border-t border-[#2a4080]/30 bg-[#0a1226]">
                    {data && (() => {
                        // #17 名声ランキング1位
                        const isRepRank1 = data.reputation.top_desc.length > 0 && data.reputation.top_desc[0].value === data.reputation.my_value && data.reputation.my_value > 0;
                        // #18 アライメントランキング1位
                        const isAlignRank1 = data.alignment.top.length > 0 && data.alignment.top[0].total === data.alignment.my_values.total && data.alignment.my_values.total > 0;

                        if (activeTab === 'reputation' && isRepRank1) {
                            const shareText = `名声ランキング第1位。この世界で最も名の知れた旅人となった。 #WirthDawn #CWD #頂点`;
                            const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share?t=ranking_fame_1st` : undefined;
                            return (
                                <div className="mb-2">
                                    <XShareButton text={shareText} shareUrl={shareUrl} variant="outline" className="w-full !text-amber-400 !border-amber-400/30 hover:!bg-amber-400/10 !text-xs" />
                                </div>
                            );
                        }
                        if (activeTab === 'alignment' && isAlignRank1) {
                            // 最大軸を判定
                            const vals = data.alignment.my_values;
                            const axes = [
                                { key: '秩序', val: vals.order }, { key: '混沌', val: vals.chaos },
                                { key: '正義', val: vals.justice }, { key: '悪', val: vals.evil },
                            ];
                            const top = axes.sort((a, b) => b.val - a.val)[0];
                            const shareText = `${top.key}ランキング第1位。この世界で最も${top.key}を司る存在。 #WirthDawn #CWD #覇者`;
                            const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share?t=ranking_alignment_1st&axis=${encodeURIComponent(top.key)}` : undefined;
                            return (
                                <div className="mb-2">
                                    <XShareButton text={shareText} shareUrl={shareUrl} variant="outline" className="w-full !text-purple-400 !border-purple-400/30 hover:!bg-purple-400/10 !text-xs" />
                                </div>
                            );
                        }
                        return null;
                    })()}
                    <p className="text-[8px] text-gray-600 leading-relaxed text-center">
                        ※ ランキングは定期的に集計されます。あなたの値はリアルタイムで表示されます。
                    </p>
                </div>
            </div>

            {/* Simple User Profile Popup */}
            {selectedUser && (
                <SimpleUserProfilePopup
                    isOpen={!!selectedUser}
                    onClose={() => setSelectedUser(null)}
                    avatarUrl={selectedUser.avatarUrl}
                    name={selectedUser.name}
                    epithet={selectedUser.epithet}
                    introduction={selectedUser.introduction}
                    level={selectedUser.level}
                    age={selectedUser.age}
                />
            )}
        </div>,
        document.body
    );

    return content;
}
