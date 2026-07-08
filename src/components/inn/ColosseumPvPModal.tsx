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
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            setPortalTarget(document.body);
        }
    }, []);

    const router = useRouter();
    const { userProfile, gold, fetchUserProfile } = useGameStore();

    const [selectedOpponent, setSelectedOpponent] = useState<any | null>(null);
    const [opponents, setOpponents] = useState<any[]>([]);
    const [challengerScore, setChallengerScore] = useState<number>(0);
    const [challengerRank, setChallengerRank] = useState<string>('C');
    const [challengerStats, setChallengerStats] = useState<any>({ wins: 0, losses: 0, current_streak: 0, max_streak: 0, rating: 1500 });
    
    const [loading, setLoading] = useState(false);
    const [updatingDefense, setUpdatingDefense] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [selectedMemberDetail, setSelectedMemberDetail] = useState<any | null>(null);

    const [hasDefenseParty, setHasDefenseParty] = useState<boolean>(true);
    const [showDefenseHistory, setShowDefenseHistory] = useState<boolean>(false);
    const [defenseLogs, setDefenseLogs] = useState<any[]>([]);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

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
                setHasDefenseParty(!!data.has_defense_party);
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
                setSelectedOpponent(null);
                
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

    // 自分の防衛パーティをGETして詳細表示用にマウントする
    const handleViewMyDefense = async () => {
        setLoading(true);
        setErrorMsg(null);
        soundManager?.playSE('se_item_get');
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/defense', {
                method: 'GET',
                headers: {
                    ...authHeaders
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.party) {
                    const dummyOpponent = {
                        user_id: userProfile?.id || 'me',
                        user_name: `${userProfile?.name}（登録中の防衛パーティ）`,
                        avatar_url: userProfile?.avatar_url,
                        battle_score: challengerScore,
                        defense_rank: challengerRank,
                        is_my_defense: true,
                        player_snapshot: {
                            level: userProfile?.level || 20,
                            job_class: userProfile?.job_class || 'Adventurer',
                            hp: data.party.player_snapshot?.hp || 300,
                            atk: data.party.player_snapshot?.atk || 50,
                            def: data.party.player_snapshot?.def || 50,
                        },
                        party_members_snapshot: data.party.party_members_snapshot || [],
                        equipped_items_snapshot: data.party.equipped_items_snapshot || [],
                        skill_deck_snapshot: data.party.skill_deck_snapshot || []
                    };
                    setSelectedOpponent(dummyOpponent);
                } else {
                    setErrorMsg('防衛パーティが登録されていません。');
                }
            } else {
                const data = await res.json();
                setErrorMsg(data.error || '防衛データの取得に失敗しました。');
            }
        } catch (err) {
            console.error('[PvP View My Defense] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    // 防衛履歴（ログ一覧）を取得する
    const fetchDefenseLogs = async () => {
        setLoadingLogs(true);
        setErrorMsg(null);
        soundManager?.playSE('se_item_get');
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/defense-logs', {
                method: 'GET',
                headers: {
                    ...authHeaders
                }
            });
            if (res.ok) {
                const data = await res.json();
                setDefenseLogs(data.logs || []);
                setShowDefenseHistory(true);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || '防衛履歴の取得に失敗しました。');
            }
        } catch (err) {
            console.error('[PvP Defense Logs] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoadingLogs(false);
        }
    };

    return (
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

                        {/* Defense Status & Operations */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Shield size={14} className="text-amber-500/80" />
                                    <span className="text-[10px] text-slate-300 font-bold">現在の戦闘評価:</span>
                                    <span className="text-[11px] font-mono font-bold text-slate-100">{challengerScore} CS</span>
                                </div>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${hasDefenseParty ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                    {hasDefenseParty ? '防衛登録済' : '防衛未登録'}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5">
                                <button
                                    disabled={updatingDefense}
                                    onClick={handleUpdateDefense}
                                    className="flex items-center justify-center gap-1 py-1.5 bg-[#1f2937]/80 hover:bg-[#374151] border border-slate-700/60 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                    title="現在のあなたの装備・スキル・お供編成を防衛デッキとして登録・更新します"
                                >
                                    <RefreshCw size={10} className={updatingDefense ? 'animate-spin' : ''} />
                                    防衛登録を更新
                                </button>
                                <button
                                    disabled={loading || !hasDefenseParty}
                                    onClick={handleViewMyDefense}
                                    className="flex items-center justify-center gap-1 py-1.5 bg-[#1f2937]/80 hover:bg-[#374151] border border-slate-700/60 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <Shield size={10} />
                                    防衛構成を確認
                                </button>
                                <button
                                    disabled={loadingLogs || !hasDefenseParty}
                                    onClick={fetchDefenseLogs}
                                    className="flex items-center justify-center gap-1 py-1.5 bg-[#1f2937]/80 hover:bg-[#374151] border border-slate-700/60 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <Swords size={10} />
                                    防衛履歴(勝敗)
                                </button>
                            </div>
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
                        {!hasDefenseParty ? (
                            <div className="bg-[#161a22] border border-amber-500/30 rounded-xl p-6 text-center space-y-4 shadow-[0_0_25px_rgba(245,158,11,0.08)] animate-in fade-in zoom-in-95 duration-200">
                                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
                                    <Shield size={24} className="animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-amber-400">防衛パーティが未登録です</h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                                        闘技場で他の冒険者に挑戦するには、まず現在のパーティ編成（リーダーの装備/スキル・同行英霊）を「あなたの防衛パーティ」として登録する必要があります。
                                    </p>
                                </div>
                                <button
                                    disabled={updatingDefense}
                                    onClick={handleUpdateDefense}
                                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition-all shadow-lg shadow-amber-500/15 flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    <Shield size={14} />
                                    {updatingDefense ? '登録処理中...' : '現在のパーティを登録する'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-amber-500/80 uppercase tracking-wider flex items-center gap-1.5">
                                        対戦相手マッチング (同ランク帯)
                                    </h3>
                                    <button
                                        disabled={loading}
                                        onClick={fetchOpponents}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 rounded-lg text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-all active:scale-95 disabled:opacity-50"
                                        title="対戦相手を再読み込み"
                                    >
                                        <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                                        リロード
                                    </button>
                                </div>

                        {loading && opponents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-2">
                                <RefreshCw className="animate-spin text-amber-500/50" size={24} />
                                <span className="text-xs text-slate-500">対戦相手を検索中...</span>
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                                {opponents && Array.isArray(opponents) && opponents.filter(Boolean).map((opponent, idx) => (
                                    <div 
                                        key={(opponent.user_id || 'opt') + '_' + idx}
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
                                                    {opponent.party_members_snapshot && Array.isArray(opponent.party_members_snapshot) && opponent.party_members_snapshot.filter(Boolean).map((m: any, mi: number) => (
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
                                            onClick={() => {
                                                soundManager?.playSE('se_item_get');
                                                setSelectedOpponent(opponent);
                                            }}
                                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition-all shadow-md shadow-amber-500/10 shrink-0 disabled:opacity-40 disabled:pointer-events-none"
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

            {/* Opponent Detail Preview Modal */}
            {selectedOpponent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
                    <div className="relative w-full max-w-lg bg-[#0e121a] border-2 border-amber-500/50 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.3)] flex flex-col max-h-[85vh]">
                        {/* Title */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950/60 to-slate-900 border-b border-amber-500/30">
                            <h3 className="font-black text-amber-400 tracking-wider flex items-center gap-2 text-sm">
                                <Swords size={18} />
                                対戦相手の詳細確認
                            </h3>
                            <button
                                onClick={() => {
                                    soundManager?.playSE('se_item_get');
                                    setSelectedOpponent(null);
                                }}
                                className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg animate-in"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Detail Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left">
                            {/* Leader Segment */}
                            <div className="bg-gradient-to-b from-[#1b1c24] to-[#121319] border border-amber-500/20 rounded-xl p-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full border border-amber-500/40 bg-black/60 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {selectedOpponent.avatar_url ? (
                                            <img src={selectedOpponent.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={20} className="text-amber-500/70" />
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase tracking-wider text-amber-500 font-black block">LEADER / PLAYER</span>
                                        <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                            {selectedOpponent.user_name}
                                            <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-black border border-amber-500/30">
                                                Lvl {selectedOpponent.player_snapshot?.level || 1}
                                            </span>
                                        </h4>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            職業: {selectedOpponent.player_snapshot?.job_class || 'Adventurer'}
                                        </span>
                                    </div>
                                </div>

                                {/* Leader Stats */}
                                <div className="grid grid-cols-3 gap-2 text-center py-2 bg-black/40 rounded-lg border border-slate-800">
                                    <div>
                                        <span className="text-[9px] text-slate-400 block font-bold">HP</span>
                                        <span className="text-xs font-bold text-emerald-400 font-mono">
                                            {selectedOpponent.player_snapshot?.hp || 100}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-slate-400 block font-bold">ATK</span>
                                        <span className="text-xs font-bold text-rose-400 font-mono">
                                            {selectedOpponent.player_snapshot?.atk || 10}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-slate-400 block font-bold">DEF</span>
                                        <span className="text-xs font-bold text-sky-400 font-mono">
                                            {selectedOpponent.player_snapshot?.def || 10}
                                        </span>
                                    </div>
                                </div>

                                {/* Equipped Gears */}
                                <div className="space-y-1.5">
                                    <span className="text-[10px] text-amber-500/90 font-bold block">🛡️ 装備中の武具:</span>
                                    {selectedOpponent.equipped_items_snapshot && selectedOpponent.equipped_items_snapshot.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedOpponent.equipped_items_snapshot && Array.isArray(selectedOpponent.equipped_items_snapshot) && selectedOpponent.equipped_items_snapshot.filter(Boolean).map((item: any, idx: number) => {
                                                let displayName = item.name;
                                                if (!displayName || displayName.trim() === '') {
                                                    const ed = item.effect_data || {};
                                                    const bonuses: string[] = [];
                                                    if (ed.atk_bonus) bonuses.push(`ATK+${ed.atk_bonus}`);
                                                    if (ed.def_bonus) bonuses.push(`DEF+${ed.def_bonus}`);
                                                    if (ed.hp_bonus) bonuses.push(`HP+${ed.hp_bonus}`);
                                                    
                                                    // 特殊な戦闘開始時パッシブバフも反映
                                                    if (ed.battle_start_buff) {
                                                        const buffs = Array.isArray(ed.battle_start_buff)
                                                            ? ed.battle_start_buff
                                                            : [ed.battle_start_buff];
                                                        
                                                        const buffLabelMap: Record<string, string> = {
                                                            'absolute_barrier': 'バリア',
                                                            'atk_up': '攻撃UP',
                                                            'def_up': '防御UP',
                                                            'regen': 'リジェネ',
                                                            'evasion_up': '回避UP',
                                                            'stun_immune': 'スタン無効',
                                                            'berserk': '狂戦士',
                                                        };
                                                        
                                                        buffs.forEach((b: any) => {
                                                            const bId = b.buff_type || b.id;
                                                            if (bId) {
                                                                const label = buffLabelMap[bId] || 'バフ';
                                                                // 重複防止
                                                                if (!bonuses.includes(label)) {
                                                                    bonuses.push(label);
                                                                }
                                                            }
                                                        });
                                                    }
                                                    
                                                    if (bonuses.length > 0) {
                                                        displayName = `遺物 (${bonuses.join('/')})`;
                                                    } else {
                                                        displayName = '神秘の遺物';
                                                    }
                                                }
                                                return (
                                                    <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-medium">
                                                        {displayName}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-500 italic block">装備なし</span>
                                    )}
                                </div>

                                {/* Skill Deck */}
                                <div className="space-y-1.5">
                                    <span className="text-[10px] text-amber-500/90 font-bold block">🔮 スキルデッキ:</span>
                                    {selectedOpponent.skill_deck_snapshot && selectedOpponent.skill_deck_snapshot.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedOpponent.skill_deck_snapshot && Array.isArray(selectedOpponent.skill_deck_snapshot) && selectedOpponent.skill_deck_snapshot.filter(Boolean).map((card: any, idx: number) => (
                                                <span key={idx} className="text-[10px] bg-amber-950/20 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md font-medium">
                                                    {card.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-500 italic block">初期デッキ</span>
                                    )}
                                </div>
                            </div>

                            {/* Party Members Segment */}
                            <div className="space-y-3">
                                <span className="text-[11px] font-bold text-amber-500/80 uppercase tracking-widest block">
                                    👥 同行メンバー ({selectedOpponent.party_members_snapshot?.length || 0}名)
                                </span>
                                
                                {selectedOpponent.party_members_snapshot && selectedOpponent.party_members_snapshot.length > 0 ? (
                                    <div className="space-y-2.5">
                                        {selectedOpponent.party_members_snapshot && Array.isArray(selectedOpponent.party_members_snapshot) && selectedOpponent.party_members_snapshot.filter(Boolean).map((m: any, idx: number) => (
                                            <div 
                                                key={idx} 
                                                onClick={() => {
                                                    soundManager?.playSE('se_item_get');
                                                    setSelectedMemberDetail(m);
                                                }}
                                                className="bg-[#141822] hover:bg-[#1b2230] border border-slate-800 hover:border-amber-500/20 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] select-none"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-md border border-slate-700 bg-black/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {m.icon_url || m.image_url ? (
                                                            <img src={m.icon_url || m.image_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={14} className="text-slate-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                                            {m.name}
                                                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono">
                                                                L. {m.level || 1}
                                                            </span>
                                                        </h5>
                                                        <span className="text-[9px] text-slate-400 block font-mono">
                                                            クラス: {m.job_class || '傭兵'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Member Mini Stats */}
                                                <div className="flex gap-3 text-right font-mono text-[10px]">
                                                    <div>
                                                        <span className="text-[8px] text-slate-500 block">HP</span>
                                                        <span className="font-bold text-emerald-400">{m.hp || 100}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] text-slate-500 block">ATK</span>
                                                        <span className="font-bold text-rose-400">{m.atk || 10}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] text-slate-500 block">DEF</span>
                                                        <span className="font-bold text-sky-400">{m.def || 10}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 bg-[#141822] border border-slate-800/80 rounded-xl text-[10px] text-slate-500 italic">
                                        同行メンバーなし (ソロ編成)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Confirmation Footer */}
                        <div className="px-6 py-4 bg-[#0a0d14] border-t border-slate-800/80 space-y-3">
                            {selectedOpponent.is_my_defense ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            soundManager?.playSE('se_item_get');
                                            setSelectedOpponent(null);
                                        }}
                                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl active:scale-95 transition-all text-center"
                                    >
                                        閉じる
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-[10px] font-bold text-amber-500/95 text-center flex items-center justify-center gap-1">
                                        <Zap size={10} className="animate-bounce text-amber-400" />
                                        本当にこの防衛パーティに挑戦しますか？
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                soundManager?.playSE('se_item_get');
                                                setSelectedOpponent(null);
                                            }}
                                            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl active:scale-95 transition-all text-center"
                                        >
                                            戻る
                                        </button>
                                        <button
                                            disabled={loading}
                                            onClick={() => {
                                                handleChallenge(selectedOpponent);
                                            }}
                                            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1"
                                        >
                                            {loading ? <RefreshCw className="animate-spin" size={12} /> : <Swords size={12} />}
                                            本当に挑戦する
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Defense History Modal */}
            {showDefenseHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
                    <div className="relative w-full max-w-md bg-[#0e121a] border border-slate-700/60 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[80vh]">
                        {/* Title */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950/40 to-slate-900 border-b border-slate-805">
                            <h3 className="font-black text-amber-400 tracking-wider flex items-center gap-2 text-sm">
                                <Swords size={18} />
                                防衛戦の履歴
                            </h3>
                            <button
                                onClick={() => {
                                    soundManager?.playSE('se_item_get');
                                    setShowDefenseHistory(false);
                                }}
                                className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Logs List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                            {defenseLogs.length === 0 ? (
                                <div className="text-center py-12 text-xs text-slate-500 italic">
                                    防衛戦の記録はありません。
                                </div>
                            ) : (
                                defenseLogs.map((log: any, idx: number) => {
                                    const dateStr = log.created_at
                                        ? new Date(log.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : '不明な日時';
                                    
                                    return (
                                        <div key={log.id || idx} className="bg-[#141720] border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-left">
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${log.is_defense_win ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                                        {log.is_defense_win ? '防衛成功' : '防衛失敗'}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-200">{log.challenger_name}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                                                    <span>{dateStr}</span>
                                                    <span>|</span>
                                                    <span className={log.rating_change >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                                        {log.rating_change >= 0 ? `+${log.rating_change}` : log.rating_change} pts
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    soundManager?.playSE('se_item_get');
                                                    setSelectedLog(log);
                                                }}
                                                className="px-3 py-1.5 bg-[#252f3f] hover:bg-[#313e54] text-slate-200 border border-slate-700/60 font-bold text-[10px] rounded-lg active:scale-95 transition-all"
                                            >
                                                ログ確認
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-[#0a0d14] border-t border-slate-850 flex justify-end">
                            <button
                                onClick={() => {
                                    soundManager?.playSE('se_item_get');
                                    setShowDefenseHistory(false);
                                }}
                                className="px-5 py-2 bg-[#1f2937] hover:bg-[#374151] border border-slate-700/60 rounded-xl hover:text-amber-400 transition-all text-xs font-bold text-slate-300 active:scale-95"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Defense Battle Logs Replay Popup */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
                    <div className="relative w-full max-w-lg bg-[#070b12] border-2 border-slate-700/80 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]">
                        {/* Title */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800">
                            <div className="text-left">
                                <h3 className="font-black text-slate-200 tracking-wider text-xs">
                                    戦闘ログ詳細
                                </h3>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    挑戦者: {selectedLog.challenger_name} | {selectedLog.is_defense_win ? '防衛成功' : '防衛失敗'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    soundManager?.playSE('se_item_get');
                                    setSelectedLog(null);
                                }}
                                className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Logs Content */}
                        <div className="flex-1 overflow-y-auto p-5 bg-black/40 space-y-1.5 custom-scrollbar font-mono text-[10px] text-slate-300 text-left">
                            {selectedLog.battle_logs && selectedLog.battle_logs.length > 0 ? (
                                selectedLog.battle_logs.map((line: string, lineIdx: number) => {
                                    let textColor = 'text-slate-300';
                                    if (line.includes('ダメージ') || line.includes('大打撃')) textColor = 'text-rose-400 font-medium';
                                    else if (line.includes('回復') || line.includes('得た')) textColor = 'text-emerald-400 font-medium';
                                    else if (line.includes('ターン') || line.includes('バトル開始')) textColor = 'text-amber-400/90 font-bold';
                                    else if (line.includes('戦闘不能') || line.includes('倒れた')) textColor = 'text-red-500 font-black';
                                    
                                    return (
                                        <div key={lineIdx} className={`${textColor} py-0.5 border-b border-slate-900/60 leading-relaxed`}>
                                            {line}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 text-slate-500 italic">
                                    戦闘メッセージの記録はありません。
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-[#070b12] border-t border-slate-850 flex justify-end">
                            <button
                                onClick={() => {
                                    soundManager?.playSE('se_item_get');
                                    setSelectedLog(null);
                                }}
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl active:scale-95 transition-all"
                            >
                                戻る
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Party Member Detail Modal */}
            {selectedMemberDetail && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => setSelectedMemberDetail(null)}>
                    <div className="bg-[#0e121a] border border-amber-500/40 rounded-xl p-5 w-full max-w-[320px] shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-lg border border-amber-500/30 bg-black/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {selectedMemberDetail.icon_url || selectedMemberDetail.image_url ? (
                                        <img src={selectedMemberDetail.icon_url || selectedMemberDetail.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={18} className="text-amber-500/60" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                                        {selectedMemberDetail.name}
                                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono">
                                            L. {selectedMemberDetail.level || 1}
                                        </span>
                                    </h4>
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                        クラス: {selectedMemberDetail.job_class || '傭兵'}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedMemberDetail(null)} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-2 text-[11px]">
                            <div className="flex justify-between items-center bg-slate-900/60 rounded-lg border border-slate-800 px-3 py-1.5">
                                <span className="text-emerald-400 font-bold">HP</span>
                                <span className="text-slate-200 font-mono font-bold">{selectedMemberDetail.hp || 100} / {selectedMemberDetail.max_hp || selectedMemberDetail.hp || 100}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-900/60 rounded-lg border border-slate-800 px-3 py-1.5">
                                <span className="text-rose-400 font-bold">攻撃力</span>
                                <span className="text-slate-200 font-mono font-bold">{selectedMemberDetail.atk || 10}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-900/60 rounded-lg border border-slate-800 px-3 py-1.5">
                                <span className="text-sky-400 font-bold">防御力</span>
                                <span className="text-slate-200 font-mono font-bold">{selectedMemberDetail.def || 10}</span>
                            </div>

                            {/* Equipped Items */}
                            <div className="bg-slate-900/60 rounded-lg border border-slate-800 px-3 py-2 space-y-1">
                                <span className="text-slate-400 font-bold text-[10px]">🛡️ 装備中の武具:</span>
                                <div className="flex flex-wrap gap-1">
                                    {((selectedMemberDetail.equipped_items_snapshot || selectedMemberDetail.equipped_items || [])).length > 0 ? (
                                        (selectedMemberDetail.equipped_items_snapshot || selectedMemberDetail.equipped_items).map((item: any, idx: number) => (
                                            <span key={idx} className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700/50 px-1.5 py-0.5 rounded">
                                                {item.name || item}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[9px] text-slate-500 italic">装備なし</span>
                                    )}
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="bg-slate-900/60 rounded-lg border border-slate-800 px-3 py-2 space-y-1">
                                <span className="text-amber-400 font-bold text-[10px]">🔮 所持スキル (デッキ):</span>
                                <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto custom-scrollbar">
                                    {(selectedMemberDetail.signature_deck_snapshot || selectedMemberDetail.skill_names || []).length > 0 ? (
                                        (selectedMemberDetail.signature_deck_snapshot || selectedMemberDetail.skill_names).map((skill: any, si: number) => (
                                            <span key={si} className="px-1.5 py-0.5 bg-amber-950/20 border border-amber-500/20 rounded text-[9px] text-amber-300 font-medium">
                                                {typeof skill === 'string' ? skill : skill.name || skill}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[9px] text-slate-500 italic">なし</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
