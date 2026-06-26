'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { getAuthHeaders } from '@/lib/authToken';
import { useInnPageState } from '@/hooks/useInnPageState';
import { soundManager } from '@/lib/soundManager';
import InnHeader from '@/components/inn/InnHeader';
import MainVisualArea from '@/components/inn/MainVisualArea';
import FacilityGrid, { FacilityType } from '@/components/inn/FacilityGrid';
import NpcDialogModal from '@/components/inn/NpcDialogModal';
import CreatorsWorkshopBanner from '@/components/inn/CreatorsWorkshopBanner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import XShareButton from '@/components/shared/XShareButton';
import QuestResultModal from '@/components/quest/QuestResultModal';
import { X } from 'lucide-react';

// モーダル群: ロード時間とチラつきを完全になくすため静的インポート (spec_v27)
import TavernModal from '@/components/inn/TavernModal';
import ShopModal from '@/components/shop/ShopModal';
import PrayerModal from '@/components/world/PrayerModal';
import StatusModal from '@/components/inn/StatusModal';
import AccountSettingsModal from '@/components/inn/AccountSettingsModal';
import GossipModal from '@/components/world/GossipModal';
import QuestBoardModal from '@/components/inn/QuestBoardModal';
import ActiveQuestModal from '@/components/inn/ActiveQuestModal';
import UgcQuestBoardPanel from '@/components/ugc/UgcQuestBoardPanel';
import HistoryArchiveModal from '@/components/inn/HistoryArchiveModal';
import OnboardingAcademyModal from '@/components/inn/OnboardingAcademyModal';
import GuestRegisterPromoModal from '@/components/inn/GuestRegisterPromoModal';
import StarterPackPromoModal from '@/components/inn/StarterPackPromoModal';
import CollectionModal from '@/components/collection/CollectionModal';
import QuestLogModal from '@/components/collection/QuestLogModal';
import RankingModal from '@/components/collection/RankingModal';
import ColosseumModal from '@/components/inn/ColosseumModal';
import AcademyModal from '@/components/inn/AcademyModal';
import BillingModal from '@/components/ui/BillingModal';

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
    const searchParams = useSearchParams();
    const [showGuideBanner, setShowGuideBanner] = useState(true);
    const state = useInnPageState();
    const {
        router, loading, worldState, userProfile, equipBonus, isHub,
        activeModal, setActiveModal,
        showAccount, setShowAccount,
        showTavern, setShowTavern,
        showShop, setShowShop,
        showAcademy, setShowAcademy,
        showPrayer, setShowPrayer,
        showStatus, setShowStatus,
        showBilling, setShowBilling,
        billingDialog, setBillingDialog,
        resultOverlay, setResultOverlay,
        restLoading,
        traveling,
        toast,
        allQuests, loadingQuests,
        reputation,
        showTutorial, handleCompleteTutorial,
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
        onboardingTourStep,
        advanceOnboardingStep,
    } = state;

    const isTourActive = !!(onboardingTourStep && onboardingTourStep !== 'completed');

    // ツアー中に拠点の各施設データをバックグラウンドで先読み（プリフェッチ）
    React.useEffect(() => {
        if (isTourActive) {
            console.log('[Onboarding Tour] Proactively prefetching town data, shop, and inventory...');
            const store = useGameStore.getState();
            store.prefetchTownData(undefined, true);
            store.fetchShop();
            store.fetchInventory();
        }
    }, [isTourActive]);

    const handleSelectFacilityOverride = (facility: FacilityType) => {
        if (isTourActive) {
            if (onboardingTourStep === '6' && facility === 'guild') {
                soundManager?.playSE('se_enter_guild');
                setActiveModal('guild');
            }
            return;
        }
        handleSelectFacility(facility);
    };

    const completedQuests = useGameStore(state => state.completedQuests);
    const partyMembers = useGameStore(state => state.partyMembers);

    const [visitedTavern, setVisitedTavern] = useState(false);
    const [visitedShop, setVisitedShop] = useState(false);
    const [visitedGossip, setVisitedGossip] = useState(false);
    const [visitedMap, setVisitedMap] = useState(false);

    // 新規: 7段階のナビゲーション監視フラグ
    const [visitedGuild, setVisitedGuild] = useState(false);
    const [visitedAcademy, setVisitedAcademy] = useState(false);
    const [visitedStatus, setVisitedStatus] = useState(false);
    const [visitedSettings, setVisitedSettings] = useState(false);
    const [visitedBilling, setVisitedBilling] = useState(false);

    // 新規: プロモーションモーダルの表示ステート
    const [showGuestRegisterPromo, setShowGuestRegisterPromo] = useState(false);
    const [showStarterPackPromo, setShowStarterPackPromo] = useState(false);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            setVisitedTavern(localStorage.getItem('wirth_dawn_visited_tavern') === 'true');
            setVisitedShop(localStorage.getItem('wirth_dawn_visited_shop') === 'true');
            setVisitedGossip(localStorage.getItem('wirth_dawn_visited_gossip') === 'true');
            setVisitedMap(localStorage.getItem('wirth_dawn_visited_map') === 'true');
            setVisitedGuild(localStorage.getItem('wirth_dawn_visited_guild') === 'true');
            setVisitedAcademy(localStorage.getItem('wirth_dawn_visited_academy') === 'true');
            setVisitedStatus(localStorage.getItem('wirth_dawn_visited_status') === 'true');
            setVisitedSettings(localStorage.getItem('wirth_dawn_visited_settings') === 'true');
            setVisitedBilling(localStorage.getItem('wirth_dawn_visited_billing') === 'true');
        }
    }, [showTavern, showShop, showAcademy, showStatus, showAccount, showBilling, activeModal]);

    // モーダル起動時に localStorage に訪問履歴を記録
    React.useEffect(() => {
        if (activeModal === 'questBoard' || activeModal === 'guild') {
            localStorage.setItem('wirth_dawn_visited_guild', 'true');
            setVisitedGuild(true);
        }
    }, [activeModal]);

    React.useEffect(() => {
        if (showAcademy) {
            localStorage.setItem('wirth_dawn_visited_academy', 'true');
            setVisitedAcademy(true);
        }
    }, [showAcademy]);

    React.useEffect(() => {
        if (showStatus) {
            localStorage.setItem('wirth_dawn_visited_status', 'true');
            setVisitedStatus(true);
        }
    }, [showStatus]);

    React.useEffect(() => {
        if (showAccount) {
            localStorage.setItem('wirth_dawn_visited_settings', 'true');
            setVisitedSettings(true);
        }
    }, [showAccount]);

    React.useEffect(() => {
        if (showBilling) {
            localStorage.setItem('wirth_dawn_visited_billing', 'true');
            setVisitedBilling(true);
        }
    }, [showBilling]);

    // プロモーション自動表示 ＆ オンボーディングガイド用フラグリセット一元管理 useEffect (レースコンディション競合防止)
    React.useEffect(() => {
        if (!completedQuests || !userProfile) return;

        const isEp1Cleared = completedQuests.some(q => q.scenario_id === 6001 || String(q.scenario_id) === '6001');

        // 自己修復: 第1話が未クリア（新規ゲーム開始時やデバッグリセット直後）なら
        // localStorage と React ステートの訪問フラグを一括クリアして初期状態に戻す
        if (!isEp1Cleared) {
            localStorage.removeItem('wirth_dawn_onboarding_reset_v3');
            localStorage.removeItem('wirth_dawn_onboarding_reg_reset_v3');
            localStorage.removeItem('wirth_dawn_onboarding_tour_step');
            localStorage.removeItem('wirth_dawn_visited_tavern');
            localStorage.removeItem('wirth_dawn_visited_guild');
            localStorage.removeItem('wirth_dawn_visited_map');
            localStorage.removeItem('wirth_dawn_visited_academy');
            localStorage.removeItem('wirth_dawn_visited_shop');
            localStorage.removeItem('wirth_dawn_visited_billing');
            localStorage.removeItem('wirth_dawn_visited_status');
            localStorage.removeItem('wirth_dawn_visited_settings');

            setVisitedTavern(false);
            setVisitedGuild(false);
            setVisitedMap(false);
            setVisitedAcademy(false);
            setVisitedShop(false);
            setVisitedBilling(false);
            setVisitedStatus(false);
            setVisitedSettings(false);
            return;
        }

        // URLのcodeクエリパラメータが存在しない（＝クリーンアップ完了後）ことを確認して実行
        const hasCode = searchParams.has('code');
        if (hasCode) return;

        // 1. 本登録完了直後の遷移検知 & フラグリセット用パラメータ取得
        const justRegistered = sessionStorage.getItem('wirth_dawn_just_registered');
        const regResetKey = 'wirth_dawn_onboarding_reg_reset_v3';
        const hasRegReset = localStorage.getItem(regResetKey) === 'true';

        // 2. 第1話初回クリア時のリセット用パラメータ取得
        const resetKey = 'wirth_dawn_onboarding_reset_v3';
        const hasReset = localStorage.getItem(resetKey) === 'true';

        let shouldReset = false;
        if (!hasReset) {
            localStorage.setItem(resetKey, 'true');
            shouldReset = true;
        }

        if (justRegistered === 'true' && !userProfile.is_anonymous) {
            if (!hasRegReset) {
                localStorage.setItem(regResetKey, 'true');
                shouldReset = true;
            }
            // 特別パッケージ案内の表示制御
            sessionStorage.removeItem('wirth_dawn_just_registered');
            if (!(userProfile.has_purchased_starter && userProfile.has_purchased_elite)) {
                setShowStarterPackPromo(true);
            }
        }

        if (shouldReset) {
            // localStorage のガイド関連フラグをクリア
            localStorage.removeItem('wirth_dawn_visited_tavern');
            localStorage.removeItem('wirth_dawn_visited_guild');
            localStorage.removeItem('wirth_dawn_visited_map');
            localStorage.removeItem('wirth_dawn_visited_academy');
            localStorage.removeItem('wirth_dawn_visited_shop');
            localStorage.removeItem('wirth_dawn_visited_billing');
            localStorage.removeItem('wirth_dawn_visited_status');
            localStorage.removeItem('wirth_dawn_visited_settings');

            // Reactステートもリセット
            setVisitedTavern(false);
            setVisitedGuild(false);
            setVisitedMap(false);
            setVisitedAcademy(false);
            setVisitedShop(false);
            setVisitedBilling(false);
            setVisitedStatus(false);
            setVisitedSettings(false);
        }

        // 3. クエストクリア直後の帰還検知 (ゲスト / 本登録)
        const questJustCleared = sessionStorage.getItem('wirth_dawn_quest_just_cleared');
        if (questJustCleared === 'true') {
            sessionStorage.removeItem('wirth_dawn_quest_just_cleared');
            if (userProfile.is_anonymous) {
                setShowGuestRegisterPromo(true);
            } else {
                if (!(userProfile.has_purchased_starter && userProfile.has_purchased_elite)) {
                    setShowStarterPackPromo(true);
                }
            }
        }

        // 4. 本登録ユーザーの次回ログイン時のパック案内
        if (!userProfile.is_anonymous && isEp1Cleared) {
            const promoShown = sessionStorage.getItem('wirth_dawn_starter_promo_shown');
            if (!promoShown && !(userProfile.has_purchased_starter && userProfile.has_purchased_elite)) {
                sessionStorage.setItem('wirth_dawn_starter_promo_shown', 'true');
                setShowStarterPackPromo(true);
            }
        }
    }, [completedQuests, userProfile, searchParams]);

    React.useEffect(() => {
        if (showTavern) {
            localStorage.setItem('wirth_dawn_visited_tavern', 'true');
            setVisitedTavern(true);
        }
    }, [showTavern]);

    React.useEffect(() => {
        if (showShop) {
            localStorage.setItem('wirth_dawn_visited_shop', 'true');
            setVisitedShop(true);
        }
    }, [showShop]);

    React.useEffect(() => {
        if (activeModal === 'gossip') {
            localStorage.setItem('wirth_dawn_visited_gossip', 'true');
            setVisitedGossip(true);
        }
    }, [activeModal]);

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

            {/* オンボーディングツアー Step 1〜5 用の画面全体タップ進行用オーバーレイ */}
            {isTourActive && onboardingTourStep !== '6' && (
                <div 
                    onClick={() => {
                        soundManager?.playSE('se_click');
                        advanceOnboardingStep();
                    }}
                    className="fixed inset-0 z-[300] bg-transparent cursor-pointer pointer-events-auto"
                    aria-label="タップして進む"
                />
            )}

            {/* Mobile View Container */}
            <div className="relative w-full max-w-[390px] h-[100dvh] md:h-[min(844px,92vh)] bg-[#0a1628] md:border-[6px] md:border-[#1a2d5a] md:rounded-[40px] shadow-2xl overflow-y-auto no-scrollbar md:custom-scrollbar flex flex-col pb-10">

                {/* Fixed Header */}
                {(() => {
                    const isEp1Cleared = completedQuests?.some(q => q.scenario_id === 6001 || String(q.scenario_id) === '6001') ?? false;
                    
                    const isStatusRecommended = !isTourActive && !!userProfile && (userProfile.level || 1) < 3 && isEp1Cleared && partyMembers.length > 0 && visitedGuild && visitedAcademy && visitedShop && visitedBilling && !visitedStatus;
                    const isSettingsRecommended = !isTourActive && !!userProfile && (userProfile.level || 1) < 3 && isEp1Cleared && partyMembers.length > 0 && visitedGuild && visitedAcademy && visitedShop && visitedBilling && visitedStatus && !visitedSettings;
                    
                    return (
                        <InnHeader 
                            worldState={worldState} 
                            userProfile={userProfile} 
                            reputation={reputation} 
                            onOpenSettings={isTourActive ? undefined : () => setShowAccount(true)} 
                            onOpenStatus={isTourActive ? undefined : () => setShowStatus(true)} 
                            onOpenShop={isTourActive ? undefined : () => setShowShop(true)} 
                            onOpenBilling={isTourActive ? undefined : () => setShowBilling(true)} 
                            equipBonus={equipBonus}
                            isStatusRecommended={isStatusRecommended}
                            isSettingsRecommended={isSettingsRecommended}
                            isTourActive={isTourActive}
                            onboardingTourStep={onboardingTourStep}
                        />
                    );
                })()}



                {/* Main Visual */}
                <MainVisualArea
                    worldState={worldState}
                    locationSlug={isHub ? 'loc_hub' : userProfile?.locations?.slug}
                    onOpenHistory={openHistoryHall}
                    onReturnHub={returnToHub}
                    onLeaveHub={leaveHub}
                    onOpenMap={isTourActive ? undefined : () => {
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('wirth_dawn_visited_map', 'true');
                        }
                        router.push('/world-map');
                    }}
                    onOpenGossip={onboardingTourStep && onboardingTourStep !== 'completed' ? undefined : () => handleSelectFacility('gossip')}
                    showHistoryBadge={showHistoryBadge}
                    showGossipBadge={!visitedGossip}
                    isHub={isHub}
                    isGossipRecommended={(() => {
                        if (isTourActive) return false;
                        if (userProfile && (userProfile.level || 1) >= 3) return false; // Lv3以上バイパス
                        const completedQuests = useGameStore.getState().completedQuests;
                        const isEp1Cleared = completedQuests?.some(q => q.scenario_id === 6001 || String(q.scenario_id) === '6001') ?? false;
                        const clearedCount = completedQuests?.length ?? 0;
                        const visitedTavern = typeof window !== 'undefined' && localStorage.getItem('wirth_dawn_visited_tavern') === 'true';
                        const visitedShop = typeof window !== 'undefined' && localStorage.getItem('wirth_dawn_visited_shop') === 'true';
                        const visitedGossip = typeof window !== 'undefined' && localStorage.getItem('wirth_dawn_visited_gossip') === 'true';
                        return isEp1Cleared && clearedCount >= 2 && visitedTavern && visitedShop && !visitedGossip;
                    })()}
                    isMapRecommended={onboardingTourStep === '5'}
                />

                {/* 目的ガイダンスバナー (Onboarding Banner) */}
                {(() => {
                    if (userProfile && (userProfile.level || 1) >= 3) return null; // Lv3以上バイパス

                    const isEp1Cleared = completedQuests?.some(q => q.scenario_id === 6001 || String(q.scenario_id) === '6001') ?? false;
                    let bannerText = '';
                    let showCloseBtn = true;

                    if (isTourActive) {
                        showCloseBtn = false;
                        if (onboardingTourStep === '1') {
                            bannerText = '「宿屋/酒場」は、一緒に戦う仲間を探せます。';
                        } else if (onboardingTourStep === '2') {
                            bannerText = '「道具屋」は、戦闘に役立つアイテムを確認できます。';
                        } else if (onboardingTourStep === '3') {
                            bannerText = '「魔術学院」は、カードの契約ができます。';
                        } else if (onboardingTourStep === '4') {
                            bannerText = '「ステータス」は、カードや装備品の管理ができます。';
                        } else if (onboardingTourStep === '5') {
                            bannerText = '「出発する」を押すと、隣の街へ移動するためのワールドマップが開きます。';
                        } else if (onboardingTourStep === '6') {
                            bannerText = 'それでは「ギルド」から依頼を見るに進み、クエストの続きを進めましょう！';
                        }
                    } else {
                        if (!isEp1Cleared) {
                            bannerText = 'ギルドで第1話「始まりの轍」を受注しよう！';
                        } else {
                            const isEp2Cleared = completedQuests?.some(q => q.scenario_id === 6002 || String(q.scenario_id) === '6002') ?? false;
                            if (!isEp2Cleared) {
                                const isAtBorderTown = worldState?.location_name === '国境の町' || userProfile?.locations?.slug === 'loc_border_town';
                                if (isAtBorderTown) {
                                    bannerText = 'ギルドの依頼板から、次のメインクエスト「第2話『砂礫の国境線』」を受注しましょう！';
                                } else {
                                    bannerText = '「出発する」からワールドマップを開き、次のメインクエスト発生地「国境の町」へ移動しましょう！';
                                }
                            }
                        }
                    }

                    if (!userProfile.current_quest_id && bannerText && (showGuideBanner || isTourActive)) {
                        return (
                            <div className="mx-4 mt-4 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 shadow-lg shadow-amber-950/20 animate-in slide-in-from-top duration-300">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="text-amber-400 font-bold text-xs flex-shrink-0">💡</span>
                                    <div className="min-w-0 flex-1 flex items-start gap-1.5 text-xs text-slate-300">
                                        <span className="font-bold text-amber-300 whitespace-nowrap flex-shrink-0 mt-0.5">旅の目的:</span>
                                        <span className="font-medium text-slate-100 whitespace-normal break-words">{bannerText}</span>
                                    </div>
                                </div>
                                {showCloseBtn && (
                                    <button 
                                        onClick={() => setShowGuideBanner(false)}
                                        className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 flex-shrink-0"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Facility Grid Navigation */}
                <div className="flex-1 w-full bg-[#0a1628]">
                    {(() => {
                        let recommendedFacility: string | null = null;

                        if (isTourActive) {
                            if (onboardingTourStep === '1') recommendedFacility = 'inn';
                            else if (onboardingTourStep === '2') recommendedFacility = 'shop';
                            else if (onboardingTourStep === '3') recommendedFacility = 'magicAcademy';
                            else if (onboardingTourStep === '4') recommendedFacility = 'status';
                            else if (onboardingTourStep === '6') recommendedFacility = 'guild';
                        } else {
                            const isEp1Cleared = completedQuests?.some(q => q.scenario_id === 6001 || String(q.scenario_id) === '6001') ?? false;
                            if (userProfile && (userProfile.level || 1) >= 3) {
                                recommendedFacility = null;
                            } else if (!isEp1Cleared) {
                                recommendedFacility = 'guild';
                            } else if (!visitedGuild) {
                                recommendedFacility = 'guild';
                            } else if (!visitedAcademy) {
                                recommendedFacility = 'magicAcademy';
                            } else if (!visitedShop || !visitedBilling) {
                                recommendedFacility = 'shop';
                            } else {
                                recommendedFacility = null;
                            }
                        }

                        return (
                            <FacilityGrid 
                                onSelectFacility={handleSelectFacilityOverride} 
                                isHub={isHub} 
                                recommendedFacility={recommendedFacility}
                                isTourActive={isTourActive}
                            />
                        );
                    })()}
                    <CreatorsWorkshopBanner
                        isHub={isHub}
                        onOpenWorkshop={isTourActive ? () => {} : () => router.push('/workshop')}
                    />
                </div>



                {/* v27.0: デバッグツール
                    - 本番: デバッグユーザー（adminKey所持）のみ表示
                    - 開発/ローカル: 常に全ユーザーに表示 */}
                <DebugPanelGate
                    userProfile={userProfile}
                    worldState={worldState}
                    router={router}
                    fetchRep={fetchRep}
                />

                {/* フッター: コピーライト + 法的リンク */}
                <div className="mt-6 mb-2 pt-4 border-t border-slate-800/40 space-y-2 text-center flex-shrink-0">
                    <div className="flex justify-center gap-3 flex-wrap">
                        <Link href="/legal/terms" className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">利用規約</Link>
                        <Link href="/legal/privacy" className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">プライバシー</Link>
                        <Link href="/legal/tokusho" className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">特商法表記</Link>
                        <Link href="/legal/credits" className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">権利表記</Link>
                        <a href="https://x.com/kitamu2026" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">公式X</a>
                    </div>
                    <div className="text-[9px] text-slate-600">© 2026 Code: Wirth-Dawn</div>
                </div>
            </div>

            {/* TavernModal - outside game container */}
            {userProfile && showTavern && (
                <TavernModal
                    isOpen={showTavern}
                    onClose={() => setShowTavern(false)}
                    userProfile={userProfile}
                    locationId={userProfile.current_location_id || ''}
                    reputationScore={reputation?.score || 0}
                    locationSlug={locationSlug}
                />
            )}

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

            {/* 決済反映完了ダイアログ */}
            {billingDialog && (
                <ConfirmDialog
                    title={billingDialog.title}
                    message={billingDialog.message}
                    confirmText="閉じる"
                    singleButton={true}
                    onConfirm={() => {
                        soundManager?.playSE('se_click');
                        setBillingDialog(null);
                    }}
                />
            )}

            {/* Quest Result Overlay (ギルドでの放棄結果用) */}
            {resultOverlay && (
                <QuestResultModal
                    result={resultOverlay.result}
                    questTitle={resultOverlay.data?.quest_title || '放棄した依頼'}
                    rewards={resultOverlay.data?.rewards || {}}
                    changes={resultOverlay.data?.changes || {
                        gold_gained: 0,
                        old_age: userProfile?.age || 18,
                        new_age: userProfile?.age || 18,
                        aged_up: false,
                        vit_penalty: resultOverlay.data?.penalty?.vit || 1,
                        atk_decay: 0,
                        def_decay: 0,
                    }}
                    daysPassed={resultOverlay.data?.days_passed || 0}
                    repChange={resultOverlay.data?.penalty?.reputation ? {
                        amount: resultOverlay.data.penalty.reputation,
                        location: resultOverlay.data.penalty.location || '現在地'
                    } : null}
                    onClose={async () => {
                        // クエストボードのキャッシュクリア
                        useGameStore.setState({ locationQuests: null, lastInitPageFetchTime: 0 });
                        if (typeof window !== 'undefined' && userProfile?.current_location_id) {
                            sessionStorage.removeItem(`location_quests_cache_${userProfile.current_location_id}`);
                        }
                        // プロフィールフェッチ
                        await useGameStore.getState().fetchUserProfile();
                        // モーダルを閉じる
                        setResultOverlay(null);
                        setActiveModal(null);
                    }}
                />
            )}

            {/* Vitality枯渇死亡モーダル (spec_v15.1 §3.3) */}
            {showVitalityDeath && userProfile && (
                <VitalityDeathModal
                    userProfile={userProfile}
                    onClose={() => setShowVitalityDeath(false)}
                />
            )}

            {/* Onboarding Academy Modal */}
            {showTutorial && (
                <OnboardingAcademyModal />
            )}

            {/* Guest Register Promotion Modal */}
            {showGuestRegisterPromo && (
                <GuestRegisterPromoModal onClose={() => setShowGuestRegisterPromo(false)} />
            )}

            {/* Starter Pack / Elite Pack Promotion Modal */}
            {showStarterPackPromo && (
                <StarterPackPromoModal 
                    onClose={() => setShowStarterPackPromo(false)} 
                    onOpenBilling={() => setShowBilling(true)}
                />
            )}

            {/* NPC Dialog */}
            {activeNpcData && activeModal && (
                <NpcDialogModal
                    key={activeModal}
                    npcData={activeNpcData}
                    onClose={() => setActiveModal(null)}
                    onAction={() => {
                        if (isTourActive && onboardingTourStep === '6' && activeModal === 'guild') {
                            if (typeof window !== 'undefined') {
                                localStorage.setItem('wirth_dawn_onboarding_tour_step', 'completed');
                                localStorage.setItem('wirth_dawn_visited_map', 'true');
                                localStorage.setItem('wirth_dawn_visited_tavern', 'true');
                                localStorage.setItem('wirth_dawn_visited_guild', 'true');
                                localStorage.setItem('wirth_dawn_visited_shop', 'true');
                                localStorage.setItem('wirth_dawn_visited_academy', 'true');
                                localStorage.setItem('wirth_dawn_visited_settings', 'true');
                                localStorage.setItem('wirth_dawn_visited_billing', 'true');
                                localStorage.setItem('wirth_dawn_visited_status', 'true');
                            }
                            setVisitedMap(true);
                            setVisitedTavern(true);
                            setVisitedGuild(true);
                            setVisitedShop(true);
                            setVisitedAcademy(true);
                            setVisitedSettings(true);
                            setVisitedBilling(true);
                            setVisitedStatus(true);
                            advanceOnboardingStep();
                        }
                        handleDialogAction(activeModal as FacilityType);
                    }}
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
            {showAcademy && <AcademyModal onClose={() => setShowAcademy(false)} onOpenBilling={() => setShowBilling(true)} />}
            {showPrayer && userProfile && <PrayerModal onClose={() => setShowPrayer(false)} locationId={userProfile.current_location_id || ''} locationName={worldState?.location_name || ''} />}
            {showAccount && <AccountSettingsModal onClose={() => setShowAccount(false)} />}
            {showStatus && <StatusModal onClose={() => setShowStatus(false)} />}
            {showBilling && <BillingModal onClose={() => setShowBilling(false)} />}

            {activeModal === 'collection' && <CollectionModal onClose={() => setActiveModal(null)} />}
            {activeModal === 'questLog' && <QuestLogModal onClose={() => setActiveModal(null)} />}
            {activeModal === 'ranking' && <RankingModal onClose={() => setActiveModal(null)} />}
            {activeModal === 'colosseum' && <ColosseumModal onClose={() => setActiveModal(null)} />}

            {/* Global Forced Active Quest Modal */}
            {userProfile?.current_quest_id && (
                <ActiveQuestModal
                    isOpen={true}
                    onClose={() => {}}
                    userProfile={userProfile}
                    quests={allQuests}
                    isLoading={loadingQuests}
                    onSelect={(s) => {
                        const isColosseum = s.id ? String(s.id).startsWith('colosseum_') : false;
                        const isUgc = !isColosseum && ((s as any).is_ugc || isNaN(Number(s.id)));
                        router.push(isUgc ? `/quest/${s.id}?source=ugc` : `/quest/${s.id}`);
                    }}
                    onGiveUpComplete={async (data) => {
                        // 楽観的ローカルクリア: 即座にフラグを解除してモーダルを消す
                        const profile = useGameStore.getState().userProfile;
                        if (profile) {
                            useGameStore.setState({
                                userProfile: {
                                    ...profile,
                                    current_quest_id: undefined,
                                    current_quest_state: undefined
                                }
                            });
                        }
                        // 最新情報を非同期フェッチして同期
                        await useGameStore.getState().fetchUserProfile();
                        setResultOverlay({ result: 'failure', data });
                    }}
                    showCloseButton={false}
                />
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

            {activeModal === 'ugcGuild' && userProfile && (
                <UgcQuestBoardPanel
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    userLevel={userProfile.level || 1}
                    onAccept={(q) => router.push(`/quest/${q.id}?source=ugc`)}
                />
            )}

            {/* History Hall */}
            {activeModal === 'history' && userProfile && (
                <HistoryArchiveModal userId={userProfile.id} onClose={() => setActiveModal(null)} />
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
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const [retiring, setRetiring] = useState(false);
    const [shareText, setShareText] = useState<string | null>(null);
    const [shareDataList, setShareDataList] = useState<any[]>([]);

    const ageAtDeath = (userProfile.age || 18) + Math.floor((userProfile.accumulated_days || 0) / 365);
    const deathShareText = `我が名は${userProfile.name || '旅人'}。${ageAtDeath}歳の若さでこの世を去り、英霊として酒場に名を残す。誰か、私の残影を雇ってくれ。 #WirthDawn #CWD #英雄の最期`;

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

    if (!mounted) return null;

    return createPortal(
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
        </div>,
        document.body
    );
}
