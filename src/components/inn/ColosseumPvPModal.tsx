import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { getAuthHeaders } from '@/lib/authToken';
import { soundManager } from '@/lib/soundManager';
import { Swords, Trophy, X, RefreshCw, Shield, User, Zap, BookOpen, Clock, Award, ChevronRight } from 'lucide-react';
import SimpleUserProfilePopup from '@/components/shared/SimpleUserProfilePopup';

interface ColosseumPvPModalProps {
    onClose: () => void;
}

// クライアント側での極小キャッシュ（モーダルを開き直した際の一瞬のチラつき防止）
let localOpponentsCache: any[] = [];

export default function ColosseumPvPModal({ onClose }: ColosseumPvPModalProps) {
    const [mounted, setMounted] = useState(false);
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    const [tab, setTab] = useState<'opponents' | 'ranking' | 'logs' | 'rules'>('opponents');

    // API Stats
    const [cp, setCP] = useState<number>(5);
    const [nextCPTimeMs, setNextCPTimeMs] = useState<number | null>(null);
    const [arenaRate, setArenaRate] = useState<number>(1000);
    const [challengerRank, setChallengerRank] = useState<string>('C');
    const [challengerScore, setChallengerScore] = useState<number>(0);
    const [hasDefenseParty, setHasDefenseParty] = useState<boolean>(false);

    // List States
    const [opponents, setOpponents] = useState<any[]>(localOpponentsCache);
    const [rankingList, setRankingList] = useState<any[]>([]);
    const [myRankingStatus, setMyRankingStatus] = useState<any>(null);
    const [rankingType, setRankingType] = useState<'season' | 'daily'>('season');
    const [battleLogs, setBattleLogs] = useState<any[]>([]);
    
    // Lazy Load Details
    const [selectedOpponent, setSelectedOpponent] = useState<any | null>(null);
    const [selectedOpponentDetail, setSelectedOpponentDetail] = useState<any | null>(null);
    const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
    const [selectedLogText, setSelectedLogText] = useState<string | null>(null);
    const [loadingLogText, setLoadingLogText] = useState<boolean>(false);
    
    // Reward Popup
    const [claimableRewards, setClaimableRewards] = useState<any[]>([]);
    const [showRewardModal, setShowRewardModal] = useState<boolean>(false);

    // User Profile Popup
    const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null);

    // UI States
    const [loading, setLoading] = useState(false);
    const [updatingDefense, setUpdatingDefense] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [initialFetchDone, setInitialFetchDone] = useState(false);
    const [rankingLastUpdated, setRankingLastUpdated] = useState<string>('');

    const router = useRouter();
    const { userProfile, gold, fetchUserProfile } = useGameStore();

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            setPortalTarget(document.body);
        }
    }, []);

    // 現在のシーズン期間算出（水曜日 18:00 切り替え）
    const getCurrentSeasonPeriod = () => {
        const now = new Date();
        const jstOffset = 9 * 60 * 60 * 1000;
        const jstNow = new Date(now.getTime() + jstOffset);

        // 前回の水曜日 18:00
        const prevWed = new Date(jstNow);
        const currentDay = jstNow.getUTCDay(); // 0:日, 3:水
        let daysToSubtract = currentDay - 3;
        if (daysToSubtract < 0) daysToSubtract += 7;
        
        prevWed.setUTCDate(jstNow.getUTCDate() - daysToSubtract);
        prevWed.setUTCHours(9, 0, 0, 0); // JST 18:00 -> UTC 9:00

        if (prevWed.getTime() > jstNow.getTime()) {
            prevWed.setUTCDate(prevWed.getUTCDate() - 7);
        }

        // 次回の水曜日 18:00
        const nextWed = new Date(prevWed);
        nextWed.setUTCDate(prevWed.getUTCDate() + 7);

        // UTCからローカル時間に戻して整形
        const formatJST = (d: Date) => {
            const l = new Date(d.getTime() - jstOffset);
            return `${l.getFullYear()}/${(l.getMonth()+1).toString().padStart(2,'0')}/${l.getDate().toString().padStart(2,'0')} 18:00`;
        };

        return `${formatJST(prevWed)} 〜 ${formatJST(nextWed)}`;
    };

    // 1. CPとアリーナレートの超軽量同期 (sync-stats)
    const syncStats = async () => {
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/sync-stats', {
                method: 'GET',
                headers: { ...authHeaders }
            });
            if (res.ok) {
                const data = await res.json();
                setCP(data.colosseum_cp);
                setNextCPTimeMs(data.nextRecoveryTimeMs);
                setArenaRate(data.arena_rate);
            }
        } catch (err) {
            console.warn('[PvP Sync] Sync stats failed:', err);
        }
    };

    // 2. 対戦相手の取得
    const fetchOpponents = async (bypassCache = false) => {
        if (!bypassCache && localOpponentsCache.length > 0) {
            setOpponents(localOpponentsCache);
            setInitialFetchDone(true);
            syncStats(); // バックグラウンドでCP同期
            return;
        }

        setLoading(true);
        setErrorMsg(null);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/opponents', {
                method: 'GET',
                headers: { ...authHeaders }
            });

            if (res.ok) {
                const data = await res.json();
                setOpponents(data.opponents || []);
                localOpponentsCache = data.opponents || [];
                setChallengerScore(data.challenger_score || 0);
                setChallengerRank(data.challenger_rank || 'C');
                setArenaRate(data.challenger_rating || 1000);
                setHasDefenseParty(!!data.has_defense_party);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || '対戦相手の取得に失敗しました。');
            }
        } catch (err) {
            console.error('[PvP Opponents] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoading(false);
            setInitialFetchDone(true);
        }
    };

    // 3. ランキングの取得
    const fetchRanking = async (type: 'season' | 'daily') => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/pvp/ranking?type=${type}`, {
                method: 'GET',
                headers: { ...authHeaders }
            });
            if (res.ok) {
                const data = await res.json();
                setRankingList(data.ranking || []);
                setMyRankingStatus(data.myStatus || null);
                if (data.updated_at) {
                    const date = new Date(data.updated_at);
                    setRankingLastUpdated(date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
                }
            } else {
                const data = await res.json();
                setErrorMsg(data.error || 'ランキングの取得に失敗しました。');
            }
        } catch (err) {
            console.error('[PvP Ranking] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    // 4. バトルログの取得
    const fetchBattleLogs = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/battle-logs', {
                method: 'GET',
                headers: { ...authHeaders }
            });
            if (res.ok) {
                const data = await res.json();
                setBattleLogs(data.logs || []);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || '対戦ログの取得に失敗しました。');
            }
        } catch (err) {
            console.error('[PvP Logs] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    // 5. 特定対戦相手の装備・スキル詳細を遅延ロード (Lazy Load)
    const loadOpponentDetail = async (oppId: string, opponentObj: any) => {
        setErrorMsg(null);
        setSelectedOpponent(opponentObj);
        setSelectedOpponentDetail(null);

        // ゴースト（NPC）の場合はAPIコールの必要がなく、一覧に含まれているプリセット詳細データをそのままマージする
        if (oppId.startsWith('ghost_')) {
            setSelectedOpponentDetail(opponentObj);
            return;
        }

        setLoadingDetail(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/pvp/opponent-detail?user_id=${oppId}`, {
                method: 'GET',
                headers: { ...authHeaders }
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedOpponentDetail(data.party);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || '詳細の取得に失敗しました。');
            }
        } catch (err) {
            console.error('[PvP Detail] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoadingDetail(false);
        }
    };

    // 6. ゴールドを消費したCPの回復
    const handleRecoverCP = async () => {
        if (gold < 5000) {
            setErrorMsg('ゴールドが不足しています。(5,000 G必要)');
            return;
        }
        if (cp >= 6) {
            setErrorMsg('コロシアムポイント(CP)が6以上の場合は回復できません。');
            return;
        }

        setLoading(true); // 連打禁止のためローディング化
        setErrorMsg(null);
        soundManager?.playSE('se_item_get');

        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/recover-cp', {
                method: 'POST',
                headers: { ...authHeaders }
            });
            if (res.ok) {
                const data = await res.json();
                setCP(data.new_cp);
                setSuccessMsg('コロシアムポイントを10回復しました！');
                fetchUserProfile(); // ゴールド等同期
                setTimeout(() => setSuccessMsg(null), 3000);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || 'CP回復の適用に失敗しました。');
            }
        } catch (err) {
            console.error('[PvP CP Recover] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    // 7. 防衛パーティの更新 (差分更新検知対応)
    const handleUpdateDefense = async () => {
        setUpdatingDefense(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        soundManager?.playSE('se_item_get');

        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/defense', {
                method: 'POST',
                headers: { ...authHeaders }
            });

            if (res.ok) {
                const data = await res.json();
                setSuccessMsg(data.message || '現在のパーティ状況で防衛登録を更新しました！');
                setChallengerScore(data.score || challengerScore);
                setChallengerRank(data.rank || challengerRank);
                setHasDefenseParty(true);
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

    // 8. 自分の防衛パーティ確認
    const handleViewMyDefense = async () => {
        if (userProfile) {
            loadOpponentDetail(userProfile.id, {
                user_id: userProfile.id,
                user_name: userProfile.name || 'あなた',
                avatar_url: userProfile.avatar_url,
                is_my_defense: true,
                defense_rank: challengerRank
            });
        }
    };

    // 9. バトル詳細ログの遅延ロード
    const handleViewBattleLogText = async (logId: number) => {
        setLoadingLogText(true);
        setSelectedLogText(null);
        soundManager?.playSE('se_item_get');
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/pvp/battle-log-detail?id=${logId}`, {
                method: 'GET',
                headers: { ...authHeaders }
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedLogText(data.text_log || 'アクション履歴はありません。');
            } else {
                const data = await res.json();
                setErrorMsg(data.error || 'ログテキストの取得に失敗しました。');
            }
        } catch (err) {
            console.error('[PvP Log text] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoadingLogText(false);
        }
    };

    // 10. 未受け取り報酬のチェック (モーダル表示)
    const checkClaimableRewards = async () => {
        setErrorMsg(null);
        setLoading(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/claim-rewards', {
                method: 'GET',
                headers: { ...authHeaders }
            });
            if (res.ok) {
                const data = await res.json();
                setClaimableRewards(data.rewards || []);
                setShowRewardModal(true);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || '報酬データの取得に失敗しました。');
            }
        } catch (err) {
            console.error('[PvP Check Reward] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    // 11. 報酬の受け取り実行
    const handleClaimRewards = async () => {
        setLoading(true);
        setErrorMsg(null);
        soundManager?.playSE('se_item_get');
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/claim-rewards', {
                method: 'POST',
                headers: { ...authHeaders }
            });
            if (res.ok) {
                const data = await res.json();
                setSuccessMsg(data.message || '報酬を受け取りました！');
                setShowRewardModal(false);
                setClaimableRewards([]);
                fetchUserProfile(); // ゴールド等同期
                setTimeout(() => setSuccessMsg(null), 4000);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || '報酬の受け取りに失敗しました。');
            }
        } catch (err) {
            console.error('[PvP Claim] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoading(false);
        }
    };

    // 12. 対戦開始処理
    const handleChallenge = async (opponent: any) => {
        if (cp < 1) {
            setErrorMsg('コロシアムポイント(CP)が不足しています。');
            return;
        }
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
                // 対戦相手のスナップショットデータを Zustand に格納
                useGameStore.setState({ pvpOpponent: selectedOpponentDetail || opponent } as any);
                setSelectedOpponent(null);
                setSelectedOpponentDetail(null);
                
                // PvPクエストへ遷移
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

    // 初期マウント時の対戦相手フェッチ
    useEffect(() => {
        fetchOpponents();
    }, []);

    // タブ切り替え時のデータフェッチ
    useEffect(() => {
        if (tab === 'ranking') {
            fetchRanking(rankingType);
        } else if (tab === 'logs') {
            fetchBattleLogs();
        }
    }, [tab, rankingType]);

    // CP回復タイマーの進行
    useEffect(() => {
        if (nextCPTimeMs === null) return;
        const timer = setInterval(() => {
            setNextCPTimeMs(prev => {
                if (prev === null || prev <= 1000) {
                    syncStats(); // 0になったら再取得
                    return null;
                }
                return prev - 1000;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [nextCPTimeMs]);

    const formatCPTime = (ms: number | null) => {
        if (ms === null || ms <= 0) return '';
        const totalSecs = Math.floor(ms / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `(回復まで ${mins}:${secs < 10 ? '0' : ''}${secs})`;
    };

    if (!mounted || !portalTarget) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050b14]/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-[#0c1628]/95 border border-[#1e345b] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(30,52,91,0.5)] flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#11203b]/80 border-b border-[#1e345b]">
                    <div className="flex items-center gap-2 text-amber-400">
                        <Swords size={20} className="animate-pulse" />
                        <h2 className="font-black tracking-widest text-base text-slate-100">アリーナ (対人戦)</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Top Profile Info & Season & CP & Defense Deck (Always Visible) */}
                <div className="px-6 py-4 bg-[#0e192c] border-b border-[#1e345b]/60 flex flex-col gap-3">
                    
                    {/* Season Info */}
                    <div className="text-left">
                        <span className="text-[9px] text-[#5586d5] uppercase font-bold tracking-wider block">CURRENT SEASON</span>
                        <span className="text-xs text-slate-300 font-mono font-medium block">
                            {getCurrentSeasonPeriod()}
                        </span>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-black">
                                {challengerRank} RANK
                            </span>
                            <span className="text-xs font-bold text-slate-200">{userProfile?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                            <span className="text-xs text-slate-400">アリーナレート:</span>
                            <span className="text-sm font-black text-amber-400">{arenaRate} pts</span>
                        </div>
                    </div>

                    {/* CP Bar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-[#12223f]/50 border border-[#213a65]/50 rounded-xl">
                        <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-blue-300" />
                            <span className="text-[11px] text-blue-200 font-bold">CP:</span>
                            <span className={`text-sm font-black font-mono ${cp >= 6 ? 'text-rose-500 animate-pulse' : 'text-slate-100'}`}>
                                {cp}/5
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                                {formatCPTime(nextCPTimeMs)}
                            </span>
                        </div>
                        <button
                            disabled={loading || cp >= 6 || gold < 5000}
                            onClick={handleRecoverCP}
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-30 disabled:pointer-events-none border border-amber-500/30 hover:border-amber-500/50 rounded-lg text-[10px] font-black text-amber-400 transition-all active:scale-95 shrink-0 cursor-pointer"
                            title="ゴールド5,000Gを消費してCPを10回復します"
                        >
                            +10 CP (5,000G)
                        </button>
                    </div>

                    {/* Defense Deck Operations (Always Visible) */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                            disabled={updatingDefense || loading}
                            onClick={handleUpdateDefense}
                            className="flex items-center justify-center gap-1.5 py-2 bg-[#15243d] hover:bg-[#1f3559] border border-[#264573] rounded-xl text-[11px] font-bold text-slate-200 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                        >
                            <RefreshCw size={11} className={updatingDefense ? 'animate-spin' : ''} />
                            防衛登録を更新
                        </button>
                        <button
                            disabled={!hasDefenseParty || loading}
                            onClick={handleViewMyDefense}
                            className="flex items-center justify-center gap-1.5 py-2 bg-[#15243d] hover:bg-[#1f3559] border border-[#264573] rounded-xl text-[11px] font-bold text-slate-200 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                        >
                            <Shield size={11} />
                            防衛構成を確認
                        </button>
                    </div>
                </div>

                {/* Tab buttons */}
                <div className="grid grid-cols-4 bg-[#0a1120] border-b border-[#1e345b] text-center text-xs">
                    <button
                        onClick={() => { soundManager?.playSE('se_item_get'); setTab('opponents'); }}
                        className={`py-3 font-bold border-b-2 transition-all ${tab === 'opponents' ? 'text-amber-400 border-amber-500 bg-[#11203b]/30' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                    >
                        対戦相手
                    </button>
                    <button
                        onClick={() => { soundManager?.playSE('se_item_get'); setTab('ranking'); }}
                        className={`py-3 font-bold border-b-2 transition-all ${tab === 'ranking' ? 'text-amber-400 border-amber-500 bg-[#11203b]/30' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                    >
                        ランキング
                    </button>
                    <button
                        onClick={() => { soundManager?.playSE('se_item_get'); setTab('logs'); }}
                        className={`py-3 font-bold border-b-2 transition-all ${tab === 'logs' ? 'text-amber-400 border-amber-500 bg-[#11203b]/30' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                    >
                        バトルログ
                    </button>
                    <button
                        onClick={() => { soundManager?.playSE('se_item_get'); setTab('rules'); }}
                        className={`py-3 font-bold border-b-2 transition-all ${tab === 'rules' ? 'text-amber-400 border-amber-500 bg-[#11203b]/30' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                    >
                        ルール
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar min-h-[300px]">
                    
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

                    {/* ──── TAB: OPPONENTS ──── */}
                    {tab === 'opponents' && (
                        <div className="space-y-4 text-left">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">対戦相手マッチング</span>
                                <button
                                    disabled={loading}
                                    onClick={() => fetchOpponents(true)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                                    相手を更新
                                </button>
                            </div>

                            <div className="space-y-2.5">
                                {opponents.map((opponent, idx) => (
                                    <div
                                        key={(opponent.user_id || 'opt') + '_' + idx}
                                        className="bg-[#0f1d35]/70 border border-[#20365b] rounded-xl p-3 flex items-center justify-between transition-all animate-in fade-in duration-200"
                                    >
                                        <div className="space-y-1.5 min-w-0 pr-4">
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    onClick={() => !opponent.is_ghost && setViewingProfileUserId(opponent.user_id)}
                                                    className={`w-8 h-8 rounded-full border border-slate-700 bg-[#070e1e] flex items-center justify-center overflow-hidden shrink-0 ${!opponent.is_ghost ? 'cursor-pointer hover:border-amber-400' : ''}`}
                                                >
                                                    {opponent.avatar_url ? (
                                                        <img src={opponent.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={14} className="text-slate-500" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 text-left">
                                                    <h4 className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
                                                        <span 
                                                            onClick={() => !opponent.is_ghost && setViewingProfileUserId(opponent.user_id)}
                                                            className={!opponent.is_ghost ? 'cursor-pointer hover:text-amber-400 hover:underline' : ''}
                                                        >
                                                            {opponent.user_name}
                                                        </span>
                                                        <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 py-0.2 rounded font-black border border-amber-500/20">
                                                            {opponent.defense_rank}
                                                        </span>
                                                        {opponent.is_ghost && (
                                                            <span className="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono">GHOST</span>
                                                        )}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 font-mono">
                                                        レート: {opponent.arena_rate ?? 1000} pts
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Party Members Mini Preview */}
                                            <div className="flex gap-1.5 items-center pl-10 overflow-x-auto no-scrollbar">
                                                {opponent.party_members_snapshot?.map((m: any, mi: number) => (
                                                    <span key={mi} className="text-[8px] bg-[#1a2d4c] text-slate-300 border border-[#2c4772]/60 px-1.5 py-0.2 rounded whitespace-nowrap">
                                                        {m.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            disabled={loading}
                                            onClick={() => loadOpponentDetail(opponent.user_id, opponent)}
                                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition-all shadow-md shadow-amber-500/10 shrink-0 cursor-pointer"
                                        >
                                            挑戦する
                                        </button>
                                    </div>
                                ))}

                                {opponents.length === 0 && !loading && (
                                    <div className="text-center py-10 text-xs text-slate-500 italic">
                                        対戦相手が見つかりませんでした。
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ──── TAB: RANKING ──── */}
                    {tab === 'ranking' && (
                        <div className="space-y-4 text-left">
                            <div className="flex items-center justify-between">
                                <div className="flex bg-[#0b1220] border border-[#1e345b] rounded-lg p-0.5">
                                    <button
                                        onClick={() => setRankingType('season')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${rankingType === 'season' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                                    >
                                        シーズン
                                    </button>
                                    <button
                                        onClick={() => setRankingType('daily')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${rankingType === 'daily' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                                    >
                                        デイリー
                                    </button>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] text-slate-400 block font-mono">
                                        最終同期: {rankingLastUpdated || '未取得'}
                                    </span>
                                </div>
                            </div>

                            {/* 大きく押しやすい報酬確認/受け取りボタン */}
                            <button
                                onClick={checkClaimableRewards}
                                disabled={loading}
                                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition-all shadow-md shadow-amber-500/15 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Award size={14} />
                                アリーナ報酬の確認・受け取り
                            </button>

                            {/* My Ranking Status (上部固定) */}
                            {myRankingStatus && (
                                <div className="bg-gradient-to-r from-[#1b3152]/70 to-[#0e1c33]/70 border-2 border-amber-500/40 rounded-xl p-3 flex items-center justify-between shadow-md">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-amber-400 font-mono w-10 text-center shrink-0">
                                            {myRankingStatus.rank}位
                                        </span>
                                        <div className="w-8 h-8 rounded-full border border-amber-500/30 bg-[#070e1e] flex items-center justify-center overflow-hidden shrink-0">
                                            {myRankingStatus.avatar_url ? (
                                                <img src={myRankingStatus.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={14} className="text-slate-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                                                {myRankingStatus.user_name}
                                                <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-black">
                                                    {myRankingStatus.job_class?.slice(0, 4)}
                                                </span>
                                            </h4>
                                            <span className="text-[9px] text-slate-400 block">あなた</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-amber-400 font-mono shrink-0">
                                        {myRankingStatus.arena_rate} pts
                                    </span>
                                </div>
                            )}

                            {/* 可読性のための明確な区切り線 */}
                            <div className="relative flex py-1 items-center">
                                <div className="flex-grow border-t border-[#1e345b]/60"></div>
                                <span className="flex-shrink mx-4 text-[9px] text-[#5586d5] uppercase font-black tracking-wider">RANKINGS</span>
                                <div className="flex-grow border-t border-[#1e345b]/60"></div>
                            </div>

                            {/* Top 50 List */}
                            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                                {rankingList.map((player) => (
                                    <div
                                        key={player.user_id}
                                        className={`p-2.5 border rounded-lg flex items-center justify-between transition-all ${player.user_id === userProfile?.id ? 'bg-[#1b3152]/40 border-amber-500/30' : 'bg-[#0f1d35]/40 border-[#1e345b]/50'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-400 font-mono w-9 text-center">
                                                {player.rank}位
                                            </span>
                                            <div 
                                                onClick={() => setViewingProfileUserId(player.user_id)}
                                                className="w-7 h-7 rounded-full border border-slate-700 bg-black/40 flex items-center justify-center overflow-hidden cursor-pointer hover:border-amber-400 shrink-0"
                                            >
                                                {player.avatar_url ? (
                                                    <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={12} className="text-slate-600" />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <h5 
                                                    onClick={() => setViewingProfileUserId(player.user_id)}
                                                    className="text-xs font-bold text-slate-200 truncate cursor-pointer hover:text-amber-400 hover:underline"
                                                >
                                                    {player.user_name}
                                                </h5>
                                                <span className="text-[9px] text-slate-400 block font-mono">
                                                    Lv.{player.level} | {player.job_class}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-300 font-mono shrink-0">
                                            {player.arena_rate} pts
                                        </span>
                                    </div>
                                ))}

                                {rankingList.length === 0 && !loading && (
                                    <div className="text-center py-10 text-xs text-slate-500">
                                        ランキングデータはありません。
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ──── TAB: BATTLE LOGS ──── */}
                    {tab === 'logs' && (
                        <div className="space-y-3 text-left">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">バトル履歴 (過去20戦)</span>
                            
                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                                {battleLogs.map((log, idx) => {
                                    const dateStr = new Date(log.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                    const isWin = log.is_victory;
                                    const isChallenge = log.battle_type === 'challenge';
                                    
                                    return (
                                        <div
                                            key={log.id || idx}
                                            className="bg-[#0f1d35]/60 border border-[#20365b] rounded-xl p-3 flex items-center justify-between"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${isChallenge ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                                                        {isChallenge ? '挑戦' : '防衛'}
                                                    </span>
                                                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${isWin ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                                        {isWin ? '勝利' : '敗北'}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-200">{log.opponent_name}</span>
                                                </div>
                                                <p className="text-[9px] text-slate-400 font-mono">
                                                    {dateStr} | レート変動: <span className={log.rate_change >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{log.rate_change >= 0 ? `+${log.rate_change}` : log.rate_change} pts</span>
                                                </p>
                                            </div>

                                            <button
                                                disabled={loadingLogText}
                                                onClick={() => handleViewBattleLogText(log.id)}
                                                className="px-3 py-1.5 bg-[#15243d] hover:bg-[#1f3559] border border-[#264573] rounded-lg text-[10px] font-bold text-slate-200 active:scale-95 transition-all cursor-pointer"
                                            >
                                                ログ表示
                                            </button>
                                        </div>
                                    );
                                })}

                                {battleLogs.length === 0 && !loading && (
                                    <div className="text-center py-10 text-xs text-slate-500 italic">
                                        バトル履歴はありません。
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ──── TAB: RULES ──── */}
                    {tab === 'rules' && (
                        <div className="space-y-4 text-xs text-slate-300 leading-relaxed text-left max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                            
                            {/* CPルール */}
                            <section className="space-y-1.5">
                                <h4 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ コロシアムポイント（CP）</h4>
                                <p className="text-slate-400">
                                    アリーナに挑戦するには 1 挑戦につき <span className="text-amber-400 font-bold">1CP（コロシアムポイント）</span> を消費します（防衛戦での消費はゼロ）。
                                </p>
                                <p className="text-slate-400">
                                    CPは <span className="text-amber-400 font-bold">1</span> 時間ごとに <span className="text-amber-400 font-bold">1</span> 自然回復し、最大 <span className="text-amber-400 font-bold">5</span> まで蓄積されます。また、ゴールドを <span className="text-amber-400 font-bold">5,000G</span> 消費して一気に <span className="text-amber-400 font-bold">10CP</span> 回復させることも可能です。超過回復は最大 <span className="text-amber-400 font-bold">15</span> まで可能ですが、<span className="text-amber-400 font-bold">16</span> 以上になる回復操作は実行できません。
                                </p>
                            </section>

                            {/* シーズン＆ランキング */}
                            <section className="space-y-1.5">
                                <h4 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ シーズン＆ランキング</h4>
                                <p className="text-slate-400">
                                    アリーナは 1 週間ごとのシーズン制を採用しており、毎週水曜日 18:00 (JST) に新シーズンが始まりアリーナレートは全員一律で <span className="text-amber-400 font-bold">1,000</span> にリセットされます。
                                </p>
                                <p className="text-slate-400">
                                    デイリーランキングは毎日 18:00 (JST) に切り替わります。それぞれ上位 <span className="text-amber-400 font-bold">10</span> 名に特別なゴールドやUR未鑑定品、魔術学院パック開封用の鍵が贈られます。報酬の確認や受取はランキングタブ右上の「報酬確認」から手動で行ってください。
                                </p>
                            </section>

                            {/* ユーザーランク */}
                            <section className="space-y-1.5">
                                <h4 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ ユーザーランク</h4>
                                <p className="text-slate-400">
                                    プレイヤーおよび同行メンバーの戦闘力評価合計（合計パーティCS評価）に基づき、アリーナでのマッチングランクがリアルタイムで決定されます。
                                </p>
                                <ul className="list-disc pl-4 text-slate-400 space-y-0.5">
                                    <li><span className="text-amber-400 font-bold">S ランク</span>: 合計戦闘スコア <span className="text-amber-400 font-bold">5,500 CS</span> 以上</li>
                                    <li><span className="text-amber-400 font-bold">A ランク</span>: 合計戦闘スコア <span className="text-amber-400 font-bold">3,000 CS</span> 以上</li>
                                    <li><span className="text-amber-400 font-bold">B ランク</span>: 合計戦闘スコア <span className="text-amber-400 font-bold">1,500 CS</span> 以上</li>
                                    <li><span className="text-amber-400 font-bold">C ランク</span>: 合計戦闘スコア <span className="text-amber-400 font-bold">1,500 CS</span> 未満</li>
                                </ul>
                            </section>

                            {/* 防衛デッキと非同期戦 */}
                            <section className="space-y-1.5">
                                <h4 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ 防衛デッキと非同期戦</h4>
                                <p className="text-slate-400">
                                    他のプレイヤーは、あなたが「防衛登録」した際のご自身のその時のパーティ状況（HP、ATK、DEF、装備、スキル）を基にした防衛パーティと戦います。
                                </p>
                                <p className="text-slate-400">
                                    非同期防衛バトルの際、防衛側にはステータス補正（HP増加など）が自動的に適用されます。
                                </p>
                            </section>

                            {/* アリーナレート増減テーブル */}
                            <section className="space-y-1.5">
                                <h4 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ アリーナレート増減テーブル</h4>
                                <p className="text-slate-400">バトルでの勝敗および対戦相手とのランク（S〜C）の相性によって変動値がランダムに決まります。</p>
                                <table className="w-full border-collapse border border-[#1e345b] bg-[#11203b]/20 text-[10px] my-2">
                                    <thead>
                                        <tr className="bg-[#11203b]/60 border-b border-[#1e345b] text-blue-200">
                                            <th className="p-2 border-r border-[#1e345b]">相手のランク</th>
                                            <th className="p-2 border-r border-[#1e345b]">勝利時レート</th>
                                            <th className="p-2">敗北時レート</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-[#1e345b]">
                                            <td className="p-2 border-r border-[#1e345b] text-emerald-400 font-bold">格上 (相手が上)</td>
                                            <td className="p-2 border-r border-[#1e345b] text-emerald-400">+30 〜 +50</td>
                                            <td className="p-2 text-rose-400">-1 〜 -10</td>
                                        </tr>
                                        <tr className="border-b border-[#1e345b]">
                                            <td className="p-2 border-r border-[#1e345b] text-slate-300 font-bold">同格 (同じランク)</td>
                                            <td className="p-2 border-r border-[#1e345b] text-emerald-400">+10 〜 +25</td>
                                            <td className="p-2 text-rose-400">-10 〜 -25</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border-r border-[#1e345b] text-rose-400 font-bold">格下 (相手が下)</td>
                                            <td className="p-2 border-r border-[#1e345b] text-emerald-400">+1 〜 +10</td>
                                            <td className="p-2 text-rose-400">-30 〜 -50</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#0b1220] border-t border-[#1e345b] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-[#11203b] border border-[#233f6d] rounded-xl hover:bg-[#1a2e52] hover:text-amber-400 transition-all text-xs font-bold text-slate-300 active:scale-95 cursor-pointer"
                    >
                        閉じる
                    </button>
                </div>
            </div>

            {/* ──── OPPONENT DETAIL PREVIEW MODAL (Lazy Load) ──── */}
            {selectedOpponent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
                    <div className="relative w-full max-w-md bg-[#0e1628]/95 border-2 border-amber-500/30 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.25)] flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950/40 to-slate-900 border-b border-amber-500/20">
                            <h3 className="font-black text-amber-400 tracking-wider flex items-center gap-2 text-xs">
                                <Shield size={16} />
                                防衛構成プレビュー
                            </h3>
                            <button
                                onClick={() => setSelectedOpponent(null)}
                                className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-left text-xs">
                            {loadingDetail && (
                                <div className="flex flex-col items-center justify-center py-20 space-y-2">
                                    <RefreshCw className="animate-spin text-amber-500" size={24} />
                                    <span className="text-slate-400">防衛データを同期中...</span>
                                </div>
                            )}

                            {selectedOpponentDetail && (
                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                    
                                    {/* Leader info */}
                                    <div className="bg-[#12223f]/50 border border-[#213a65]/50 rounded-xl p-3 space-y-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-10 h-10 rounded-full border border-slate-700 bg-black/40 flex items-center justify-center overflow-hidden shrink-0">
                                                {selectedOpponent.avatar_url ? (
                                                    <img src={selectedOpponent.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={14} className="text-slate-500" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-100 flex items-center gap-1.5">
                                                    {selectedOpponent.user_name}
                                                    <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 py-0.2 rounded font-black">
                                                        Lv.{selectedOpponentDetail.player_snapshot?.level || 1}
                                                    </span>
                                                </h4>
                                                <span className="text-[10px] text-slate-400 block font-mono">
                                                    評価: {selectedOpponentDetail.battle_score} CS | ランク: {selectedOpponent.defense_rank}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Leader Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2 text-center py-1.5 bg-[#0a1120] rounded-lg border border-[#1e345b]/50 font-mono">
                                            <div>
                                                <span className="text-[9px] text-slate-400 block font-bold">HP</span>
                                                <span className="font-bold text-emerald-400">{selectedOpponentDetail.player_snapshot?.hp || 100}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-slate-400 block font-bold">ATK</span>
                                                <span className="font-bold text-rose-400">{selectedOpponentDetail.player_snapshot?.atk || 10}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-slate-400 block font-bold">DEF</span>
                                                <span className="font-bold text-sky-400">{selectedOpponentDetail.player_snapshot?.def || 10}</span>
                                            </div>
                                        </div>

                                        {/* Leader Gears */}
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-amber-500 font-bold block">🛡️ 装備武具:</span>
                                            {selectedOpponentDetail.equipped_items_snapshot && selectedOpponentDetail.equipped_items_snapshot.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedOpponentDetail.equipped_items_snapshot.map((g: any, gi: number) => (
                                                        <span key={gi} className="text-[9px] bg-[#1a2d4c] text-slate-300 border border-[#2c4772]/60 px-1.5 py-0.2 rounded">
                                                            {g.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-500 italic block">装備なし</span>
                                            )}
                                        </div>

                                        {/* Leader Skills */}
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-amber-500 font-bold block">🔮 スキルデッキ:</span>
                                            {selectedOpponentDetail.skill_deck_snapshot && selectedOpponentDetail.skill_deck_snapshot.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedOpponentDetail.skill_deck_snapshot.map((s: any, si: number) => (
                                                        <span key={si} className="text-[9px] bg-[#1d1f35] text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-500 italic block">初期デッキ</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Members info */}
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">同行メンバー</span>
                                        {selectedOpponentDetail.party_members_snapshot && selectedOpponentDetail.party_members_snapshot.length > 0 ? (
                                            <div className="space-y-1.5">
                                                {selectedOpponentDetail.party_members_snapshot.map((m: any, mi: number) => (
                                                    <div key={mi} className="p-2.5 bg-[#0f1d35]/50 border border-[#20365b] rounded-xl flex items-center justify-between font-mono">
                                                        <div className="text-left">
                                                            <h5 className="text-xs font-bold text-slate-200">{m.name}</h5>
                                                            <span className="text-[9px] text-slate-400 block">Lv.{m.level} | {m.job_class}</span>
                                                        </div>
                                                        <div className="flex gap-2.5 text-right text-[10px]">
                                                            <div>
                                                                <span className="text-[8px] text-slate-500 block">HP</span>
                                                                <span className="font-bold text-emerald-400">{m.hp}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[8px] text-slate-500 block">ATK</span>
                                                                <span className="font-bold text-rose-400">{m.atk}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[8px] text-slate-500 block">DEF</span>
                                                                <span className="font-bold text-sky-400">{m.def}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-500 italic block text-center py-2">同行メンバーなし (ソロ)</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-[#0a0d14] border-t border-slate-800 flex justify-end gap-2">
                            <button
                                onClick={() => setSelectedOpponent(null)}
                                className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] border border-slate-700 text-slate-300 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                            >
                                戻る
                            </button>
                            {!selectedOpponent.is_my_defense && (
                                <button
                                    disabled={loading || cp < 1}
                                    onClick={() => handleChallenge(selectedOpponent)}
                                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <Swords size={12} />
                                    対戦を開始 (1 CP)
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ──── BATTLE LOG DETAIL MODAL (Lazy Load) ──── */}
            {selectedLogText && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
                    <div className="relative w-full max-w-md bg-[#0e1628]/95 border border-[#1e345b] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[75vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-[#11203b]/80 border-b border-[#1e345b]">
                            <h3 className="font-black text-amber-400 tracking-wider flex items-center gap-2 text-xs">
                                <BookOpen size={16} />
                                アクション詳細ログ
                            </h3>
                            <button
                                onClick={() => setSelectedLogText(null)}
                                className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        {/* Log Text */}
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#070e1e]/60">
                            <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap text-left leading-relaxed">
                                {selectedLogText}
                            </pre>
                        </div>
                        {/* Footer */}
                        <div className="px-6 py-4 bg-[#0a0d14] border-t border-slate-800 flex justify-end">
                            <button
                                onClick={() => setSelectedLogText(null)}
                                className="px-4 py-2 bg-[#1f2937] border border-slate-700 text-slate-300 font-bold text-xs rounded-xl hover:text-white transition-all cursor-pointer"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ──── REWARD CLAIM MODAL ──── */}
            {showRewardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
                    <div className="relative w-full max-w-sm bg-[#0e1628]/95 border-2 border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950/40 to-slate-900 border-b border-[#1e345b]">
                            <h3 className="font-black text-amber-400 tracking-wider flex items-center gap-1.5 text-xs">
                                <Award size={16} />
                                獲得アリーナ報酬
                            </h3>
                            <button
                                onClick={() => setShowRewardModal(false)}
                                className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-5 text-left space-y-4">
                            {claimableRewards.length === 0 ? (
                                <div className="text-center py-6 text-xs text-slate-500 italic">
                                    現在、受け取り可能なアリーナ報酬はありません。
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                        シーズン/デイリーで上位入賞した報酬が届いています！以下の報酬を一括でインベントリへ付与できます。
                                    </p>
                                    <div className="space-y-1.5 bg-[#070e1e]/60 border border-[#1e345b]/50 rounded-xl p-3.5 max-h-[180px] overflow-y-auto custom-scrollbar font-mono text-xs">
                                        {claimableRewards.map((reward, ri) => (
                                            <div key={ri} className="flex justify-between items-start border-b border-slate-800/80 py-1.5 last:border-b-0">
                                                <div>
                                                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded font-black mr-1.5">
                                                        {reward.reward_type === 'season' ? 'シーズン' : 'デイリー'}
                                                    </span>
                                                    <span className="text-slate-300 font-bold">順位: {reward.rank}位</span>
                                                </div>
                                                <div className="text-right text-amber-400 font-bold space-y-0.5">
                                                    {reward.gold_reward > 0 && <div>+{reward.gold_reward.toLocaleString()} G</div>}
                                                    {reward.items_reward?.length > 0 && <div className="text-[10px] text-slate-400 font-sans">未鑑定品UR x{reward.items_reward.length}</div>}
                                                    {reward.keys_reward && typeof reward.keys_reward === 'object' && Object.values(reward.keys_reward).some(v => Number(v) > 0) && (
                                                        <div className="text-[10px] text-slate-400 font-sans">学院の鍵 x{Object.values(reward.keys_reward).reduce((a, b) => Number(a) + Number(b), 0)}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-[#0a0d14] border-t border-slate-800 flex justify-end gap-2">
                            <button
                                onClick={() => setShowRewardModal(false)}
                                className="px-4 py-2 bg-[#1f2937] border border-slate-700 text-slate-300 font-bold text-xs rounded-xl hover:text-white transition-all cursor-pointer"
                            >
                                戻る
                            </button>
                            {claimableRewards.length > 0 && (
                                <button
                                    disabled={loading}
                                    onClick={handleClaimRewards}
                                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center cursor-pointer"
                                >
                                    {loading ? <RefreshCw className="animate-spin" size={12} /> : '一括で受け取る'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ──── 外部コンポーネント: 他プレイヤーの自己紹介ポップアップ ──── */}
            {viewingProfileUserId && (
                <SimpleUserProfilePopup
                    userId={viewingProfileUserId}
                    onClose={() => setViewingProfileUserId(null)}
                    callerUserId={userProfile?.id}
                />
            )}
        </div>,
        portalTarget
    );
}
