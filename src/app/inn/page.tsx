'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { supabase } from '@/lib/supabase';
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
import CreatorsWorkshopBanner from '@/components/inn/CreatorsWorkshopBanner';
import WorkshopModal from '@/components/inn/WorkshopModal';
import QuestBoardModal from '@/components/inn/QuestBoardModal';
import ChronicleModal from '@/components/world/ChronicleModal';
import HistoryArchiveModal from '@/components/inn/HistoryArchiveModal';
import { getNpcForLocation } from '@/lib/getNpcForLocation';
import type { FacilityKey } from '@/data/npcMasterData';

export default function InnPage() {
    const router = useRouter();
    const { gold, spendGold, worldState, fetchWorldState, userProfile, fetchUserProfile, showStatus, setShowStatus, hubState } = useGameStore();

    // UI States
    const [activeModal, setActiveModal] = useState<FacilityType | 'rumors' | 'workshop' | 'history' | 'questBoard' | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAccount, setShowAccount] = useState(false);
    const [showTavern, setShowTavern] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const [showPrayer, setShowPrayer] = useState(false);

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

    // Initial load
    useEffect(() => {
        Promise.all([
            fetchWorldState(),
            useGameStore.getState().fetchUserProfile()
        ]).finally(() => setLoading(false));
    }, []);

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
        if (['map', 'status', 'settings'].includes(facility)) {
            if (facility === 'map') router.push('/world-map');
            if (facility === 'status') setShowStatus(true);
            if (facility === 'settings') setShowAccount(true);
        } else {
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
            alert("ゴールドが不足しています。");
            return;
        }

        try {
            const res = await fetch('/api/inn/rest', { method: 'POST', body: JSON.stringify({ id: userProfile?.id }) });
            if (res.ok) {
                spendGold(cost);
                useGameStore.getState().fetchUserProfile();
                setTimeout(() => alert(`HPが全快しました。\n(宿泊費: ${cost} G)`), 100);
            } else {
                const err = await res.json();
                setTimeout(() => alert(`宿泊できませんでした: ${err.error || '不明なエラー'}`), 100);
            }
        } catch (e) {
            console.error(e);
            setTimeout(() => alert("通信エラーが発生しました。"), 100);
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

            {/* Mobile View Container */}
            <div className="relative w-full max-w-[390px] h-[100dvh] md:h-[844px] bg-[#0a1628] md:border-[6px] md:border-[#1a2d5a] md:rounded-[40px] shadow-2xl overflow-y-auto no-scrollbar flex flex-col pb-10">

                {/* Fixed Header */}
                <InnHeader worldState={worldState} userProfile={userProfile} reputation={reputation} onOpenSettings={() => setShowAccount(true)} onOpenStatus={() => setShowStatus(true)} />

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
                    onOpenRumors={() => { setShowRumorsBadge(false); setActiveModal('rumors'); }}
                    onOpenMap={() => router.push('/world-map')}
                    showHistoryBadge={showHistoryBadge}
                    showRumorsBadge={showRumorsBadge}
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
                        <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('ゴールドを追加しますか？')) return; await fetch('/api/debug/add-gold', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id }) }); useGameStore.getState().fetchUserProfile(); }} className="px-2 py-1 bg-amber-900 border border-amber-500 rounded text-[10px]">Add Gold</button>
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
