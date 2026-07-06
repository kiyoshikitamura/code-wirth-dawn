import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { getAuthHeaders } from '@/lib/authToken';
import { soundManager } from '@/lib/soundManager';
import { Swords, Trophy, X, RefreshCw, Shield, User, Zap } from 'lucide-react';

interface ColosseumPvPModalProps {
    onClose: () => void;
}

export default function ColosseumPvPModal({ onClose }: ColosseumPvPModalProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const router = useRouter();
    const { userProfile, gold, fetchUserProfile } = useGameStore();

    const [opponents, setOpponents] = useState<any[]>([]);
    const [challengerScore, setChallengerScore] = useState<number>(0);
    const [challengerRank, setChallengerRank] = useState<string>('C');
    const [challengerStats, setChallengerStats] = useState<any>({ wins: 0, losses: 0, current_streak: 0, max_streak: 0, rating: 1500 });
    
    const [loading, setLoading] = useState(false);
    const [updatingDefense, setUpdatingDefense] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const fetchOpponents = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/opponents', {
                method: 'GET',
                headers: {
                    ...authHeaders
                }
            });

            if (res.ok) {
                const data = await res.json();
                setOpponents(data.opponents || []);
                setChallengerScore(data.challenger_score || 0);
                setChallengerRank(data.challenger_rank || 'C');
                if (data.challenger_stats) {
                    setChallengerStats(data.challenger_stats);
                }
            } else {
                const data = await res.json();
                setErrorMsg(data.error || '対戦相手の取得に失敗しました。');
            }
        } catch (err) {
            console.error('[PvP Opponents] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpponents();
    }, []);

    const handleUpdateDefense = async () => {
        setUpdatingDefense(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        soundManager?.playSE('se_item_get');

        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/defense', {
                method: 'POST',
                headers: {
                    ...authHeaders
                }
            });

            if (res.ok) {
                const data = await res.json();
                setSuccessMsg('現在のパーティ構成で防衛登録を更新しました！');
                setChallengerScore(data.score || challengerScore);
                setChallengerRank(data.rank || challengerRank);
                setTimeout(() => setSuccessMsg(null), 4000);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || '防衛登録の更新に失敗しました。');
            }
        } catch (err) {
            console.error('[PvP Defense Update] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setUpdatingDefense(false);
        }
    };

    const handleChallenge = async (opponent: any) => {
        if (userProfile?.current_quest_id) {
            setErrorMsg('すでに進行中のクエストがあります。諦めるか完了してから挑戦してください。');
            return;
        }

        setLoading(true);
        setErrorMsg(null);
        soundManager?.playSE('se_enter_location');

        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({ opponent_id: opponent.user_id })
            });

            if (res.ok) {
                const data = await res.json();
                
                // 対戦相手データを Zustand store に一時保持して遷移
                useGameStore.setState({ pvpOpponent: opponent } as any);
                
                // PvPバトル用仮想クエストページに遷移
                router.push(`/quest/${data.quest_id}`);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || '対戦の開始に失敗しました。');
            }
        } catch (err) {
            console.error('[PvP Challenge] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b14]/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-[#0d1117] border border-amber-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950/40 to-slate-900 border-b border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-400">
                        <Swords size={20} className="animate-pulse" />
                        <h2 className="font-black tracking-widest text-lg text-slate-100">闘技場 (対人アリーナ)</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    
                    {/* Challenger Stats Card */}
                    <div className="bg-gradient-to-b from-[#1c1d24] to-[#121318] border border-slate-700/60 rounded-xl p-4 shadow-inner relative overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[9px] uppercase tracking-wider text-amber-500/80 font-bold block mb-0.5">CHALLENGER</span>
                                <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                                    {userProfile?.name}
                                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded font-black">
                                        RANK {challengerRank}
                                    </span>
                                </h3>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] tracking-wider text-slate-400 font-medium block">アリーナレート</span>
                                <span className="text-lg font-black text-amber-400 font-mono">{challengerStats?.rating ?? 1500} pts</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center">
                            <div>
                                <span className="text-[9px] text-slate-400 block">勝利数</span>
                                <span className="text-sm font-bold text-emerald-400 font-mono">{challengerStats?.wins ?? 0}</span>
                            </div>
                            <div>
                                <span className="text-[9px] text-slate-400 block">敗北数</span>
                                <span className="text-sm font-bold text-rose-400 font-mono">{challengerStats?.losses ?? 0}</span>
                            </div>
                            <div>
                                <span className="text-[9px] text-slate-400 block">現在連勝</span>
                                <span className="text-sm font-bold text-sky-400 font-mono">{challengerStats?.current_streak ?? 0}</span>
                            </div>
                            <div>
                                <span className="text-[9px] text-slate-400 block">最多連勝</span>
                                <span className="text-sm font-bold text-amber-400 font-mono">{challengerStats?.max_streak ?? 0}</span>
                            </div>
                        </div>

                        {/* Defense Status */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
                            <div className="flex items-center gap-1.5">
                                <Shield size={14} className="text-amber-500/80" />
                                <span className="text-[10px] text-slate-300 font-bold">現在の戦闘評価:</span>
                                <span className="text-[11px] font-mono font-bold text-slate-100">{challengerScore} CS</span>
                            </div>
                            <button
                                disabled={updatingDefense}
                                onClick={handleUpdateDefense}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#1f2937]/80 hover:bg-[#374151] border border-slate-700/60 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw size={10} className={updatingDefense ? 'animate-spin' : ''} />
                                防衛登録を手動更新
                            </button>
                        </div>
                    </div>

                    {successMsg && (
                        <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-400 text-center animate-in fade-in zoom-in-95 duration-200">
                            {successMsg}
                        </div>
                    )}

                    {errorMsg && (
                        <div className="p-2.5 bg-red-950/20 border border-red-500/30 rounded-lg text-xs font-bold text-red-400 text-center animate-in fade-in zoom-in-95 duration-200">
                            {errorMsg}
                        </div>
                    )}

                    {/* Opponents List Section */}
                    <div className="space-y-2.5">
                        <h3 className="text-xs font-bold text-amber-500/80 uppercase tracking-wider flex items-center gap-1.5">
                            対戦相手マッチング (同ランク帯)
                        </h3>

                        {loading && opponents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-2">
                                <RefreshCw className="animate-spin text-amber-500/50" size={24} />
                                <span className="text-xs text-slate-500">対戦相手を検索中...</span>
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                                {opponents.map((opponent, idx) => (
                                    <div 
                                        key={opponent.user_id + '_' + idx}
                                        className="bg-[#161a22] border border-slate-800/80 hover:border-amber-500/20 rounded-xl p-3.5 flex items-center justify-between transition-all"
                                    >
                                        {/* Left Side: Opponent Info */}
                                        <div className="space-y-2 flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full border border-slate-700/60 bg-black/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {opponent.avatar_url ? (
                                                        <img src={opponent.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={14} className="text-slate-500" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                                                        {opponent.user_name}
                                                        {opponent.is_ghost && (
                                                            <span className="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded">GHOST</span>
                                                        )}
                                                    </h4>
                                                    <span className="text-[9px] text-slate-400 font-mono">
                                                        スコア: {opponent.battle_score} CS | ランク: {opponent.defense_rank}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Party Members Preview */}
                                            <div className="flex gap-1.5 items-center pl-10">
                                                <span className="text-[8px] text-slate-500 font-medium shrink-0">編成:</span>
                                                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                                    {/* Leader */}
                                                    <div className="text-[9px] bg-amber-900/20 text-amber-400 border border-amber-500/30 px-1 py-0.5 rounded-md font-bold whitespace-nowrap">
                                                        L. {opponent.player_snapshot?.job_class?.slice(0,6) || 'Hero'}
                                                    </div>
                                                    {/* NPCs */}
                                                    {opponent.party_members_snapshot?.map((m: any, mi: number) => (
                                                        <div key={mi} className="text-[9px] bg-slate-800/80 text-slate-300 border border-slate-700/50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                                            {m.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Challenge Button */}
                                        <button
                                            disabled={loading}
                                            onClick={() => handleChallenge(opponent)}
                                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition-all shadow-md shadow-amber-500/10 shrink-0"
                                        >
                                            挑戦する
                                        </button>
                                    </div>
                                ))}

                                {opponents.length === 0 && !loading && (
                                    <div className="text-center py-10 text-xs text-slate-500">
                                        対戦相手が見つかりませんでした。
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#0a0d14] border-t border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-[#1f2937] hover:bg-[#374151] border border-slate-700/60 rounded-xl hover:text-amber-400 transition-all text-xs font-bold text-slate-300 active:scale-95"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
