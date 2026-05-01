'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { supabase } from '@/lib/supabase';
import { useAuthGuard, clearGameStarted } from '@/hooks/useAuthGuard';
import { HUB_LOCATION_NAME } from '@/utils/constants';
import InnHeader from '@/components/inn/InnHeader';
import TavernModal from '@/components/inn/TavernModal';
import ShopModal from '@/components/shop/ShopModal';
import PrayerModal from '@/components/world/PrayerModal';
import StatusModal from '@/components/inn/StatusModal';
import AccountSettingsModal from '@/components/inn/AccountSettingsModal';
import MainVisualArea from '@/components/inn/MainVisualArea';
import FacilityGrid, { FacilityType } from '@/components/inn/FacilityGrid';
import NpcDialogModal, { NpcDialogData, SecondaryAction } from '@/components/inn/NpcDialogModal';
import RumorsModal from '@/components/inn/RumorsModal';
import GossipModal from '@/components/world/GossipModal';
import CreatorsWorkshopBanner from '@/components/inn/CreatorsWorkshopBanner';
import WorkshopModal from '@/components/inn/WorkshopModal';
import QuestBoardModal from '@/components/inn/QuestBoardModal';
import ChronicleModal from '@/components/world/ChronicleModal';
import HistoryArchiveModal from '@/components/inn/HistoryArchiveModal';
import { getNpcForLocation } from '@/lib/getNpcForLocation';
import type { FacilityKey } from '@/data/npcMasterData';
import { useBgm } from '@/hooks/useBgm';
import { soundManager } from '@/lib/soundManager';
import { getBgmKey } from '@/lib/getBgmKey';
import XShareButton from '@/components/shared/XShareButton';
import QuestTestPanel from '@/components/debug/QuestTestPanel';
import DebugInventoryPanel from '@/components/debug/DebugInventoryPanel';
import DebugPartyPanel from '@/components/debug/DebugPartyPanel';

export default function InnPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#070e1e] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <InnPageInner />
        </Suspense>
    );
}

function InnPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { gold, spendGold, worldState, fetchWorldState, userProfile, fetchUserProfile, showStatus, setShowStatus, hubState, equipBonus } = useGameStore();

    // 拠点状態に応じた動的BGM選択 (spec_v14.1 §4)
    const bgmKey = getBgmKey(
        worldState?.location_name,
        worldState?.controlling_nation,
        worldState?.prosperity_level
    );
    useBgm(bgmKey);

    // UI States
    const [activeModal, setActiveModal] = useState<FacilityType | 'rumors' | 'workshop' | 'history' | 'questBoard' | 'gossip' | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAccount, setShowAccount] = useState(false);
    const [showTavern, setShowTavern] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const [showPrayer, setShowPrayer] = useState(false);
    const [restLoading, setRestLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2500);
    };

    // Quest Data State (ギルド用)
    const [allQuests, setAllQuests] = useState<any[]>([]);
    const [loadingQuests, setLoadingQuests] = useState(false);

    // Reputation
    const [reputation, setReputation] = useState<any>(null);

    // News & History Logic
    const [gougaiEvents, setGougaiEvents] = useState<any[]>([]);

    // Badge states (赤！バッジ)
    const [showHistoryBadge, setShowHistoryBadge] = useState(true);
    const [showRumorsBadge, setShowRumorsBadge] = useState(true);

    // ハブ判定
    const isHub = hubState?.is_in_hub === true;

    // Vitality枯渇死亡モーダル (spec_v15.1 §3.3)
    const [showVitalityDeath, setShowVitalityDeath] = useState(false);
    const [vitalityDeathHandled, setVitalityDeathHandled] = useState(false);

    useAuthGuard(); // タイトル画面経由チェック

    // Initial load
    useEffect(() => {
        Promise.all([
            fetchWorldState(),
            useGameStore.getState().fetchUserProfile()
        ]).then(() => {
            if (!useGameStore.getState().userProfile) {
                router.push('/title');
            }
        }).finally(() => setLoading(false));
    }, [router, fetchWorldState]);

    // ① redirect_to_map後続処理: バトル後のURLパラメータを読んでencounter-resultを解決 (spec_v16 §1.1/1.2)
    useEffect(() => {
        const battleResult = searchParams.get('battle_result');
        const bType = searchParams.get('type');
        const targetLocId = searchParams.get('target');
        const originLocId = searchParams.get('origin');

        // エンカウントバトル結果のみ処理 (quest系は除外)
        const isEncounterType = bType === 'bounty_hunter_ambush' || bType === 'random_encounter';
        if (!battleResult || !isEncounterType || !userProfile?.id) return;

        const resolveEncounterResult = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                const res = await fetch('/api/move/encounter-result', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                        'x-user-id': userProfile.id
                    },
                    body: JSON.stringify({
                        result: battleResult === 'win' ? 'win' : 'lose',
                        encounter_type: bType,
                        target_location_id: targetLocId,
                        origin_location_id: originLocId
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    await fetchUserProfile();
                    if (data.redirect_to_map) {
                        // 敗北: ワールドマップへ（出発地選択状態）
                        router.replace(`/world-map`);
                    }
                    // 賞金稼ぎ勝利シェアはBattleView側で既に表示済みのためスキップ
                }
            } catch (e) {
                console.error('[InnPage] encounter-result resolve failed', e);
            }
            // URLパラメータをクリーンアップ
            router.replace('/inn');
        };

        resolveEncounterResult();
    }, [searchParams.get('battle_result'), userProfile?.id]);

    // ② Vitality枯渇死亡検知 (spec_v15.1 §3.3)
    useEffect(() => {
        if (!userProfile || vitalityDeathHandled) return;
        if ((userProfile.vitality ?? 100) <= 0) {
            setShowVitalityDeath(true);
            setVitalityDeathHandled(true);
        }
    }, [userProfile?.vitality]);

    // Reputation Logic (通常拠点でのみ取得)
    const fetchRep = useCallback(async () => {
        if (!userProfile?.id || !worldState?.location_name) return;
        if (isHub) return; // ハブでは不要
        const { data } = await supabase
            .from('reputations')
            .select('*')
            .eq('user_id', userProfile.id)
            .eq('location_name', worldState.location_name)
            .maybeSingle();
        setReputation(data || { rank: 'Stranger', score: 0 });
    }, [userProfile?.id, worldState?.location_name, isHub]);

    useEffect(() => {
        fetchRep();
    }, [fetchRep]);

    // Gougai Detection
    useEffect(() => {
        if (!userProfile?.id || gougaiEvents.length > 0) return;

        const checkGougai = async () => {
            try {
                const res = await fetch(`/api/world-history/get-updates?user_id=${userProfile.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.news && data.news.length > 0) {
                        setGougaiEvents(data.news);
                    }
                }
            } catch (e) {
                console.error("号外チェック失敗", e);
            }
        };

        checkGougai();
    }, [userProfile]);

    const handleCloseGougai = async () => {
        if (gougaiEvents.length > 0 && userProfile?.id) {
            const latestId = gougaiEvents[0].id;
            try {
                await fetch('/api/world-history/mark-seen', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userProfile.id, last_seen_history_id: latestId })
                });
            } catch (e) {
                console.error("ニュース既読マーク失敗", e);
            }
        }
        setGougaiEvents([]);
    };

    // NPC Data Generator — 動的解決 (NPC_MASTER のキー = worldState.location_name)
    const FACILITY_LABELS: Record<string, string> = {
        inn: '宿屋/酒場', guild: 'ギルド', shop: '道具屋', temple: '神殿'
    };
    const locationSlug = worldState?.location_name || '名もなき旅人の拠所';

    const getNpcData = (facility: FacilityType): NpcDialogData | null => {
        const facilityKey = facility as FacilityKey;
        if (!['inn', 'guild', 'shop', 'temple'].includes(facilityKey)) return null;

        const repScore = reputation?.score || 0;
        const resolved = getNpcForLocation(locationSlug, facilityKey, repScore);

        if (!resolved) {
            // フォールバック: マスターデータにない場合の汎用NPC
            return {
                facilityName: FACILITY_LABELS[facility] || facility,
                role: '担当者',
                name: '名のある者',
                dialogue: 'いらっしゃい。何かご用ですか？',
            };
        }

        return {
            facilityName: FACILITY_LABELS[facility] || facility,
            role: resolved.role,
            name: resolved.name,
            dialogue: resolved.dialogue,
            imageUrl: resolved.imageUrl,
            isBanned: resolved.isBanned,
        };
    };

    const handleSelectFacility = (facility: FacilityType) => {
        if (['map', 'status', 'settings', 'gossip'].includes(facility)) {
            if (facility === 'map') {
                // ワールドマップ遷移SE → 150ms後に遷移 (spec_v14.1 §5.2)
                soundManager?.playSE('se_travel');
                setTimeout(() => router.push('/world-map'), 150);
            }
            if (facility === 'status') setShowStatus(true);
            if (facility === 'settings') setShowAccount(true);
            if (facility === 'gossip') setActiveModal('gossip');
        } else {
            // 施設入場SE (spec_v14.1 §5.1)
            const facilitySeMap: Record<string, string> = {
                inn:    'se_enter_inn',
                guild:  'se_enter_guild',
                shop:   'se_enter_shop',
                temple: 'se_enter_temple',
            };
            const seKey = facilitySeMap[facility];
            if (seKey) soundManager?.playSE(seKey);
            // Open NPC Dialog
            setActiveModal(facility);
        }
    };

    const getInnCost = () => {
        const prosp = worldState?.prosperity_level || 3;
        if (prosp >= 4) return 100;
        if (prosp <= 2) return 300;
        return 200;
    };

    const activeDialogConfig = (): { buttonText: string; isDisabled: boolean; secondaryActions?: SecondaryAction[] } => {
        if (!activeModal) return { buttonText: '', isDisabled: false };
        if (activeModal === 'inn') {
            const cost = getInnCost();
            const canAfford = (userProfile?.gold || 0) >= cost;
            const secondary: SecondaryAction[] = [];
            // ハブ以外では「冒険者を探す」を表示
            if (!isHub) {
                secondary.push({ label: '冒険者を探す', onClick: () => { setActiveModal(null); setShowTavern(true); } });
            }
            return {
                buttonText: canAfford ? `休息する（${cost} G）` : 'ゴールドが不足しています',
                isDisabled: !canAfford,
                secondaryActions: secondary,
            };
        }
        if (activeModal === 'shop') return { buttonText: '品揃えを見る', isDisabled: false };
        if (activeModal === 'temple') return { buttonText: '礼拝堂に行く', isDisabled: false };
        if (activeModal === 'guild') return { buttonText: '依頼を見る', isDisabled: false };
        return { buttonText: '機能を利用する', isDisabled: false };
    };

    const handleDialogAction = (facility: FacilityType) => {
        setActiveModal(null);
        if (facility === 'inn') {
            handleRest();
        } else if (facility === 'shop') {
            setShowShop(true);
        } else if (facility === 'temple') {
            setShowPrayer(true);
        } else if (facility === 'guild') {
            setActiveModal('questBoard');
            fetchQuestsForBoard();
        }
    };

    const fetchQuestsForBoard = async () => {
        if (!userProfile?.id || !worldState?.location_name) return;
        setLoadingQuests(true);
        try {
            const res = await fetch(`/api/location/quests?userId=${userProfile.id}&locationId=${userProfile.current_location_id || ''}`);
            if (res.ok) {
                const data = await res.json();
                setAllQuests(data.quests || []);
            }
        } catch (e) {
            console.error("クエスト読み込み失敗", e);
        } finally {
            setLoadingQuests(false);
        }
    };

    const handleRest = async () => {
        const cost = getInnCost();
        if ((userProfile?.gold || 0) < cost) {
            showToast('ゴールドが不足しています。', 'error');
            return;
        }

        setRestLoading(true);
        try {
            const effectiveMaxHp = (userProfile?.max_hp || 100) + (equipBonus?.hp || 0);
            const res = await fetch('/api/inn/rest', { method: 'POST', body: JSON.stringify({ id: userProfile?.id, effectiveMaxHp }) });
            if (res.ok) {
                spendGold(cost);
                await useGameStore.getState().fetchUserProfile();
                // v4.1: バトル残留パーティデータをクリア（QuestHeaderのstale HP表示防止）
                useGameStore.setState(state => ({
                    battleState: {
                        ...state.battleState,
                        party: [],
                        enemy: null,
                        enemies: [],
                        isVictory: false,
                        isDefeat: false,
                    }
                }));
                showToast(`✨ HPが全快しました（宿泊費: ${cost} G）`);
            } else {
                const err = await res.json();
                showToast(`宿泊できませんでした: ${err.error || '不明なエラー'}`, 'error');
            }
        } catch (e) {
            console.error(e);
            showToast('通信エラーが発生しました。', 'error');
        } finally {
            setRestLoading(false);
        }
    };

    const openHistoryHall = async () => {
        setShowHistoryBadge(false);
        setActiveModal('history');
    };

    // Derived states
    const activeNpcData = activeModal && ['inn', 'shop', 'temple', 'guild'].includes(activeModal)
        ? getNpcData(activeModal as FacilityType) : null;
    const { buttonText, isDisabled, secondaryActions } = activeDialogConfig();

    if (loading || !userProfile || !worldState) {
        return (
            <div className="min-h-screen text-gray-200 font-sans select-none overflow-hidden bg-[#070e1e] flex justify-center items-center">
                <div className="relative w-full max-w-[390px] h-[100dvh] md:h-[844px] bg-[#0a1628] md:border-[6px] md:border-[#1a2d5a] md:rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-amber-400/70 font-serif tracking-widest animate-pulse">拠点情報を取得中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-gray-200 font-sans select-none overflow-hidden bg-[#070e1e] flex justify-center items-center">

            {/* Toast通知（画面中央） */}
            {toast && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none">
                    <div className={`px-6 py-4 rounded-xl shadow-2xl text-sm font-bold text-center animate-in fade-in zoom-in-90 duration-200 max-w-[320px] ${
                        toast.type === 'success'
                            ? 'bg-emerald-900/95 border border-emerald-500/60 text-emerald-200 shadow-emerald-900/50'
                            : 'bg-red-900/95 border border-red-500/60 text-red-200 shadow-red-900/50'
                    }`}>
                        {toast.msg}
                    </div>
                </div>
            )}

            {/* 休息中オーバーレイ */}
            {restLoading && (
                <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-amber-300 text-sm font-serif tracking-widest animate-pulse">休息中...</p>
                </div>
            )}

            {/* Mobile View Container */}
            <div className="relative w-full max-w-[390px] h-[100dvh] md:h-[844px] bg-[#0a1628] md:border-[6px] md:border-[#1a2d5a] md:rounded-[40px] shadow-2xl overflow-y-auto no-scrollbar flex flex-col pb-10">

                {/* Fixed Header */}
                <InnHeader worldState={worldState} userProfile={userProfile} reputation={reputation} onOpenSettings={() => setShowAccount(true)} onOpenStatus={() => setShowStatus(true)} equipBonus={equipBonus} />

                {/* Vitality枯渇死亡モーダル (spec_v15.1 §3.3) */}
                {showVitalityDeath && userProfile && (
                    <VitalityDeathModal
                        userProfile={userProfile}
                        onClose={() => setShowVitalityDeath(false)}
                    />
                )}

                {/* Gougai Modal */}
                {gougaiEvents.length > 0 && (
                    <ChronicleModal
                        events={gougaiEvents}
                        onClose={handleCloseGougai}
                    />
                )}

                {/* NPC Dialog */}
                {activeNpcData && activeModal && (
                    <NpcDialogModal
                        npcData={activeNpcData}
                        onClose={() => setActiveModal(null)}
                        onAction={() => handleDialogAction(activeModal as FacilityType)}
                        buttonText={buttonText}
                        isDisabled={isDisabled}
                        secondaryActions={secondaryActions}
                    />
                )}

                {activeModal === 'rumors' && (
                    <RumorsModal
                        onClose={() => setActiveModal(null)}
                        worldState={worldState}
                        reputationScore={reputation?.score || 0}
                    />
                )}

                {activeModal === 'gossip' && (
                    <GossipModal
                        onClose={() => setActiveModal(null)}
                        onOpenTavern={() => { setActiveModal(null); setShowTavern(true); }}
                    />
                )}

                {/* Modals */}
                {showShop && <ShopModal onClose={() => setShowShop(false)} />}
                {showPrayer && userProfile && <PrayerModal onClose={() => setShowPrayer(false)} locationId={userProfile.current_location_id || ''} locationName={worldState?.location_name || ''} />}
                {showAccount && <AccountSettingsModal onClose={() => setShowAccount(false)} />}
                {showStatus && <StatusModal onClose={() => setShowStatus(false)} />}

                {activeModal === 'workshop' && (
                    <WorkshopModal onClose={() => setActiveModal(null)} />
                )}

                {activeModal === 'questBoard' && (
                    <QuestBoardModal
                        isOpen={true}
                        onClose={() => setActiveModal(null)}
                        userProfile={userProfile}
                        quests={allQuests}
                        loading={loadingQuests}
                        onSelect={(s) => router.push(`/quest/${s.id}`)}
                    />
                )}

                {/* Main Visual */}
                <MainVisualArea
                    worldState={worldState}
                    locationSlug={userProfile?.locations?.slug}
                    onOpenHistory={openHistoryHall}
                    onOpenMap={() => router.push('/world-map')}
                    showHistoryBadge={showHistoryBadge}
                />

                {/* Facility Grid Navigation */}
                <div className="flex-1 w-full bg-[#0a1628]">
                    <FacilityGrid onSelectFacility={handleSelectFacility} isHub={isHub} />
                    <CreatorsWorkshopBanner
                        locationName={worldState?.location_name || ''}
                        onOpenWorkshop={() => setActiveModal('workshop')}
                    />
                </div>

                {/* History Hall */}
                {activeModal === 'history' && userProfile && (
                    <HistoryArchiveModal
                        userId={userProfile.id}
                        onClose={() => setActiveModal(null)}
                    />
                )}

                {/* デバッグツール */}
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[95%] opacity-50 hover:opacity-100 transition-opacity">
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('10000Gを追加しますか？')) return; await fetch('/api/debug/add-gold', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, amount: 10000 }) }); useGameStore.getState().fetchUserProfile(); }} className="px-2 py-1 bg-amber-900 border border-amber-500 rounded text-[10px]">Add Gold</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('1日経過させますか？')) return; await fetch('/api/debug/skip-time', { method: 'POST', body: JSON.stringify({ days: 1 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-2 py-1 bg-green-900 border border-green-500 rounded text-[10px]">+1 Day</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('レベルを+1しますか？')) return; await fetch('/api/debug/level-up', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, levels: 1 }) }); useGameStore.getState().fetchUserProfile(); }} className="px-2 py-1 bg-blue-900 border border-blue-500 rounded text-[10px]">Lv +1</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('レベルを-1しますか？')) return; await fetch('/api/debug/level-up', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, levels: -1 }) }); useGameStore.getState().fetchUserProfile(); }} className="px-2 py-1 bg-blue-900 border border-blue-400 rounded text-[10px]">Lv -1</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('名声を+100しますか？')) return; await fetch('/api/debug/modify-reputation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userProfile?.id, locationName: worldState?.location_name, amount: 100 }) }); await fetchRep(); }} className="px-2 py-1 bg-purple-900 border border-purple-500 rounded text-[10px]">名声+</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('名声を-100しますか？')) return; await fetch('/api/debug/modify-reputation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userProfile?.id, locationName: worldState?.location_name, amount: -100 }) }); await fetchRep(); }} className="px-2 py-1 bg-purple-900 border border-purple-400 rounded text-[10px]">名声-</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('秩序を+10しますか？')) return; await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'order', amount: 10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-cyan-900 border border-cyan-500 rounded text-[9px]">秩序+</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('秩序を-10しますか？')) return; await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'order', amount: -10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-cyan-900 border border-cyan-400 rounded text-[9px]">秩序-</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('混沌を+10しますか？')) return; await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'chaos', amount: 10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-orange-900 border border-orange-500 rounded text-[9px]">混沌+</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('混沌を-10しますか？')) return; await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'chaos', amount: -10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-orange-900 border border-orange-400 rounded text-[9px]">混沌-</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('正義を+10しますか？')) return; await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'justice', amount: 10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-yellow-900 border border-yellow-500 rounded text-[9px]">正義+</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('正義を-10しますか？')) return; await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'justice', amount: -10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-yellow-900 border border-yellow-400 rounded text-[9px]">正義-</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('悪意を+10しますか？')) return; await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'evil', amount: 10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-rose-900 border border-rose-500 rounded text-[9px]">悪意+</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('悪意を-10しますか？')) return; await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'evil', amount: -10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-rose-900 border border-rose-400 rounded text-[9px]">悪意-</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('世界変換シミュレーションを即時実行しますか？')) return; await fetch('/api/debug/run-simulation', { method: 'POST' }); useGameStore.getState().fetchWorldState(); alert('世界変換を実行しました。'); }} className="px-2 py-1 bg-teal-900 border border-teal-500 rounded text-[10px]">世界変換</button>
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('⚠️ ワールドリセットを実行しますか？\n全てのユーザーデータが削除されます。')) return; await fetch('/api/debug/reset', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id }) }); window.location.href = '/title'; }} className="px-2 py-1 bg-red-900 border border-red-500 rounded text-[10px]">World Reset</button>
                    </div>
                    {/* バトルテスト */}
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('バトルテストを開始しますか？\nランダムな敵グループと戦闘します。')) return; router.push('/battle-test'); }}
                        className="w-[90%] max-w-xs mt-2 px-4 py-3 bg-gradient-to-r from-red-950 to-red-900 border-2 border-red-600 rounded-xl text-sm font-bold text-red-200 hover:from-red-900 hover:to-red-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-950/50"
                    >
                        ⚔️ バトルテスト
                    </button>

                    {/* クエストテスト */}
                    <QuestTestPanel userId={userProfile?.id} onSelectQuest={(id) => router.push(`/quest/${id}?debug_bypass=true`)} />

                    {/* インベントリ・スキル追加 */}
                    <DebugInventoryPanel userId={userProfile?.id} onRefresh={() => useGameStore.getState().fetchInventory()} />

                    {/* NPC加入 */}
                    <DebugPartyPanel userId={userProfile?.id} />

                    {/* 拠点属性パラメータ表示 */}
                    {worldState && (
                        <div className="w-[90%] max-w-xs mt-3 p-3 bg-[#0d1b3e]/80 border border-[#2a4080]/50 rounded-xl text-[11px] space-y-2">
                            <div className="flex items-center justify-between text-blue-200/70 font-bold border-b border-[#2a4080]/30 pb-1.5 mb-1">
                                <span>📍 {worldState.location_name || '---'}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                    worldState.prosperity_level === 5 ? 'bg-amber-500/20 text-amber-300' :
                                    worldState.prosperity_level === 4 ? 'bg-green-500/20 text-green-300' :
                                    worldState.prosperity_level === 3 ? 'bg-slate-500/20 text-slate-300' :
                                    worldState.prosperity_level === 2 ? 'bg-orange-500/20 text-orange-300' :
                                    'bg-red-500/20 text-red-300'
                                }`}>
                                    Lv{worldState.prosperity_level} {worldState.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <div className="flex justify-between"><span className="text-cyan-400">秩序</span><span className="text-white font-mono">{worldState.order_score ?? 0}</span></div>
                                <div className="flex justify-between"><span className="text-orange-400">混沌</span><span className="text-white font-mono">{worldState.chaos_score ?? 0}</span></div>
                                <div className="flex justify-between"><span className="text-yellow-400">正義</span><span className="text-white font-mono">{worldState.justice_score ?? 0}</span></div>
                                <div className="flex justify-between"><span className="text-rose-400">悪意</span><span className="text-white font-mono">{worldState.evil_score ?? 0}</span></div>
                            </div>
                            <div className="flex justify-between text-blue-200/50 pt-1 border-t border-[#2a4080]/30">
                                <span>支配国: <span className="text-blue-100">{worldState.controlling_nation || 'Neutral'}</span></span>
                                <span>Friction: <span className="text-blue-100">{worldState.last_friction_score ?? '---'}</span></span>
                            </div>
                        </div>
                    )}

                    <div className="w-32 h-1 bg-[#2a4080]/30 rounded-full" />
                </div>
            </div>

            {/* TavernModal - outside game container so fixed positioning works correctly */}
            {userProfile && <TavernModal isOpen={showTavern} onClose={() => setShowTavern(false)} userProfile={userProfile} locationId={userProfile.current_location_id || ''} reputationScore={reputation?.score || 0} locationSlug={locationSlug} />}
        </div>
    );
}

// Vitality枯渇死亡モーダル (spec_v15.1 §3.3)
function VitalityDeathModal({ userProfile, onClose }: { userProfile: any; onClose: () => void }) {
    const router = useRouter();
    const [retiring, setRetiring] = useState(false);
    const [shareText, setShareText] = useState<string | null>(null);

    const ageAtDeath = (userProfile.age || 18) + Math.floor((userProfile.accumulated_days || 0) / 365);
    const deathShareText = `我が名は${userProfile.name || '旅人'}。${ageAtDeath}歳の若さでこの世を去り、英霊として酒場に名を残す。誰か、私の残影を雇ってくれ。 #Wirth_Dawn #英雄の最期`;

    const handleRetire = async () => {
        setRetiring(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const res = await fetch('/api/character/retire', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    'x-user-id': userProfile.id
                },
                body: JSON.stringify({ cause: 'vitality_death', user_id: userProfile.id })
            });
            if (res.ok) {
                setShareText(deathShareText);
            }
        } catch (e) {
            console.error('[VitalityDeathModal] retire failed', e);
        } finally {
            setRetiring(false);
        }
    };

    const handleNewGame = () => {
        router.push('/title');
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-1000">
            <div className="relative w-full max-w-sm mx-4 text-center">

                {/* 死亡演出 */}
                <div className="mb-8 space-y-2">
                    <p className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase animate-pulse">
                        ── Vitality Depleted ──
                    </p>
                    <h2 className="text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-300 to-gray-600">
                        旅人は力尽きた
                    </h2>
                    <p className="text-gray-500 text-sm font-serif italic leading-relaxed">
                        「{userProfile.name || '旅人'}は、{ageAtDeath}年の生涯を全うした。」
                    </p>
                </div>

                {!shareText ? (
                    <div className="space-y-3">
                        <button
                            onClick={handleRetire}
                            disabled={retiring}
                            className="w-full py-3 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-600 text-gray-200 font-bold rounded-lg hover:border-gray-400 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {retiring ? '英霊に昇華中...' : '英霊として名を刻む'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
                        >
                            後で確認する
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
                            <p className="text-xs text-green-400 font-bold mb-3">✦ 英霊として酒場の系譜に刻まれた</p>
                            <XShareButton text={shareText} variant="large" />
                        </div>
                        <button
                            onClick={handleNewGame}
                            className="w-full py-3 bg-amber-900/40 border border-amber-600 text-amber-200 font-bold rounded-lg hover:bg-amber-900/60 transition-all active:scale-95"
                        >
                            新たな旅人として再び立つ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
