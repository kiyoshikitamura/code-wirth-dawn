import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { getAuthHeaders } from '@/lib/authToken';
import { soundManager } from '@/lib/soundManager';
import { Swords, Trophy, X, RefreshCw, Shield, User, Zap, BookOpen, Clock, Award, History, AlertCircle } from 'lucide-react';
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
    const [detailErrorMsg, setDetailErrorMsg] = useState<string | null>(null);
    const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
    const [selectedLogText, setSelectedLogText] = useState<string | null>(null);
    const [loadingLogText, setLoadingLogText] = useState<boolean>(false);
    
    // Reward Popup (Rankings Reward Table & Claim)
    const [claimableRewards, setClaimableRewards] = useState<any[]>([]);
    const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
    const [loadingRewards, setLoadingRewards] = useState<boolean>(false);

    // User Profile Popup
    const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null);

    // UI States
    const [loading, setLoading] = useState(false);
    const [updatingDefense, setUpdatingDefense] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [initialFetchDone, setInitialFetchDone] = useState(false);
    const [rankingLastUpdated, setRankingLastUpdated] = useState<string>('');
    const [syncing, setSyncing] = useState(false);

    // 防衛パーティ確認モーダル用ステート
    const [showDefenseModal, setShowDefenseModal] = useState(false);
    const [defensePartyData, setDefensePartyData] = useState<any>(null);
    const [loadingDefenseData, setLoadingDefenseData] = useState(false);
    const [defenseExpandedMembers, setDefenseExpandedMembers] = useState<Record<string, boolean>>({});

    // 過去成績履歴モーダル用ステート
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyData, setHistoryData] = useState<{ seasons: any[], dailies: any[] }>({ seasons: [], dailies: [] });
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyTab, setHistoryTab] = useState<'season' | 'daily'>('season');

    // 自動防衛登録アラート用ステート
    const [showAutoDefenseAlert, setShowAutoDefenseAlert] = useState(false);
    const [autoRegistering, setAutoRegistering] = useState(false);

    // CP不足警告アラート用ステート
    const [showCPErrorAlert, setShowCPErrorAlert] = useState(false);

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

        const prevWed = new Date(jstNow);
        const currentDay = jstNow.getUTCDay();
        let daysToSubtract = currentDay - 3;
        if (daysToSubtract < 0) daysToSubtract += 7;
        
        prevWed.setUTCDate(jstNow.getUTCDate() - daysToSubtract);
        prevWed.setUTCHours(9, 0, 0, 0); // JST 18:00

        if (prevWed.getTime() > jstNow.getTime()) {
            prevWed.setUTCDate(prevWed.getUTCDate() - 7);
        }

        const nextWed = new Date(prevWed);
        nextWed.setUTCDate(prevWed.getUTCDate() + 7);

        const formatJST = (d: Date) => {
            const l = new Date(d.getTime() - jstOffset);
            return `${l.getFullYear()}/${(l.getMonth()+1).toString().padStart(2,'0')}/${l.getDate().toString().padStart(2,'0')} 18:00`;
        };

        return `${formatJST(prevWed)} 〜 ${formatJST(nextWed)}`;
    };

    // 現在のデイリーランキング期間算出 (毎日18:00切り替えの24時間)
    const getDailyPeriodStr = () => {
        const jstOffset = 9 * 60 * 60 * 1000;
        const now = new Date();
        const jstNow = new Date(now.getTime() + jstOffset);

        // jstNowのUTCHoursは既にJSTの時を指している (17:30 などの場合は 17)
        const hour = jstNow.getUTCHours();
        
        const start = new Date(jstNow);
        if (hour < 18) {
            // 18:00 未満の場合、サイクル開始は「前日の 18:00」
            start.setUTCDate(jstNow.getUTCDate() - 1);
        }
        start.setUTCHours(18, 0, 0, 0);

        const end = new Date(start);
        end.setUTCDate(start.getUTCDate() + 1);

        const format = (d: Date) => {
            const l = new Date(d.getTime() - jstOffset);
            return `${l.getFullYear()}/${(l.getMonth()+1).toString().padStart(2,'0')}/${l.getDate().toString().padStart(2,'0')} 18:00`;
        };

        return `${format(start)} 〜 ${format(end)}`;
    };

    // 成績履歴のフェッチ
    const fetchHistoryData = async () => {
        setLoadingHistory(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/history', {
                method: 'GET',
                headers: { ...authHeaders }
            });
            if (res.ok) {
                const data = await res.json();
                setHistoryData({
                    seasons: data.seasons || [],
                    dailies: data.dailies || []
                });
            }
        } catch (err) {
            console.error('[PvP History Fetch] Error:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // 1. CPとアリーナレートの超軽量同期 (sync-stats)
    const syncStats = async () => {
        setSyncing(true);
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
        } finally {
            setSyncing(false);
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
        setSyncing(true);
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
            setSyncing(false);
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
        setDetailErrorMsg(null);
        setExpandedMemberId(null);
        setSelectedOpponent(opponentObj);
        setSelectedOpponentDetail(null);

        // ゴースト（NPC）の場合はAPIコールの必要がなく、一覧に含まれているプリセット詳細データをそのままマージする
        if (opponentObj?.is_ghost) {
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
                setDetailErrorMsg(data.error || '詳細の取得に失敗しました。');
            }
        } catch (err) {
            console.error('[PvP Detail] Error:', err);
            setDetailErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoadingDetail(false);
        }
    };

    // 6. ゴールドを消費したCPの回復
    const handleRecoverCP = async () => {
        if (gold < 5000) {
            setErrorMsg('ゴールドが不足しています。(5,000G必要)');
            return;
        }
        if (cp >= 6) {
            setErrorMsg('コロシアムポイント(CP)が6以上の場合は回復できません。');
            return;
        }

        const confirmed = window.confirm("5,000 G を消費してコロシアムポイント(CP)を10回復しますか？");
        if (!confirmed) return;

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
                // サブモーダルを開いている場合は、最新のスナップショットに更新
                if (data.party) {
                    setDefensePartyData(data.party);
                } else {
                    const getRes = await fetch('/api/pvp/defense', {
                        method: 'GET',
                        headers: { ...authHeaders }
                    });
                    if (getRes.ok) {
                        const getData = await getRes.json();
                        setDefensePartyData(getData.party);
                    }
                }
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

    // 8. 自分の防衛パーティ確認モーダル起動
    const handleOpenDefenseModal = async () => {
        soundManager?.playSE('se_item_get');
        setShowDefenseModal(true);
        setLoadingDefenseData(true);
        setDefenseExpandedMembers({});
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/defense', {
                method: 'GET',
                headers: { ...authHeaders }
            });
            if (res.ok) {
                const data = await res.json();
                setDefensePartyData(data.party);
            } else {
                setDefensePartyData(null);
            }
        } catch (e) {
            console.error(e);
            setDefensePartyData(null);
        } finally {
            setLoadingDefenseData(false);
        }
    };

    const toggleDefenseMember = (memberId: string) => {
        soundManager?.playSE('se_item_get');
        setDefenseExpandedMembers(prev => ({
            ...prev,
            [memberId]: !prev[memberId]
        }));
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

    // 10. 報酬説明 & 受取状態の確認 (UX改善: タップした瞬間に0msでモーダルを起動！)
    const checkClaimableRewards = async () => {
        setErrorMsg(null);
        setShowRewardModal(true); // 即座にポップアップを起動！
        setLoadingRewards(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/claim-rewards', {
                method: 'GET',
                headers: { ...authHeaders }
            });
            if (res.ok) {
                const data = await res.json();
                setClaimableRewards(data.claimable || []);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || '報酬獲得資格のチェックに失敗しました。');
            }
        } catch (err) {
            console.error('[PvP Check Reward] Error:', err);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setLoadingRewards(false);
        }
    };

    // 11. 報酬の受け取り実行
    const handleClaimRewardItem = async (reward: any) => {
        setLoading(true);
        setErrorMsg(null);
        soundManager?.playSE('se_item_get');
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/pvp/claim-rewards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({
                    reward_type: reward.type,
                    season_id: reward.season_id,
                    rank: reward.rank
                })
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
            setShowCPErrorAlert(true);
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
                useGameStore.setState({ pvpOpponent: selectedOpponentDetail || opponent } as any);
                setSelectedOpponent(null);
                setSelectedOpponentDetail(null);
                
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

    // 初期マウント時の対戦相手フェッチ (バトル後の最新レート・CPを即時反映するため強制フェッチ)
    useEffect(() => {
        fetchOpponents(true);
        syncStats();
    }, []);

    // 防衛パーティ未登録時のアラート自動起動
    useEffect(() => {
        if (initialFetchDone && !hasDefenseParty) {
            setShowAutoDefenseAlert(true);
        }
    }, [initialFetchDone, hasDefenseParty]);

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

    // 防衛パーティ専用サブモーダル描画
    const renderDefenseModal = () => {
        if (!showDefenseModal) return null;

        return (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150" onClick={() => setShowDefenseModal(false)}>
                <div className="bg-[#0b1322] border border-[#2b4772] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#12223e] to-slate-900 px-6 py-4 flex items-center justify-between border-b border-[#213a65]/50">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-amber-400" />
                            <h3 className="text-sm font-black text-slate-100">防衛パーティ確認</h3>
                        </div>
                        <button
                            onClick={() => setShowDefenseModal(false)}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 max-h-[65vh] overflow-y-auto space-y-4 font-sans text-slate-300">
                        {loadingDefenseData ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                <RefreshCw className="animate-spin text-amber-500" size={24} />
                                <span className="text-[11px] text-slate-400">防衛データを取得中...</span>
                            </div>
                        ) : !defensePartyData ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-3">
                                <Shield className="w-12 h-12 text-slate-600 stroke-[1.5]" />
                                <span className="text-xs text-slate-400 font-bold">現在は防衛パーティが未登録です</span>
                                <p className="text-[10px] text-slate-500 text-center max-w-[280px]">
                                    防衛パーティが登録されていないと、他プレイヤーから攻撃された際にデフォルト構成で戦闘が発生します。下の「防衛パーティを更新」ボタンから登録してください。
                                </p>
                            </div>
                        ) : (() => {
                            const pSnap = defensePartyData.player_snapshot || {};
                            const mSnaps = defensePartyData.party_members_snapshot || [];

                            return (
                                <div className="space-y-4">
                                    {/* リーダー（プレイヤー） */}
                                    <div className="bg-[#12223f]/30 border border-[#213a65]/40 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                                {defensePartyData.avatar_url ? (
                                                    <img src={defensePartyData.avatar_url} alt={defensePartyData.user_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-6 h-6 text-slate-500" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-100">
                                                    {defensePartyData.user_name} <span className="text-[9px] text-slate-400 font-normal">（リーダー）</span>
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded border border-amber-700/40 text-amber-300 bg-amber-950/20">
                                                        Lv.{pSnap.level || 1} {pSnap.job_class || 'Adventurer'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ステータス */}
                                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-[#070e1c]/40 py-2 rounded-lg border border-[#1b2f51]/20">
                                            <div>
                                                <span className="text-[8px] text-slate-500 block">HP</span>
                                                <span className="font-bold text-emerald-400">{pSnap.hp || 100}</span>
                                            </div>
                                            <div>
                                                <span className="text-[8px] text-slate-500 block">ATK</span>
                                                <span className="font-bold text-rose-400">{pSnap.atk || 10}</span>
                                            </div>
                                            <div>
                                                <span className="text-[8px] text-slate-500 block">DEF</span>
                                                <span className="font-bold text-sky-400">{pSnap.def || 10}</span>
                                            </div>
                                        </div>

                                        {/* 装備 */}
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-amber-500 font-bold block">🛡️ 装備武具:</span>
                                            {defensePartyData.equipped_items_snapshot && defensePartyData.equipped_items_snapshot.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {defensePartyData.equipped_items_snapshot.map((g: any, gi: number) => (
                                                        <span key={gi} className="text-[8px] bg-[#1a2d4c] text-slate-300 border border-[#2c4772]/60 px-1.5 py-0.2 rounded">
                                                            {g.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[9px] text-slate-500 italic block">装備なし</span>
                                            )}
                                        </div>

                                        {/* スキル */}
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-amber-500 font-bold block">🔮 スキルデッキ:</span>
                                            {defensePartyData.skill_deck_snapshot && defensePartyData.skill_deck_snapshot.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {defensePartyData.skill_deck_snapshot.map((s: any, si: number) => (
                                                        <span key={si} className="text-[8px] bg-[#1d1f35] text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[9px] text-slate-500 italic block">初期スキル構成</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 同行メンバー */}
                                    <div className="space-y-2">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">同行メンバー:</span>
                                        {mSnaps.length > 0 ? (
                                            <div className="space-y-2">
                                                {mSnaps.map((m: any) => {
                                                    const mIdStr = String(m.id);
                                                    const isExpanded = !!defenseExpandedMembers[mIdStr];

                                                    return (
                                                        <div key={m.id} className="border border-[#213a65]/40 rounded-xl overflow-hidden bg-[#0c1524]/60">
                                                            {/* ヘッダー部分 */}
                                                            <div
                                                                onClick={() => toggleDefenseMember(mIdStr)}
                                                                className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#12223e]/50 transition-all select-none"
                                                            >
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shrink-0 overflow-hidden">
                                                                        {m.icon_url || m.image_url ? (
                                                                            <img src={m.icon_url || m.image_url} alt={m.name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <User className="w-4 h-4 text-slate-500" />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <span className="text-xs font-bold text-slate-100 block truncate">{m.name}</span>
                                                                        <span className="text-[8px] text-slate-400 block mt-0.5">
                                                                            Lv.{m.level || 1} {m.job_class || 'Civilian'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-3 shrink-0">
                                                                    <div className="flex gap-2 text-[9px] text-right font-mono">
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
                                                                    <span className="text-slate-500 text-xs font-bold font-mono pl-1">
                                                                        {isExpanded ? '▲' : '▼'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* 詳細展開 (アコーディオン) */}
                                                            {isExpanded && (() => {
                                                                let memberEquippedItems: any[] = [];
                                                                if (m.equipped_items_snapshot && Array.isArray(m.equipped_items_snapshot)) {
                                                                    memberEquippedItems = m.equipped_items_snapshot;
                                                                } else {
                                                                    let snapData = m.snapshot_data;
                                                                    if (typeof snapData === 'string') {
                                                                        try { snapData = JSON.parse(snapData); } catch (e) { snapData = null; }
                                                                    }
                                                                    if (snapData && Array.isArray(snapData.equipped_items)) {
                                                                        memberEquippedItems = snapData.equipped_items;
                                                                    } else if (m.equipped_items && Array.isArray(m.equipped_items)) {
                                                                        memberEquippedItems = m.equipped_items;
                                                                    }
                                                                }

                                                                let memberSkills: any[] = [];
                                                                if (m.signature_deck_snapshot && Array.isArray(m.signature_deck_snapshot)) {
                                                                    memberSkills = m.signature_deck_snapshot;
                                                                } else {
                                                                    let snapData = m.snapshot_data;
                                                                    if (typeof snapData === 'string') {
                                                                        try { snapData = JSON.parse(snapData); } catch (e) { snapData = null; }
                                                                    }
                                                                    if (snapData && Array.isArray(snapData.signature_deck_snapshot)) {
                                                                        memberSkills = snapData.signature_deck_snapshot;
                                                                    } else if (snapData && Array.isArray(snapData.deck)) {
                                                                        memberSkills = snapData.deck.map((id: any) => ({ name: `カード #${id}` }));
                                                                    } else if (m.inject_cards && Array.isArray(m.inject_cards)) {
                                                                        memberSkills = m.inject_cards.map((id: any) => ({ name: `スキル #${id}` }));
                                                                    }
                                                                }

                                                                return (
                                                                    <div className="px-3 pb-3 pt-1 border-t border-[#20365b]/50 bg-[#0c1626]/80 text-[10px] space-y-2 animate-in slide-in-from-top-2 duration-150">
                                                                        {/* 装備 */}
                                                                        <div className="space-y-1">
                                                                            <span className="text-[9px] text-amber-500 font-bold block">🛡️ 装備武具:</span>
                                                                            {memberEquippedItems && memberEquippedItems.length > 0 ? (
                                                                                <div className="flex flex-wrap gap-1">
                                                                                    {memberEquippedItems.map((g: any, gi: number) => (
                                                                                        <span key={gi} className="text-[8px] bg-[#1a2d4c] text-slate-300 border border-[#2c4772]/60 px-1.5 py-0.2 rounded">
                                                                                            {g.name}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-[9px] text-slate-500 italic block">装備なし</span>
                                                                            )}
                                                                        </div>

                                                                        {/* スキル */}
                                                                        <div className="space-y-1">
                                                                            <span className="text-[9px] text-amber-500 font-bold block">🔮 所持スキル:</span>
                                                                            {memberSkills && memberSkills.length > 0 ? (
                                                                                <div className="flex flex-wrap gap-1">
                                                                                    {memberSkills.map((s: any, si: number) => (
                                                                                        <span key={si} className="text-[8px] bg-[#1d1f35] text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded">
                                                                                            {s.name}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-[9px] text-slate-500 italic block">初期スキル構成</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-500 italic block text-center py-2 bg-[#0c1524]/60 border border-[#213a65]/40 rounded-xl">同行メンバーなし (ソロ)</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-[#0a0d14] border-t border-[#213a65]/50 flex justify-end gap-2">
                        <button
                            disabled={updatingDefense || loadingDefenseData}
                            onClick={handleUpdateDefense}
                            className="px-4 py-2 bg-[#1d2f4d] hover:bg-[#2c4772] border border-[#3c5e94] text-slate-100 font-bold text-xs rounded-xl active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {updatingDefense ? '更新中...' : '防衛パーティを更新'}
                        </button>
                        <button
                            onClick={() => setShowDefenseModal(false)}
                            className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] border border-slate-700 text-slate-300 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ランキングサブモーダル
    const renderRankingSubModal = () => {
        if (!showRankingSubModal) return null;

        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#050b14]/90 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="relative w-full max-w-md bg-[#0c1628]/95 border border-[#1e345b] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(30,52,91,0.5)] flex flex-col max-h-[80vh]">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[#11203b]/80 border-b border-[#1e345b]">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Trophy size={18} className="animate-pulse" />
                            <h3 className="font-black tracking-widest text-sm text-slate-100">コロシアムランキング</h3>
                        </div>
                        <button
                            onClick={() => setShowRankingSubModal(false)}
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-left">
                        <div className="flex items-center justify-between">
                            <div className="flex bg-[#0b1220] border border-[#1e345b] rounded-lg p-0.5 animate-in fade-in">
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

                            {/* 報酬確認ボタン */}
                            <button
                                onClick={checkClaimableRewards}
                                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-all active:scale-95 cursor-pointer shrink-0"
                            >
                                <Award size={12} />
                                報酬一覧/受取
                            </button>
                        </div>

                        {/* デイリーの場合はデイリーの集計期間を表示 (改行しないようにコンパクト化) */}
                        {rankingType === 'daily' && (
                            <div className="text-[9px] text-slate-400 bg-[#09111c]/60 border border-[#213a65]/40 rounded-xl px-3 py-1.5 font-mono flex items-center justify-between shadow-inner animate-in fade-in duration-200">
                                <span className="text-slate-500 font-bold">集計期間:</span>
                                <span className="text-amber-300 font-bold text-[9px] whitespace-nowrap">{getDailyPeriodStr()}</span>
                            </div>
                        )}

                        {/* My Ranking Status */}
                        {myRankingStatus && (
                            <div className="bg-gradient-to-r from-[#1b3152]/70 to-[#0e1c33]/70 border-2 border-amber-500/40 rounded-xl p-3 flex items-center justify-between shadow-md animate-in slide-in-from-top-2 duration-200">
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
                                        <span className="text-[9px] text-slate-400 block font-mono">あなた</span>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-amber-400 font-mono shrink-0">
                                    {myRankingStatus.arena_rate.toLocaleString()} pts
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
                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {loading && rankingList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                                    <RefreshCw className="animate-spin text-amber-500" size={24} />
                                    <span className="text-xs text-slate-400">ランキングをロード中...</span>
                                </div>
                            ) : (
                                <>
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
                                                        className="text-xs font-bold text-slate-200 truncate cursor-pointer hover:text-amber-400"
                                                    >
                                                        {player.user_name}
                                                    </h5>
                                                    <span className="text-[9px] text-slate-400 block font-mono">
                                                        Lv.{player.level} | {player.job_class}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-300 font-mono shrink-0">
                                                {player.arena_rate.toLocaleString()} pts
                                            </span>
                                        </div>
                                    ))}

                                    {rankingList.length === 0 && !loading && (
                                        <div className="text-center py-10 text-xs text-slate-500">
                                            ランキングデータはありません。
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-[#0a0d14] border-t border-[#1e345b] flex justify-end">
                        <button
                            onClick={() => setShowRankingSubModal(false)}
                            className="px-4 py-2 bg-[#1f2937] border border-slate-700 text-slate-300 font-bold text-xs rounded-xl hover:text-white transition-all cursor-pointer active:scale-95"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // 過去成績履歴確認モーダル
    const renderHistoryModal = () => {
        if (!showHistoryModal) return null;

        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#050b14]/90 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="relative w-full max-w-md bg-[#0c1628]/95 border border-[#1e345b] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(30,52,91,0.5)] flex flex-col max-h-[80vh]">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[#11203b]/80 border-b border-[#1e345b]">
                        <div className="flex items-center gap-2 text-amber-400">
                            <History size={18} className="animate-pulse" />
                            <h3 className="font-black tracking-widest text-sm text-slate-100">過去の成績履歴</h3>
                        </div>
                        <button
                            onClick={() => setShowHistoryModal(false)}
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Sub tabs (過去シーズン vs 今週のデイリー) */}
                    <div className="grid grid-cols-2 bg-[#0a1120] border-b border-[#1e345b] text-center text-xs">
                        <button
                            onClick={() => setHistoryTab('season')}
                            className={`py-2.5 font-bold border-b-2 transition-all ${historyTab === 'season' ? 'text-amber-400 border-amber-500 bg-[#11203b]/30' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                        >
                            過去シーズン成績
                        </button>
                        <button
                            onClick={() => setHistoryTab('daily')}
                            className={`py-2.5 font-bold border-b-2 transition-all ${historyTab === 'daily' ? 'text-amber-400 border-amber-500 bg-[#11203b]/30' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                        >
                            今週のデイリー成績
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                        {loadingHistory ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-3">
                                <RefreshCw className="animate-spin text-[#5586d5]" size={24} />
                                <span className="text-xs text-slate-400">履歴をロード中...</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {historyTab === 'season' ? (
                                    <>
                                        {historyData.seasons.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-[#0f1d35]/50 border border-[#20365b] rounded-xl p-3 flex justify-between items-center"
                                            >
                                                <div className="text-left space-y-1">
                                                    <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-black">
                                                        {item.season_id}
                                                    </span>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        確定日時: {new Date(item.created_at).toLocaleDateString('ja-JP')}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-mono font-bold text-slate-300 block">
                                                        {item.arena_rate.toLocaleString()} pts
                                                    </span>
                                                    <span className="text-xs font-black text-amber-400 font-sans">
                                                        {item.rank}位
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        {historyData.seasons.length === 0 && (
                                            <div className="text-center py-10 text-xs text-slate-500 italic">
                                                過去シーズンの成績履歴はありません。
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {historyData.dailies.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-[#0f1d35]/50 border border-[#20365b] rounded-xl p-3 flex justify-between items-center"
                                            >
                                                <div className="text-left space-y-1">
                                                    <span className="text-[8px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded font-black">
                                                        {item.date_str}
                                                    </span>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        記録日時: {new Date(item.created_at).toLocaleDateString('ja-JP')}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-mono font-bold text-slate-300 block">
                                                        {item.arena_rate.toLocaleString()} pts
                                                    </span>
                                                    <span className="text-xs font-black text-amber-400 font-sans">
                                                        {item.rank}位
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        {historyData.dailies.length === 0 && (
                                            <div className="text-center py-10 text-xs text-slate-500 italic">
                                                今シーズンのデイリー成績履歴はありません。
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-[#0a0d14] border-t border-[#1e345b]/50 flex justify-end">
                        <button
                            onClick={() => setShowHistoryModal(false)}
                            className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] border border-slate-700 text-slate-300 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // 防衛パーティ自動登録確認アラート
    const renderAutoDefenseAlert = () => {
        if (!showAutoDefenseAlert) return null;

        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#050b14]/95 backdrop-blur-md animate-in fade-in duration-200">
                <div className="relative w-full max-w-sm bg-[#0c1628]/98 border-2 border-amber-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.3)] flex flex-col p-6 space-y-4">
                    <div className="flex flex-col items-center text-center space-y-2.5">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <Shield size={24} className="animate-pulse" />
                        </div>
                        <h3 className="text-base font-black text-slate-100 tracking-wider">防衛パーティ未登録</h3>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                            アリーナの防衛パーティが登録されていません。<br />
                            対戦相手リストに選出されるよう、現在のパーティ構成で防衛登録を行います。
                        </p>
                    </div>

                    <button
                        disabled={autoRegistering}
                        onClick={async () => {
                            setAutoRegistering(true);
                            await handleUpdateDefense();
                            setShowAutoDefenseAlert(false);
                            setAutoRegistering(false);
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                    >
                        {autoRegistering ? (
                            <>
                                <RefreshCw className="animate-spin" size={12} />
                                登録処理中...
                            </>
                        ) : (
                            '現在のパーティで登録する'
                        )}
                    </button>
                </div>
            </div>
        );
    };

    // CP不足警告アラートポップアップ
    const renderCPErrorAlert = () => {
        if (!showCPErrorAlert) return null;

        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#050b14]/90 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="relative w-full max-w-sm bg-[#0c1628]/98 border-2 border-red-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)] flex flex-col p-6 space-y-4">
                    <div className="flex flex-col items-center text-center space-y-2.5">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                            <AlertCircle size={24} className="animate-pulse" />
                        </div>
                        <h3 className="text-base font-black text-slate-100 tracking-wider">CP不足</h3>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                            コロシアムポイント(CP)が不足しています。<br />
                            対人戦に挑戦するには 1 CP が必要です。
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCPErrorAlert(false)}
                        className="w-full py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition-all shadow-lg cursor-pointer"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        );
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
                <div className="px-6 py-2.5 bg-[#0e192c] border-b border-[#1e345b]/60 flex flex-col gap-2">
                    
                    {/* Season Info (先頭に王冠を配置、浮遊カット) */}
                    <div className="bg-[#12223f]/80 px-4 py-2 border border-[#213a65] rounded-xl text-left flex items-center gap-2 shadow-inner">
                        <Trophy size={14} className="text-amber-400 shrink-0" />
                        <div>
                            <span className="text-[8px] text-[#5586d5] uppercase font-bold tracking-wider block">CURRENT SEASON</span>
                            <span className="text-[10px] sm:text-xs text-amber-300 font-mono font-bold block leading-none mt-0.5 whitespace-nowrap">
                                {getCurrentSeasonPeriod()}
                            </span>
                        </div>
                    </div>

                    {/* ユーザー情報（2行にスプリットしてモバイルでも余裕のある配置へ） */}
                    <div className="flex flex-col gap-2 bg-[#09111c]/90 border border-slate-800/80 p-3 rounded-xl">
                        {/* 1行目: ユーザーネーム & RANK ＆ 防衛パーティボタン */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-black text-slate-100 truncate max-w-[120px] sm:max-w-[180px]">
                                    {userProfile?.name}
                                </span>
                                <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 py-0.2 rounded font-black shrink-0">
                                    {challengerRank} RANK
                                </span>
                            </div>
                            
                            <button
                                onClick={handleOpenDefenseModal}
                                className="px-2 py-1 bg-[#1a2d4c] hover:bg-[#28436e] border border-[#2d4b7c] rounded-md text-[9px] font-black text-slate-200 active:scale-95 transition-all cursor-pointer shrink-0"
                            >
                                防衛パーティ
                            </button>
                        </div>

                        {/* 2行目: CP ＆ 回復ボタン (若干大きくする) */}
                        <div className="flex items-center gap-2 border-t border-slate-800/40 pt-1.5">
                            <div className="flex items-center justify-between bg-[#12223f]/50 border border-[#213a65]/40 px-2 py-1 rounded-md min-w-[70px] justify-between">
                                <span className="text-slate-400 font-bold text-[9px]">CP:</span>
                                {syncing ? (
                                    <RefreshCw className="animate-spin text-amber-500 w-2.5 h-2.5" />
                                ) : (
                                    <span className={`font-mono font-bold text-[10px] ${
                                        cp === 0 ? 'text-red-500 font-black' :
                                        cp >= 6 ? 'text-rose-500 animate-pulse' : 
                                        'text-slate-200'
                                    }`}>
                                        {cp}/5
                                    </span>
                                )}
                            </div>

                            <button
                                disabled={loading || cp >= 6 || gold < 5000}
                                onClick={handleRecoverCP}
                                className="flex-1 py-1 bg-gradient-to-r from-amber-500/90 to-amber-600/90 hover:from-amber-400 hover:to-amber-500 text-slate-950 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 border border-amber-500/30 disabled:border-slate-700/50 rounded-md text-[9px] font-black tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                            >
                                <Zap size={8} />
                                CP回復 (5k G)
                            </button>
                        </div>
                    </div>

                    {/* レート表示 ＆ ランキングボタン (横並びで縦幅を節約) */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 text-center bg-[#070e1c]/40 border border-[#1b2f51]/40 rounded-xl py-1.5 flex items-center justify-center gap-1.5">
                            <span className="text-[9px] text-slate-300 font-bold tracking-widest uppercase">レート</span>
                            {syncing ? (
                                <RefreshCw className="animate-spin text-amber-500 w-3 h-3" />
                            ) : (
                                <span className="text-base font-black text-amber-400 font-mono tracking-wider">
                                    {arenaRate.toLocaleString()}
                                </span>
                            )}
                            <span className="text-[9px] text-slate-400 font-mono">pts</span>
                        </div>

                        <button
                            onClick={() => {
                                soundManager?.playSE('se_item_get');
                                setShowRankingSubModal(true);
                            }}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 border border-amber-500/30 rounded-xl text-[10px] font-black text-amber-400 hover:text-amber-300 transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                        >
                            <Trophy size={10} />
                            ランキング
                        </button>
                    </div>
                </div>

                {/* Tab buttons */}
                <div className="grid grid-cols-3 bg-[#0a1120] border-b border-[#1e345b] text-center text-xs">
                    <button
                        onClick={() => { soundManager?.playSE('se_item_get'); setTab('opponents'); }}
                        className={`py-3 font-bold border-b-2 transition-all ${tab === 'opponents' ? 'text-amber-400 border-amber-500 bg-[#11203b]/30' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
                    >
                        対戦相手
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
                                        className="bg-[#0f1d35]/70 border border-[#20365b] rounded-xl p-3 flex items-center justify-between transition-all"
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
                                                            className={!opponent.is_ghost ? 'cursor-pointer hover:text-amber-400' : ''}
                                                        >
                                                            {opponent.user_name}
                                                        </span>
                                                        <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 py-0.2 rounded font-black border border-amber-500/20">
                                                            {opponent.defense_rank}
                                                        </span>
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 font-mono">
                                                        レート: {(opponent.arena_rate ?? 1000).toLocaleString()} pts
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
                                <div className="flex bg-[#0b1220] border border-[#1e345b] rounded-lg p-0.5 animate-in fade-in">
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

                                {/* 右側：コンパクトな報酬確認ボタン（横幅いっぱいを廃止） */}
                                <button
                                    onClick={checkClaimableRewards}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-all active:scale-95 cursor-pointer shrink-0"
                                >
                                    <Award size={12} />
                                    報酬一覧/受取
                                </button>
                            </div>

                            {/* デイリーの場合はデイリーの集計期間を表示 */}
                            {rankingType === 'daily' && (
                                <div className="text-[10px] text-slate-400 bg-[#09111c]/60 border border-[#213a65]/40 rounded-xl px-4 py-2 font-mono flex items-center justify-between shadow-inner animate-in fade-in duration-200">
                                    <span className="text-slate-500 font-bold">デイリー集計期間:</span>
                                    <span className="text-amber-300 font-bold">{getDailyPeriodStr()}</span>
                                </div>
                            )}

                            {/* My Ranking Status (上部固定) */}
                            {myRankingStatus && (
                                <div className="bg-gradient-to-r from-[#1b3152]/70 to-[#0e1c33]/70 border-2 border-amber-500/40 rounded-xl p-3 flex items-center justify-between shadow-md animate-in slide-in-from-top-2 duration-200">
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
                                            <span className="text-[9px] text-slate-400 block font-mono">あなた</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-amber-400 font-mono shrink-0">
                                        {myRankingStatus.arena_rate.toLocaleString()} pts
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
                                {loading && rankingList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 space-y-3">
                                        <RefreshCw className="animate-spin text-amber-500" size={24} />
                                        <span className="text-xs text-slate-400">ランキングをロード中...</span>
                                    </div>
                                ) : (
                                    <>
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
                                                            className="text-xs font-bold text-slate-200 truncate cursor-pointer hover:text-amber-400"
                                                        >
                                                            {player.user_name}
                                                        </h5>
                                                        <span className="text-[9px] text-slate-400 block font-mono">
                                                            Lv.{player.level} | {player.job_class}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-300 font-mono shrink-0">
                                                    {player.arena_rate.toLocaleString()} pts
                                                </span>
                                            </div>
                                        ))}

                                        {rankingList.length === 0 && !loading && (
                                            <div className="text-center py-10 text-xs text-slate-500">
                                                ランキングデータはありません。
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ──── TAB: BATTLE LOGS ──── */}
                    {tab === 'logs' && (
                        <div className="space-y-3 text-left">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">バトル履歴 (過去20戦)</span>
                                <button
                                    onClick={() => {
                                        fetchHistoryData();
                                        setShowHistoryModal(true);
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1e345b]/50 hover:bg-[#28436e] border border-[#2d4b7c] rounded-lg text-[9px] font-bold text-sky-400 hover:text-sky-300 transition-all active:scale-95 cursor-pointer shrink-0"
                                >
                                    <History size={10} />
                                    過去成績確認
                                </button>
                            </div>
                            
                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                                {loading && battleLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                                        <RefreshCw className="animate-spin text-amber-500" size={24} />
                                        <span className="text-xs text-slate-400">バトルログをロード中...</span>
                                    </div>
                                ) : (
                                    <>
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
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ──── TAB: RULES (強調色差別化 & 新基準CS値反映) ──── */}
                    {tab === 'rules' && (
                        <div className="space-y-4 text-xs text-slate-300 leading-relaxed text-left max-h-[350px] overflow-y-auto pr-1 custom-scrollbar animate-in fade-in">
                            
                            {/* CPルール */}
                            <section className="space-y-1.5">
                                <h4 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ コロシアムポイント（CP）</h4>
                                <p className="text-slate-400 font-sans">
                                    アリーナに挑戦するには 1 挑戦につき <span className="text-sky-400 font-bold">1CP</span> を消費します（防衛戦での消費はゼロ）。
                                </p>
                                <p className="text-slate-400 font-sans">
                                    CPは <span className="text-sky-400 font-bold">1</span> 時間ごとに <span className="text-sky-400 font-bold">1</span> 自然回復し、最大 <span className="text-sky-400 font-bold">5</span> まで蓄積されます。また、ゴールドを <span className="text-sky-400 font-bold">5,000G</span> 消費して一気に <span className="text-sky-400 font-bold">10CP</span> 回復させることも可能です。超過回復は最大 <span className="text-sky-400 font-bold">15</span> まで可能ですが、<span className="text-sky-400 font-bold">16</span> 以上になる回復操作は実行できません。
                                </p>
                            </section>

                            {/* シーズン＆ランキング */}
                            <section className="space-y-1.5">
                                <h4 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ シーズン＆ランキング</h4>
                                <p className="text-slate-400 font-sans">
                                    アリーナは 1 週間ごとのシーズン制を採用しており、毎週水曜日 18:00 (JST) に新シーズンが始まりアリーナレートは全員一律で <span className="text-sky-400 font-bold">1,000</span> にリセットされます。
                                </p>
                                <p className="text-slate-400 font-sans">
                                    デイリーランキングは毎日 18:00 (JST) に切り替わります。それぞれ上位 <span className="text-sky-400 font-bold">10</span> 名に特別なゴールドやUR未鑑定品、魔術学院パック開封用の鍵が贈られます。報酬の確認や受取はランキングタブ右上の「報酬確認」から手動で行ってください。
                                </p>
                            </section>

                            {/* ユーザーランク */}
                            <section className="space-y-1.5">
                                <h4 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ ユーザーランク</h4>
                                <p className="text-slate-400 font-sans">
                                    プレイヤーおよび同行メンバーの戦闘力評価合計（合計パーティCS評価）に基づき、アリーナでのマッチングランクがリアルタイムで決定されます。
                                </p>
                                <ul className="list-disc pl-4 text-slate-400 space-y-0.5 font-sans">
                                    <li><span className="text-amber-300 font-bold">S ランク</span>: 合計戦闘スコア <span className="text-sky-400 font-bold">8,000 CS</span> 以上 (Lv15以上での5人パーティ等を想定)</li>
                                    <li><span className="text-amber-300 font-bold">A ランク</span>: 合計戦闘スコア <span className="text-sky-400 font-bold">4,000 CS</span> 以上 (Lv10以上での5人パーティ等を想定)</li>
                                    <li><span className="text-amber-300 font-bold">B ランク</span>: 合計戦闘スコア <span className="text-sky-400 font-bold">2,000 CS</span> 以上 (Lv5以上での5人パーティ等を想定)</li>
                                    <li><span className="text-amber-300 font-bold">C ランク</span>: 合計戦闘スコア <span className="text-sky-400 font-bold">2,000 CS</span> 未満 (Bランク未満の構成)</li>
                                </ul>
                            </section>

                            {/* 防衛デッキと非同期戦 */}
                            <section className="space-y-1.5">
                                <h4 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ 防衛デッキと非同期戦</h4>
                                <p className="text-slate-400 font-sans">
                                    他のプレイヤーは、あなたが「防衛登録」した際のご自身のその時のパーティ状況（HP、ATK、DEF、装備、スキル）を基にした防衛パーティと戦います。
                                </p>
                                <p className="text-slate-400 font-sans">
                                    非同期防衛バトルの際、防衛側にはステータス補正（HP増加など）が自動的に適用されます。
                                </p>
                            </section>

                            {/* アリーナレート増減テーブル */}
                            <section className="space-y-1.5">
                                <h4 className="text-amber-400 font-bold border-b border-[#1e345b] pb-1">✦ アリーナレート増減テーブル</h4>
                                <p className="text-slate-400 font-sans">バトルでの勝敗および対戦相手とのランク（S〜C）の相性によって変動値がランダムに決まります。</p>
                                <table className="w-full border-collapse border border-[#1e345b] bg-[#11203b]/20 text-[10px] my-2 font-mono">
                                    <thead>
                                        <tr className="bg-[#11203b]/60 border-b border-[#1e345b] text-blue-200 font-sans">
                                            <th className="p-2 border-r border-[#1e345b]">相手のランク</th>
                                            <th className="p-2 border-r border-[#1e345b]">勝利時レート</th>
                                            <th className="p-2">敗北時レート</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-[#1e345b]">
                                            <td className="p-2 border-r border-[#1e345b] text-emerald-400 font-bold font-sans">格上 (相手が上)</td>
                                            <td className="p-2 border-r border-[#1e345b] text-sky-400 font-bold">+30 〜 +50</td>
                                            <td className="p-2 text-rose-400 font-bold">-1 〜 -10</td>
                                        </tr>
                                        <tr className="border-b border-[#1e345b]">
                                            <td className="p-2 border-r border-[#1e345b] text-slate-300 font-bold font-sans">同格 (同じランク)</td>
                                            <td className="p-2 border-r border-[#1e345b] text-sky-400 font-bold">+10 〜 +25</td>
                                            <td className="p-2 text-rose-400 font-bold">-10 〜 -25</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border-r border-[#1e345b] text-rose-400 font-bold font-sans">格下 (相手が下)</td>
                                            <td className="p-2 border-r border-[#1e345b] text-sky-400 font-bold">+1 〜 +10</td>
                                            <td className="p-2 text-rose-400 font-bold">-30 〜 -50</td>
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
                                対戦相手
                            </h3>
                            <button
                                onClick={() => { setSelectedOpponent(null); setDetailErrorMsg(null); }}
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

                            {detailErrorMsg && (
                                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                                    <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400 text-center font-bold">
                                        {detailErrorMsg}
                                    </div>
                                    <p className="text-[10px] text-slate-500">※ご自身の防衛確認でこれが表示される場合は、まず「更新」を押して防衛登録を行ってください。</p>
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
                                                    評価: {(selectedOpponentDetail.battle_score ?? 1000).toLocaleString()} CS | ランク: {selectedOpponent.defense_rank}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Leader Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2 text-center py-1.5 bg-[#0a1120] rounded-lg border border-[#1e345b]/50 font-mono">
                                            <div>
                                                <span className="text-[9px] text-slate-400 block font-bold">HP</span>
                                                <span className="font-bold text-emerald-400">{(selectedOpponentDetail.player_snapshot?.hp || 100).toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-slate-400 block font-bold">ATK</span>
                                                <span className="font-bold text-rose-400">{(selectedOpponentDetail.player_snapshot?.atk || 10).toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-slate-400 block font-bold">DEF</span>
                                                <span className="font-bold text-sky-400">{(selectedOpponentDetail.player_snapshot?.def || 10).toLocaleString()}</span>
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
                                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">同行メンバー (タップで詳細確認)</span>
                                        {selectedOpponentDetail.party_members_snapshot && selectedOpponentDetail.party_members_snapshot.length > 0 ? (
                                            <div className="space-y-1.5">
                                                {selectedOpponentDetail.party_members_snapshot.map((m: any, mi: number) => {
                                                    const isExpanded = expandedMemberId === m.id;
                                                    return (
                                                        <div 
                                                            key={mi} 
                                                            className="border border-[#20365b] rounded-xl overflow-hidden bg-[#0f1d35]/30 hover:bg-[#12223e]/50 transition-all"
                                                        >
                                                            {/* ヘッダー部分 (タップ領域) */}
                                                            <div 
                                                                onClick={() => {
                                                                    soundManager?.playSE('se_item_get');
                                                                    setExpandedMemberId(isExpanded ? null : m.id);
                                                                }}
                                                                className="p-2.5 flex items-center justify-between font-mono cursor-pointer select-none"
                                                            >
                                                                <div className="text-left col-span-3">
                                                                    <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                                                        {m.name}
                                                                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-black">
                                                                            Lv.{m.level}
                                                                        </span>
                                                                    </h5>
                                                                    <span className="text-[9px] text-slate-400 block">{m.job_class}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex gap-2.5 text-right text-[10px]">
                                                                        <div>
                                                                            <span className="text-[8px] text-slate-500 block">HP</span>
                                                                            <span className="font-bold text-emerald-400">{m.hp?.toLocaleString() || 100}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[8px] text-slate-500 block">ATK</span>
                                                                            <span className="font-bold text-rose-400">{m.atk?.toLocaleString() || 10}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[8px] text-slate-500 block">DEF</span>
                                                                            <span className="font-bold text-sky-400">{m.def?.toLocaleString() || 10}</span>
                                                                        </div>
                                                                    </div>
                                                                    {/* 詳細展開部分 (装備・スキル) */}
                                                                    {isExpanded && (() => {
                                                                        // 装備配列を安全に抽出
                                                                        let memberEquippedItems: any[] = [];
                                                                        if (m.equipped_items_snapshot && Array.isArray(m.equipped_items_snapshot)) {
                                                                            memberEquippedItems = m.equipped_items_snapshot;
                                                                        } else {
                                                                            let snapData = m.snapshot_data;
                                                                            if (typeof snapData === 'string') {
                                                                                try {
                                                                                    snapData = JSON.parse(snapData);
                                                                                } catch (e) {
                                                                                    snapData = null;
                                                                                }
                                                                            }
                                                                            if (snapData && Array.isArray(snapData.equipped_items)) {
                                                                                memberEquippedItems = snapData.equipped_items;
                                                                            } else if (m.equipped_items && Array.isArray(m.equipped_items)) {
                                                                                memberEquippedItems = m.equipped_items;
                                                                            }
                                                                        }

                                                                        // スキル配列を安全に抽出
                                                                        let memberSkills: any[] = [];
                                                                        if (m.signature_deck_snapshot && Array.isArray(m.signature_deck_snapshot)) {
                                                                            memberSkills = m.signature_deck_snapshot;
                                                                        } else {
                                                                            let snapData = m.snapshot_data;
                                                                            if (typeof snapData === 'string') {
                                                                                try {
                                                                                    snapData = JSON.parse(snapData);
                                                                                } catch (e) {
                                                                                    snapData = null;
                                                                                }
                                                                            }
                                                                            if (snapData && Array.isArray(snapData.signature_deck_snapshot)) {
                                                                                memberSkills = snapData.signature_deck_snapshot;
                                                                            } else if (snapData && Array.isArray(snapData.deck)) {
                                                                                memberSkills = snapData.deck.map((id: any) => ({ name: `カード #${id}` }));
                                                                            } else if (m.inject_cards && Array.isArray(m.inject_cards)) {
                                                                                memberSkills = m.inject_cards.map((id: any) => ({ name: `スキル #${id}` }));
                                                                            }
                                                                        }

                                                                        return (
                                                                            <div className="px-3 pb-3 pt-1 border-t border-[#20365b]/50 bg-[#0c1626]/80 text-[10px] space-y-2 animate-in slide-in-from-top-2 duration-150">
                                                                                {/* 装備 */}
                                                                                <div className="space-y-1">
                                                                                    <span className="text-[9px] text-amber-500 font-bold block">🛡️ 装備武具:</span>
                                                                                    {memberEquippedItems && memberEquippedItems.length > 0 ? (
                                                                                        <div className="flex flex-wrap gap-1">
                                                                                            {memberEquippedItems.map((g: any, gi: number) => (
                                                                                                <span key={gi} className="text-[8px] bg-[#1a2d4c] text-slate-300 border border-[#2c4772]/60 px-1.5 py-0.2 rounded">
                                                                                                    {g.name}
                                                                                                </span>
                                                                                            ))}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="text-[9px] text-slate-500 italic block">装備なし</span>
                                                                                    )}
                                                                                </div>

                                                                                {/* スキル */}
                                                                                <div className="space-y-1">
                                                                                    <span className="text-[9px] text-amber-500 font-bold block">🔮 所持スキル:</span>
                                                                                    {memberSkills && memberSkills.length > 0 ? (
                                                                                        <div className="flex flex-wrap gap-1">
                                                                                            {memberSkills.map((s: any, si: number) => (
                                                                                                <span key={si} className="text-[8px] bg-[#1d1f35] text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded">
                                                                                                    {s.name}
                                                                                                </span>
                                                                                            ))}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="text-[9px] text-slate-500 italic block">初期スキル構成</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                    {/* 矢印表示 */}
                                                                    <span className="text-slate-500 text-xs font-bold font-mono pl-1">
                                                                        {isExpanded ? '▲' : '▼'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
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

            {/* ──── RANKINGS REWARDS PREVIEW & CLAIM MODAL (UX: 即時スピナー対応) ──── */}
            {showRewardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
                    <div className="relative w-full max-w-md bg-[#0e1628]/95 border-2 border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-[#11203b]/90 border-b border-[#1e345b]">
                            <h3 className="font-black text-amber-400 tracking-wider flex items-center gap-1.5 text-xs">
                                <Award size={16} />
                                アリーナランキング 順位報酬一覧
                            </h3>
                            <button
                                onClick={() => setShowRewardModal(false)}
                                className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 text-left space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
                            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                                各シーズン（毎週水曜18:00）またはデイリー（毎日18:00）の終了時点で、上位に入賞した旅人に以下の特別報酬が手動確認により贈られます。
                            </p>

                            {/* 報酬仕様一覧説明テーブル */}
                            <table className="w-full border-collapse border border-[#1e345b] bg-[#11203b]/20 font-mono text-[10px]">
                                <thead>
                                    <tr className="bg-[#11203b]/60 border-b border-[#1e345b] text-blue-200">
                                        <th className="p-2 border-r border-[#1e345b] text-left">最終順位</th>
                                        <th className="p-2 text-right">獲得報酬</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-[#1e345b]">
                                        <td className="p-2 border-r border-[#1e345b] text-amber-400 font-bold font-sans">1位</td>
                                        <td className="p-2 text-right text-slate-200 font-sans space-y-0.5">
                                            <div className="font-bold text-amber-400">100,000 G</div>
                                            <div>魔術学院の鍵 ×5</div>
                                            <div>未鑑定アイテム(UR) ×3</div>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-[#1e345b]">
                                        <td className="p-2 border-r border-[#1e345b] text-slate-300 font-bold font-sans">2〜3位</td>
                                        <td className="p-2 text-right text-slate-200 font-sans space-y-0.5">
                                            <div className="font-bold text-amber-400">50,000 G</div>
                                            <div>魔術学院の鍵 ×3</div>
                                            <div>未鑑定アイテム(UR) ×2</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 border-r border-[#1e345b] text-slate-400 font-bold font-sans">4〜10位</td>
                                        <td className="p-2 text-right text-slate-200 font-sans space-y-0.5">
                                            <div className="font-bold text-amber-400">20,000 G</div>
                                            <div>魔術学院の鍵 ×1</div>
                                            <div>未鑑定アイテム(UR) ×1</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* あなたが今受け取れる未受取の報酬情報 (読み込み中のスピナー対応) */}
                            <div className="border-t border-slate-800/80 pt-3.5 space-y-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">受け取り可能な未受取の報酬:</span>
                                
                                {loadingRewards ? (
                                    <div className="flex flex-col items-center justify-center py-6 space-y-2">
                                        <RefreshCw className="animate-spin text-amber-500" size={18} />
                                        <span className="text-[10px] text-slate-500 font-sans">受取状態を確認中...</span>
                                    </div>
                                ) : claimableRewards.length === 0 ? (
                                    <div className="text-center py-4 bg-[#0a1120] border border-slate-800/80 rounded-xl text-slate-500 italic font-sans">
                                        現在、受け取り可能な入賞報酬はありません。
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {claimableRewards.map((reward, ri) => (
                                            <div key={ri} className="p-3 bg-[#11203b]/40 border border-[#233f6d] rounded-xl flex justify-between items-center animate-in zoom-in-95">
                                                <div>
                                                    <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-black mr-1">
                                                        {reward.type === 'season' ? 'シーズン' : 'デイリー'}
                                                    </span>
                                                    <span className="text-slate-200 font-bold font-sans">順位: {reward.rank}位</span>
                                                </div>
                                                <button
                                                    disabled={loading}
                                                    onClick={() => handleClaimRewardItem(reward)}
                                                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg active:scale-95 transition-all text-[10px] cursor-pointer"
                                                >
                                                    受け取る
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-[#0a0d14] border-t border-[#1e345b] flex justify-end">
                            <button
                                onClick={() => setShowRewardModal(false)}
                                className="px-4 py-2 bg-[#1f2937] border border-slate-700 text-slate-300 font-bold text-xs rounded-xl hover:text-white transition-all cursor-pointer"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 過去成績履歴確認サブモーダル */}
            {renderHistoryModal()}

            {/* ランキングサブモーダル */}
            {renderRankingSubModal()}

            {/* 自動防衛登録確認アラート */}
            {renderAutoDefenseAlert()}

            {/* CP不足警告アラート */}
            {renderCPErrorAlert()}

            {/* 防衛確認サブモーダル */}
            {renderDefenseModal()}

            {/* ──── 外部コンポーネント: 他プレイヤーの自己紹介ポップアップ ──── */}
            {viewingProfileUserId && (
                <SimpleUserProfilePopup
                    isOpen={true}
                    userId={viewingProfileUserId}
                    onClose={() => setViewingProfileUserId(null)}
                    callerUserId={userProfile?.id}
                    name=""
                />
            )}
        </div>,
        portalTarget
    );
}
