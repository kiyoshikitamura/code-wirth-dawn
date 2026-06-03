'use client';

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { getAuthHeaders } from '@/lib/authToken';
import { useInnPageState } from '@/hooks/useInnPageState';
import InnHeader from '@/components/inn/InnHeader';
import MainVisualArea from '@/components/inn/MainVisualArea';
import FacilityGrid, { FacilityType } from '@/components/inn/FacilityGrid';
import NpcDialogModal from '@/components/inn/NpcDialogModal';
import CreatorsWorkshopBanner from '@/components/inn/CreatorsWorkshopBanner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import XShareButton from '@/components/shared/XShareButton';

// モーダル群: ロード時間とチラつきを完全になくすため静的インポート (spec_v27)
import TavernModal from '@/components/inn/TavernModal';
import ShopModal from '@/components/shop/ShopModal';
import PrayerModal from '@/components/world/PrayerModal';
import StatusModal from '@/components/inn/StatusModal';
import AccountSettingsModal from '@/components/inn/AccountSettingsModal';
import GossipModal from '@/components/world/GossipModal';
import QuestBoardModal from '@/components/inn/QuestBoardModal';
import UgcQuestBoardPanel from '@/components/ugc/UgcQuestBoardPanel';
import ChronicleModal from '@/components/world/ChronicleModal';
import HistoryArchiveModal from '@/components/inn/HistoryArchiveModal';
import TutorialModal from '@/components/inn/TutorialModal';
import WorldChangedModal from '@/components/inn/WorldChangedModal';
import CollectionModal from '@/components/collection/CollectionModal';
import QuestLogModal from '@/components/collection/QuestLogModal';
import RankingModal from '@/components/collection/RankingModal';

// デバッグ系: 開発環境のみロード
const QuestTestPanel = dynamic(() => import('@/components/debug/QuestTestPanel'), { ssr: false });
const DebugInventoryPanel = dynamic(() => import('@/components/debug/DebugInventoryPanel'), { ssr: false });
const DebugPartyPanel = dynamic(() => import('@/components/debug/DebugPartyPanel'), { ssr: false });

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
    const state = useInnPageState();
    const {
        router, loading, worldState, userProfile, equipBonus, isHub,
        activeModal, setActiveModal,
        showAccount, setShowAccount,
        showTavern, setShowTavern,
        showShop, setShowShop,
        showPrayer, setShowPrayer,
        showStatus, setShowStatus,
        restLoading,
        traveling,
        toast,
        allQuests, loadingQuests,
        reputation,
        gougaiEvents, handleCloseGougai,
        showTutorial, handleCompleteTutorial,
        showWorldChanged, handleCloseWorldChanged, handleOpenGougaiFromNotify,
        showHistoryBadge,
        showVitalityDeath, setShowVitalityDeath,
        showRestConfirm, setShowRestConfirm,
        locationSlug,
        activeNpcData, buttonText, isDisabled, secondaryActions,
        handleSelectFacility,
        handleDialogAction,
        openHistoryHall,
        executeRest,
        fetchRep,
        returnToHub,
        leaveHub,
    } = state;

    if (loading || !userProfile || !worldState) {
        return (
            <div className="h-screen w-screen text-gray-200 font-sans select-none overflow-hidden bg-[#070e1e] flex justify-center items-center">
                <div className="relative w-full max-w-[390px] h-[100dvh] md:h-[min(844px,92vh)] bg-[#0a1628] md:border-[6px] md:border-[#1a2d5a] md:rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-amber-400/70 font-serif tracking-widest animate-pulse">拠点情報を取得中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen text-gray-200 font-sans select-none overflow-hidden bg-[#070e1e] flex justify-center items-center">

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

            {/* 帰還中オーバーレイ */}
            {traveling && (
                <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-amber-300 text-sm font-serif tracking-widest animate-pulse">移動中...</p>
                </div>
            )}

            {/* Mobile View Container */}
            <div className="relative w-full max-w-[390px] h-[100dvh] md:h-[min(844px,92vh)] bg-[#0a1628] md:border-[6px] md:border-[#1a2d5a] md:rounded-[40px] shadow-2xl overflow-y-auto no-scrollbar flex flex-col pb-10">

                {/* Fixed Header */}
                <InnHeader worldState={worldState} userProfile={userProfile} reputation={reputation} onOpenSettings={() => setShowAccount(true)} onOpenStatus={() => setShowStatus(true)} onOpenShop={() => setShowShop(true)} equipBonus={equipBonus} />

                {/* Vitality枯渇死亡モーダル (spec_v15.1 §3.3) */}
                {showVitalityDeath && userProfile && (
                    <VitalityDeathModal
                        userProfile={userProfile}
                        onClose={() => setShowVitalityDeath(false)}
                    />
                )}

                {/* Tutorial Modal */}
                {showTutorial && (
                    <TutorialModal onComplete={handleCompleteTutorial} />
                )}

                {/* World Changed Notification Popup */}
                {showWorldChanged && (
                    <WorldChangedModal 
                        onOpenGougai={handleOpenGougaiFromNotify} 
                        onClose={handleCloseWorldChanged} 
                    />
                )}

                {/* Gougai Modal */}
                {gougaiEvents.length > 0 && !showWorldChanged && (
                    <ChronicleModal events={gougaiEvents} onClose={handleCloseGougai} />
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


                {activeModal === 'collection' && <CollectionModal onClose={() => setActiveModal(null)} />}
                {activeModal === 'questLog' && <QuestLogModal onClose={() => setActiveModal(null)} />}
                {activeModal === 'ranking' && <RankingModal onClose={() => setActiveModal(null)} />}

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

                {activeModal === 'ugcGuild' && userProfile && (
                    <UgcQuestBoardPanel
                        isOpen={true}
                        onClose={() => setActiveModal(null)}
                        userLevel={userProfile.level || 1}
                        onAccept={(q) => router.push(`/quest/${q.id}?source=ugc`)}
                    />
                )}

                {/* Main Visual */}
                <MainVisualArea
                    worldState={worldState}
                    locationSlug={isHub ? 'loc_hub' : userProfile?.locations?.slug}
                    onOpenHistory={openHistoryHall}
                    onReturnHub={returnToHub}
                    onLeaveHub={leaveHub}
                    onOpenMap={() => router.push('/world-map')}
                    showHistoryBadge={showHistoryBadge}
                    isHub={isHub}
                />

                {/* Facility Grid Navigation */}
                <div className="flex-1 w-full bg-[#0a1628]">
                    <FacilityGrid onSelectFacility={handleSelectFacility} isHub={isHub} />
                    <CreatorsWorkshopBanner
                        isHub={isHub}
                        onOpenWorkshop={() => router.push('/workshop')}
                    />
                </div>

                {/* History Hall */}
                {activeModal === 'history' && userProfile && (
                    <HistoryArchiveModal userId={userProfile.id} onClose={() => setActiveModal(null)} />
                )}

                {/* v27.0: デバッグツール
                    - 本番: デバッグユーザー（adminKey所持）のみ表示
                    - 開発/ローカル: 常に全ユーザーに表示 */}
                <DebugPanelGate
                    userProfile={userProfile}
                    worldState={worldState}
                    router={router}
                    fetchRep={fetchRep}
                />
            </div>

            {/* TavernModal - outside game container */}
            {userProfile && <TavernModal isOpen={showTavern} onClose={() => setShowTavern(false)} userProfile={userProfile} locationId={userProfile.current_location_id || ''} reputationScore={reputation?.score || 0} locationSlug={locationSlug} />}

            {/* v27.0: HP満タン確認ダイアログ */}
            {showRestConfirm && (
                <ConfirmDialog
                    title="休息の確認"
                    variant="warning"
                    message="HPは既に全快です。休息すると1日が経過しますが、それでも休息しますか？（パーティメンバーのHP回復には有効です）"
                    confirmText="休息する"
                    cancelText="キャンセル"
                    onConfirm={executeRest}
                    onCancel={() => setShowRestConfirm(false)}
                />
            )}
        </div>
    );
}

// ── デバッグパネル表示ゲート ──
// 本番: adminKey を localStorage に持つデバッグユーザーのみ表示
// 開発/ローカル: 常に全ユーザーに表示
function DebugPanelGate({ userProfile, worldState, router, fetchRep }: { userProfile: any; worldState: any; router: any; fetchRep: () => Promise<void> }) {
    // Vercelビルド時はNODE_ENVが常にproductionになるため、NEXT_PUBLIC_VERCEL_ENVを優先評価する
    const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV
        ? process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
        : process.env.NODE_ENV === 'production';

    const [hasAdminKey, setHasAdminKey] = useState(false);
    React.useEffect(() => {
        if (!isProduction) return;
        const key = localStorage.getItem('adminKey');
        setHasAdminKey(!!key && key.length >= 16);
    }, [isProduction]);

    // 開発/ローカル → 常に表示
    if (!isProduction) {
        return <DebugPanel userProfile={userProfile} worldState={worldState} router={router} fetchRep={fetchRep} />;
    }

    // 本番 → adminKey が無ければ非表示
    if (!hasAdminKey) return null;
    return <DebugPanel userProfile={userProfile} worldState={worldState} router={router} fetchRep={fetchRep} />;
}

// ── デバッグパネル（UI本体） ──
function DebugPanel({ userProfile, worldState, router, fetchRep }: { userProfile: any; worldState: any; router: any; fetchRep: () => Promise<void> }) {
    return (
        <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[95%] opacity-50 hover:opacity-100 transition-opacity">
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/add-gold', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, amount: 10000 }) }); useGameStore.getState().fetchUserProfile(); }} className="px-2 py-1 bg-amber-900 border border-amber-500 rounded text-[10px]">Add Gold</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/skip-time', { method: 'POST', body: JSON.stringify({ days: 1 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-2 py-1 bg-green-900 border border-green-500 rounded text-[10px]">+1 Day</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/level-up', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, levels: 1 }) }); useGameStore.getState().fetchUserProfile(); }} className="px-2 py-1 bg-blue-900 border border-blue-500 rounded text-[10px]">Lv +1</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/level-up', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, levels: -1 }) }); useGameStore.getState().fetchUserProfile(); }} className="px-2 py-1 bg-blue-900 border border-blue-400 rounded text-[10px]">Lv -1</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/modify-reputation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userProfile?.id, locationName: worldState?.location_name, amount: 100 }) }); await fetchRep(); }} className="px-2 py-1 bg-purple-900 border border-purple-500 rounded text-[10px]">名声+</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/modify-reputation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userProfile?.id, locationName: worldState?.location_name, amount: -100 }) }); await fetchRep(); }} className="px-2 py-1 bg-purple-900 border border-purple-400 rounded text-[10px]">名声-</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'order', amount: 10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-cyan-900 border border-cyan-500 rounded text-[9px]">秩序+</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'order', amount: -10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-cyan-900 border border-cyan-400 rounded text-[9px]">秩序-</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'chaos', amount: 10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-orange-900 border border-orange-500 rounded text-[9px]">混沌+</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'chaos', amount: -10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-orange-900 border border-orange-400 rounded text-[9px]">混沌-</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'justice', amount: 10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-yellow-900 border border-yellow-500 rounded text-[9px]">正義+</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'justice', amount: -10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-yellow-900 border border-yellow-400 rounded text-[9px]">正義-</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'evil', amount: 10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-rose-900 border border-rose-500 rounded text-[9px]">悪意+</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/modify-alignment', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id, type: 'evil', amount: -10 }) }); useGameStore.getState().fetchUserProfile(); useGameStore.getState().fetchWorldState(); }} className="px-1.5 py-1 bg-rose-900 border border-rose-400 rounded text-[9px]">悪意-</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await fetch('/api/debug/run-simulation', { method: 'POST' }); useGameStore.getState().fetchWorldState(); alert('世界変換を実行しました。'); }} className="px-2 py-1 bg-teal-900 border border-teal-500 rounded text-[10px]">世界変換</button>
                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!window.confirm('⚠️ ワールドリセットを実行しますか？\n全てのユーザーデータが削除されます。')) return; await fetch('/api/debug/reset', { method: 'POST', body: JSON.stringify({ userId: userProfile?.id }) }); window.location.href = '/title'; }} className="px-2 py-1 bg-red-900 border border-red-500 rounded text-[10px]">World Reset</button>
            </div>
            {/* バトルテスト */}
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push('/battle-test'); }}
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
    );
}

// Vitality枯渇死亡モーダル (spec_v15.1 §3.3)
function VitalityDeathModal({ userProfile, onClose }: { userProfile: any; onClose: () => void }) {
    const router = useRouter();
    const [retiring, setRetiring] = useState(false);
    const [shareText, setShareText] = useState<string | null>(null);
    const [shareDataList, setShareDataList] = useState<any[]>([]);

    const ageAtDeath = (userProfile.age || 18) + Math.floor((userProfile.accumulated_days || 0) / 365);
    const deathShareText = `我が名は${userProfile.name || '旅人'}。${ageAtDeath}歳の若さでこの世を去り、英霊として酒場に名を残す。誰か、私の残影を雇ってくれ。 #Wirth_Dawn #英雄の最期`;

    const handleRetire = async () => {
        setRetiring(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/character/retire', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({ cause: 'vitality_death', user_id: userProfile.id })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.share_data_list && data.share_data_list.length > 0) {
                    setShareDataList(data.share_data_list);
                    setShareText(data.share_data_list[0].text);
                } else {
                    setShareText(deathShareText);
                }
            }
        } catch (e) {
            console.error('[VitalityDeathModal] retire failed', e);
        } finally {
            setRetiring(false);
        }
    };

    const handleNewGame = () => { router.push('/title'); };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-1000">
            <div className="relative w-full max-w-sm mx-4 text-center">
                <div className="mb-8 space-y-2">
                    <p className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase animate-pulse">── Vitality Depleted ──</p>
                    <h2 className="text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-300 to-gray-600">旅人は力尽きた</h2>
                    <p className="text-gray-500 text-sm font-serif italic leading-relaxed">「{userProfile.name || '旅人'}は、{ageAtDeath}年の生涯を全うした。」</p>
                </div>
                {!shareText ? (
                    <div className="space-y-3">
                        <button onClick={handleRetire} disabled={retiring} className="w-full py-3 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-600 text-gray-200 font-bold rounded-lg hover:border-gray-400 transition-all active:scale-95 disabled:opacity-50">
                            {retiring ? '英霊に昇華中...' : '英霊として名を刻む'}
                        </button>
                        <button onClick={onClose} className="w-full py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors">後で確認する</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
                            <p className="text-xs text-green-400 font-bold mb-3">✦ 英霊として酒場の系譜に刻まれた</p>
                            {shareDataList.length > 0 ? (
                                shareDataList.map((sd: any, idx: number) => {
                                    const shareUrl = typeof window !== 'undefined'
                                        ? `${window.location.origin}/share?t=${sd.slug}&${new URLSearchParams(sd.vars).toString()}`
                                        : undefined;
                                    return <XShareButton key={idx} text={sd.text} shareUrl={shareUrl} variant="large" />;
                                })
                            ) : (
                                <XShareButton text={shareText || ''} variant="large" />
                            )}
                        </div>
                        <button onClick={handleNewGame} className="w-full py-3 bg-amber-900/40 border border-amber-600 text-amber-200 font-bold rounded-lg hover:bg-amber-900/60 transition-all active:scale-95">新たな旅人として再び立つ</button>
                    </div>
                )}
            </div>
        </div>
    );
}
