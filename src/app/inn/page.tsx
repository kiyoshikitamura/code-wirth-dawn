'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { Scenario, Enemy } from '@/types/game';
import { Scroll, ArrowLeft, AlertOctagon } from 'lucide-react';
import WorldNews from '../components/WorldNews';
import { getBackgroundByAttribute } from '@/utils/visuals';
import { supabase } from '@/lib/supabase';
import MobileNav from '@/components/layout/MobileNav';
import QuestModal from '@/components/quest/QuestModal';
import TavernModal from '@/components/inn/TavernModal';
import ShopModal from '@/components/shop/ShopModal';
import PrayerModal from '@/components/world/PrayerModal';
import QuestResultModal from '@/components/quest/QuestResultModal';
import StatusModal from '@/components/inn/StatusModal';
import InnHeader from '@/components/inn/InnHeader';
import InnNavigation from '@/components/inn/InnNavigation';
import QuestBoard from '@/components/inn/QuestBoard';

export default function InnPage() {
    const router = useRouter();
    const { selectScenario, gold, spendGold, worldState, fetchWorldState, userProfile, showStatus, setShowStatus } = useGameStore();
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [npcMessage, setNpcMessage] = useState('');
    const [reqStatus, setReqStatus] = useState<'Idle' | 'Success' | 'Error'>('Idle');
    const [reputation, setReputation] = useState<any>(null);
    const [selectedQuest, setSelectedQuest] = useState<any | null>(null);
    const [showTavern, setShowTavern] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const [showPrayer, setShowPrayer] = useState(false);
    const [riskConfirmQuest, setRiskConfirmQuest] = useState<any | null>(null);
    const [questResult, setQuestResult] = useState<any | null>(null);

    // --- News & History Logic ---
    const [showNews, setShowNews] = useState(false);
    const [currentNews, setCurrentNews] = useState<any>(null); // WorldHistory
    const [historyList, setHistoryList] = useState<any[]>([]);
    const [showHistoryHall, setShowHistoryHall] = useState(false);

    useEffect(() => {
        async function checkNews() {
            try {
                const res = await fetch('/api/history?limit=1');
                if (res.ok) {
                    const { history } = await res.json();
                    if (history && history.length > 0) {
                        const latest = history[0];
                        const lastSeenId = localStorage.getItem('last_news_id');
                        if (latest.id !== lastSeenId) {
                            setCurrentNews(latest);
                            setShowNews(true);
                            // Don't save yet, save on close
                        }
                    }
                }
            } catch (e) { console.error("News check failed", e); }
        }
        checkNews();
    }, []);

    const closeNews = () => {
        if (currentNews) {
            localStorage.setItem('last_news_id', currentNews.id);
        }
        setShowNews(false);
        setCurrentNews(null);
    };

    const openHistoryHall = async () => {
        try {
            const res = await fetch('/api/history?limit=20');
            if (res.ok) {
                const { history } = await res.json();
                setHistoryList(history);
                setShowHistoryHall(true);
            }
        } catch (e) {
            alert("歴史の読み込みに失敗しました。");
        }
    };

    const handleReset = async () => {
        if (!confirm("【警告】世界と所持品を全て初期化します。よろしいですか？")) return;
        try {
            await fetch('/api/debug/reset', { method: 'POST' });
            localStorage.removeItem('game-storage');
            alert("世界は再構成されました。新たな旅が始まります。");
            window.location.href = '/title'; // Go to explicit Title/Entry page
        } catch (e: any) {
            console.error(e);
            alert(`初期化失敗: ${e.message || 'Unknown Error'}`);
        }
    };

    const handleRest = async () => {
        setNpcMessage("「ゆっくりお休み。いい夢を。」");
        try {
            const res = await fetch('/api/inn/rest', {
                method: 'POST',
                body: JSON.stringify({ id: userProfile?.id })
            });
            if (res.ok) {
                alert("HPとMPが全快しました。");
                useGameStore.getState().fetchUserProfile();
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        async function fetchScenarios() {
            try {
                const res = await fetch('/api/scenarios', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    console.log("[InnPage] Fetched Scenarios:", data);
                    setScenarios(data);
                }
            } catch (e) {
                console.error("[InnPage] Fetch Error:", e);
            } finally {
                setLoading(false);
            }
        }

        fetchWorldState(); // Ensure we have world state for NPC
        fetchScenarios();

        async function loadProfile() {
            await useGameStore.getState().fetchUserProfile();
            const p = useGameStore.getState().userProfile;
            console.log("[InnPage] User Profile:", p);
        }
        loadProfile();
    }, []);

    const handleSelect = (s: any) => {
        // Risk Check Logic
        const userLevel = userProfile?.level || 1;
        const recLevel = s.rec_level || 1;

        if (recLevel > userLevel) {
            setRiskConfirmQuest(s);
            return;
        }
        setSelectedQuest(s);
    };

    const confirmRisk = () => {
        if (riskConfirmQuest) {
            setSelectedQuest(riskConfirmQuest);
            setRiskConfirmQuest(null);
        }
    };

    const handleQuestComplete = async (resultStatusArg: any, historyArg: any[] = []) => {
        console.log("[InnPage] Quest Complete Result:", resultStatusArg, "Submitting:", isSubmitting);
        if (isSubmitting) return;

        if (!selectedQuest || !userProfile) {
            console.error("[InnPage] Missing Quest or User Profile:", { selectedQuest, userProfile });
            return;
        }

        setIsSubmitting(true);

        const resultStatus = resultStatusArg === 'success' ? 'success' : 'failure';

        try {
            console.log("[InnPage] Sending Quest Complete Request:", { quest_id: selectedQuest.id, user_id: userProfile.id, result: resultStatus });

            const res = await fetch('/api/quest/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quest_id: selectedQuest.id,
                    user_id: userProfile.id,
                    result: resultStatus,
                    history: historyArg || []
                })
            });

            const data = await res.json();
            console.log("[InnPage] API Response:", data);

            if (res.ok && data.success) {
                setQuestResult({
                    changes: data.changes || {},
                    rewards: data.rewards,
                    daysPassed: data.days_passed || 0
                });
            } else {
                console.error("[InnPage] API Error:", data.error || "Unknown Error");
                alert(`結果の保存に失敗しました。\n${data.error || '不明なエラー'}`);
            }
        } catch (e) {
            console.error("[InnPage] Network/Logic Error:", e);
            alert("通信エラーが発生しました。");
        } finally {
            setIsSubmitting(false);
            setSelectedQuest(null);
            useGameStore.getState().fetchUserProfile();
            fetchWorldState(); // Update impacts
        }
    };

    const [initialNodeId, setInitialNodeId] = useState<string | undefined>(undefined);

    // Battle Return Handler
    useEffect(() => {
        const pending = localStorage.getItem('pending_quest');
        console.log("[InnPage] Checking pending_quest:", pending ? "Found" : "None");
        if (pending) {
            try {
                const { quest, nextNodeId } = JSON.parse(pending);

                // Check URL params for battle result
                const urlParams = new URLSearchParams(window.location.search);
                const result = urlParams.get('battle_result');

                console.log("[InnPage] Battle Result Param:", result);

                if (result === 'win') {
                    console.log("Resuming quest after victory:", quest.title);
                    setSelectedQuest(quest);
                    setInitialNodeId(nextNodeId); // Resume at success node

                    // Clear pending status eventually, or ideally immediately but logic might re-trigger if params stay
                    localStorage.removeItem('pending_quest');
                    window.history.replaceState({}, '', '/inn'); // Clean URL
                } else if (result === 'lose' || result === 'escape') {
                    // Just clear pending
                    localStorage.removeItem('pending_quest');
                    window.history.replaceState({}, '', '/inn');
                    // Maybe show a toast
                }
            } catch (e) {
                console.error("Failed to parse pending quest", e);
                localStorage.removeItem('pending_quest');
            }
        }
    }, [scenarios]); // Dependency? On mount is ok.

    const handleBattleStart = async (scenario: any, enemyId: string, successNodeId?: string) => {
        // Default Enemy
        let enemy: Enemy = { id: 'slime', name: 'スライム', hp: 50, maxHp: 50, level: 1 };

        // 1. Try to fetch specific enemy if ID provided
        if (enemyId && enemyId !== 'slime') {
            try {
                // Check if it's a group first
                const { data: groupData } = await supabase
                    .from('enemy_groups')
                    .select('*')
                    .eq('slug', enemyId)
                    .maybeSingle();

                let targetSlug = enemyId;
                if (groupData && groupData.members && groupData.members.length > 0) {
                    targetSlug = groupData.members[0]; // Pick first member for now
                }

                // Fetch Enemy Data
                const { data: enemyData } = await supabase
                    .from('enemies')
                    .select('*')
                    .eq('slug', targetSlug)
                    .maybeSingle();

                if (enemyData) {
                    enemy = {
                        id: enemyData.slug, // Use slug as ID for engine lookup compatibility
                        name: enemyData.name,
                        hp: enemyData.hp,
                        maxHp: enemyData.hp,
                        level: Math.floor(enemyData.hp / 10) || 1, // Rough estimate if level missing
                        image: `/enemies/${enemyData.slug}.png`
                    };
                }
            } catch (e) {
                console.error("Failed to fetch enemy data:", e);
            }
        }
        // Legacy Fallbacks
        else {
            if (scenario.title.includes('退治')) {
                enemy = { id: 'slime', name: 'スライム', hp: 80, maxHp: 80, level: 1 };
            }
            if (scenario.title.includes('ドラゴン')) {
                enemy = { id: 'dragon', name: 'ドラゴン', hp: 500, maxHp: 500, level: 10 };
            }
        }

        // PERSIST STATE
        if (successNodeId) {
            console.log("[InnPage] Setting pending_quest:", { quest: scenario.title, nextNodeId: successNodeId });
            localStorage.setItem('pending_quest', JSON.stringify({
                quest: scenario,
                nextNodeId: successNodeId,
                timestamp: Date.now()
            }));
        }

        // Show loader overlay immediately to block interactions
        setIsNavigatingToBattle(true);

        console.log("[InnPage] Calling startBattle...");
        await useGameStore.getState().startBattle(enemy);
        console.log("[InnPage] Navigating to /battle...");
        router.push('/battle');
    };

    // Reputation Logic
    useEffect(() => {
        async function fetchRep() {
            if (!userProfile?.id || !worldState?.location_name) return;
            const { data } = await supabase
                .from('reputations')
                .select('*')
                .eq('user_id', userProfile.id)
                .eq('location_name', worldState.location_name)
                .maybeSingle();
            setReputation(data || { rank: 'Stranger', score: 0 });
        }
        fetchRep();
    }, [userProfile, worldState]);

    // NPC Dialogue Logic
    const [isThinking, setIsThinking] = useState(false);
    const [isNavigatingToBattle, setIsNavigatingToBattle] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!worldState) return;

        setIsThinking(true);
        setNpcMessage('');

        const timer = setTimeout(() => {
            const rank = reputation?.rank || 'Stranger';
            const messages = [];

            if (rank === 'Hero') {
                messages.push("いらっしゃいませ、英雄様！ 当店をご利用いただけるとは光栄です。", "お困りのことがあれば何でも言ってください！");
            } else if (rank === 'Famous') {
                messages.push("噂は聞いてますよ。腕利きの旅人さんですね。", "いつもご贔屓に。良い品、入ってますよ。");
            } else if (rank === 'Criminal') {
                messages.push("...ちっ。また来たのか。", "あんたには売る酒はねえよ。さっさと出ていきな。", "衛兵を呼ぶ前に消えるんだな。");
            } else if (rank === 'Rogue') {
                messages.push("金さえ払えば客だが...妙な真似はするなよ。", "あんまり目立った行動は控えるこったな。");
            } else {
                messages.push("いらっしゃい。旅の方ですね。", "空き部屋はあるよ。ゆっくりしていきな。", "この辺りの地理には詳しいかい？");
            }

            const nation = worldState.controlling_nation || 'Neutral';
            if (nation === 'Roland') messages.push("光の加護があらんことを。", "今日は教会の鐘がよく響くねえ。");
            if (nation === 'Markand') messages.push("儲かってるかい？", "金さえあれば何でも買える、いい街だろう？");
            if (nation === 'Karyu') messages.push("規律を乱す奴等は許さねえ。", "強い酒が入ったぞ。");
            if (nation === 'Yato') messages.push("...静かに飲んでくれよ。", "霧が濃くなってきたな...");

            setNpcMessage(messages[Math.floor(Math.random() * messages.length)]);
            setIsThinking(false);
        }, 600); // "..." Duration

        return () => clearTimeout(timer);
    }, [worldState?.controlling_nation, reputation?.rank]); // Constrain dependencies

    // Helper for Theme
    const getThemeColors = () => {
        const nation = worldState?.controlling_nation || 'Neutral';
        switch (nation) {
            case 'Roland': return { border: 'border-blue-700/50', text: 'text-blue-100', accent: 'text-blue-500', bg: 'bg-blue-950/40' };
            case 'Markand': return { border: 'border-yellow-700/50', text: 'text-yellow-100', accent: 'text-yellow-500', bg: 'bg-yellow-950/40' };
            case 'Karyu': return { border: 'border-emerald-700/50', text: 'text-emerald-100', accent: 'text-emerald-500', bg: 'bg-emerald-950/40' };
            case 'Yato': return { border: 'border-purple-700/50', text: 'text-purple-100', accent: 'text-purple-500', bg: 'bg-purple-950/40' };
            default: return { border: 'border-gold-700/50', text: 'text-gold-100', accent: 'text-gold-500', bg: 'bg-black/40' };
        }
    };
    const theme = getThemeColors();

    // Governance Text moved to InnHeader

    // Status Display Map
    const STATUS_MAP: Record<string, string> = {
        'Zenith': '絶頂',
        'Prosperous': '繁栄',
        'Stagnant': '停滞',
        'Declining': '衰退',
        'Ruined': '崩壊',
        '繁栄': '繁栄', '衰退': '衰退', '崩壊': '崩壊'
    };

    return (
        <div className="min-h-screen text-gray-200 font-sans p-4 relative">
            {/* 1. Base Dark Background (Always behind everything) */}
            <div className="fixed inset-0 z-0 bg-navy-900"></div>

            {/* 2. Dynamic Background Image (Fade in/out) */}
            {(() => {
                // Prioritize local mapping based on attribute if available to fix stale DB URLs
                // Fallback to worldState.background_url, then DEFAULT
                const attributeName = worldState?.attribute_name;
                const localMappedUrl = attributeName ? getBackgroundByAttribute(attributeName) : null;

                const bgUrl = localMappedUrl || worldState?.background_url;
                const validBgUrl = (bgUrl && (bgUrl.startsWith('http') || bgUrl.startsWith('/')))
                    ? bgUrl
                    : '/backgrounds/default.jpg';

                return (
                    <div
                        className="fixed inset-0 z-[1] transition-all duration-[2000ms] ease-in-out bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${validBgUrl})`
                        }}
                    ></div>
                );
            })()}

            {/* Status Visual Effects */}
            {(() => {
                const s = worldState?.status || 'Prosperous';
                if (s === 'Declining' || s === '衰退') {
                    return <div className="fixed inset-0 z-[1] bg-[url('/effects/dirt.png')] opacity-40 mix-blend-multiply pointer-events-none"></div>;
                }
                if (s === 'Ruined' || s === '崩壊') {
                    return (
                        <>
                            <div className="fixed inset-0 z-[1] bg-black/60 pointer-events-none"></div>
                            <div className="fixed inset-0 z-[1] bg-gradient-to-t from-red-900/40 to-transparent mix-blend-overlay pointer-events-none"></div>
                        </>
                    );
                }
                if (s === 'Zenith') {
                    return <div className="fixed inset-0 z-[1] bg-yellow-500/10 mix-blend-overlay pointer-events-none"></div>;
                }
                return null;
            })()}

            {/* 3. Dark Overlay (To make text readable) */}
            <div className="fixed inset-0 z-[2] bg-black/40 transition-opacity duration-1000"></div>

            {/* 4. Noise Pattern (Texture) */}
            <div className="fixed inset-0 z-[3] bg-noise-pattern opacity-30 pointer-events-none mix-blend-overlay"></div>

            {/* 5. Vignette */}
            <div className="fixed inset-0 z-[3] bg-[radial-gradient(circle_at_center,_transparent_10%,_#000000_90%)] opacity-60 pointer-events-none"></div>

            {/* Battle Transition Overlay */}
            {isNavigatingToBattle && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="text-red-500 font-serif text-3xl animate-pulse tracking-widest mb-4">BATTLE START</div>
                    <div className="w-16 h-16 border-4 border-red-900 border-t-red-500 rounded-full animate-spin"></div>
                </div>
            )}

            {/* 6. Content Container (Must be z-10 or higher to sit above BG layers) */}
            <div className="relative z-10 p-4">

                {/* News Modal (z-50 handled by modal itself usually, but let's ensure it's inside this relative container or portal) */}
                {selectedQuest && (
                    <QuestModal
                        scenario={selectedQuest}
                        onClose={() => { setSelectedQuest(null); setInitialNodeId(undefined); }}
                        onComplete={handleQuestComplete}
                        onBattleStart={handleBattleStart}
                        initialNodeId={initialNodeId}
                    />
                )}

                {showNews && currentNews && (
                    <WorldNews history={currentNews} onClose={closeNews} />
                )}

                {/* History Hall Modal */}
                {showHistoryHall && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#2a221b] border border-[#a38b6b] p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl relative">
                            <button onClick={() => setShowHistoryHall(false)} className="absolute top-2 right-2 text-gray-400 hover:text-white">✕</button>
                            <h2 className="text-2xl font-serif text-gold-500 mb-6 text-center border-b border-[#a38b6b] pb-2">世界の記憶</h2>
                            <div className="space-y-3">
                                {historyList.map(h => (
                                    <div
                                        key={h.id}
                                        onClick={() => { setCurrentNews(h); setShowNews(true); }} // Open News Modal on top
                                        className="p-3 bg-black/30 hover:bg-gold-900/20 border border-transparent hover:border-gold-600/30 cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>{h.occured_at ? new Date(h.occured_at).toLocaleDateString() : '-'}</span>
                                            <span className="group-hover:text-gold-400">閲覧 &gt;</span>
                                        </div>
                                        <div className="font-bold text-gray-200 group-hover:text-white font-serif">{h.headline}</div>
                                    </div>
                                ))}
                                {historyList.length === 0 && <div className="text-center text-gray-500 py-4">歴史はまだ刻まれていません。</div>}
                            </div>
                        </div>
                    </div>
                )}

                {userProfile && (
                    <TavernModal
                        isOpen={showTavern}
                        onClose={() => setShowTavern(false)}
                        userProfile={userProfile}
                        locationId={userProfile.current_location_id || 'loc_hub'}
                    />
                )}

                {showShop && <ShopModal onClose={() => setShowShop(false)} />}
                {showPrayer && userProfile && (
                    <PrayerModal
                        onClose={() => setShowPrayer(false)}
                        locationId={userProfile.current_location_id || ''}
                        locationName={worldState?.location_name || ''}
                    />
                )}

                {/* Risk Confirmation Modal */}
                {riskConfirmQuest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#1a0f0f] border-2 border-red-800 w-full max-w-md shadow-2xl relative p-6 text-center">
                            <AlertOctagon className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
                            <h2 className="text-2xl font-serif font-bold text-red-500 mb-2">危険な依頼です</h2>
                            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                                このクエストの推奨レベルは <span className="text-red-400 font-bold text-lg">Lv.{riskConfirmQuest.rec_level}</span> です。<br />
                                現在のあなたのレベル ({userProfile?.level || 1}) では、<br />
                                <span className="text-red-400 font-bold">死亡や寿命(Vit)の喪失</span>のリスクが非常に高いです。
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setRiskConfirmQuest(null)}
                                    className="bg-gray-800 border border-gray-600 text-gray-300 py-3 rounded hover:bg-gray-700 transition-colors"
                                >
                                    やめる
                                </button>
                                <button
                                    onClick={confirmRisk}
                                    className="bg-red-900/50 border border-red-600 text-red-200 py-3 rounded hover:bg-red-800 transition-colors font-bold"
                                >
                                    それでも挑む
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <InnHeader
                    worldState={worldState}
                    userProfile={userProfile}
                    reputation={reputation}
                />

                <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pb-20 md:pb-0">

                    {/* Left Column: NPC & Shop */}
                    <div className="space-y-4 md:space-y-8 order-1">
                        {/* NPC Area */}
                        <section className={`${theme.bg} p-4 md:p-6 rounded-sm border-l-4 ${theme.border.replace('/50', '')} relative shadow-lg`}>
                            <div className="flex gap-4">
                                <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-black border border-white/10 overflow-hidden rounded-sm">
                                    <img src="/avatars/inn_master.png" alt="Master" className="w-full h-full object-cover opacity-80" />
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-amber-400 font-bold text-sm mb-1">宿屋の主人</div>
                                    <p className={`font-serif italic ${theme.text} leading-relaxed min-h-[3rem] text-sm md:text-base flex items-center`}>
                                        {isThinking ? (
                                            <span className="animate-pulse tracking-widest text-xl opacity-70">......</span>
                                        ) : (
                                            `「${npcMessage || '...'}」`
                                        )}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={openHistoryHall}
                                className={`absolute bottom-2 right-2 text-xs ${theme.accent} hover:text-white flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity p-2`}
                            >
                                <Scroll className="w-3 h-3" /> 歴史を紐解く
                            </button>
                            <button
                                onClick={handleRest}
                                className={`absolute top-2 right-2 text-xs text-green-400 hover:text-white flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity p-2 border border-green-900/50 rounded bg-black/40`}
                            >
                                💤 休息する (HP/MP回復)
                            </button>
                        </section>

                        <InnNavigation
                            onOpenTavern={() => setShowTavern(true)}
                            onOpenShop={() => setShowShop(true)}
                            onOpenStatus={() => setShowStatus(true)}
                            onOpenPrayer={() => setShowPrayer(true)}
                            theme={theme}
                        />
                    </div>

                    {/* Right Column: Quest Board */}
                    <div className="order-2">
                        <QuestBoard
                            scenarios={scenarios}
                            loading={loading}
                            userLevel={userProfile?.level || 1}
                            onSelect={handleSelect}
                        />
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <MobileNav />

                <div className="text-center mt-12 space-y-4">
                    {/* Debug Section */}
                    <div className="flex flex-wrap justify-center gap-4 border-t border-gray-800 pt-8">
                        <button
                            onClick={handleReset}
                            className="bg-red-900/20 text-red-500 border border-red-900 px-3 py-1 text-xs hover:bg-red-900/50"
                        >
                            [DEBUG] World Reset
                        </button>
                        <button
                            onClick={async () => { await fetch('/api/debug/skip-time', { method: 'POST' }); fetchWorldState(); }}
                            className="bg-blue-900/20 text-blue-500 border border-blue-900 px-3 py-1 text-xs hover:bg-blue-900/50"
                        >
                            [DEBUG] Skip Day
                        </button>
                        <button
                            onClick={async () => { await useGameStore.getState().addGold(1000); }}
                            className="bg-yellow-900/20 text-yellow-500 border border-yellow-900 px-3 py-1 text-xs hover:bg-yellow-900/50"
                        >
                            [DEBUG] +1000 G
                        </button>
                        <button
                            onClick={async () => {
                                await fetch('/api/reputation/debug', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userId: userProfile?.id, location: worldState?.location_name, amount: 10 })
                                });
                                useGameStore.getState().fetchUserProfile();
                            }}
                            className="bg-purple-900/20 text-purple-500 border border-purple-900 px-3 py-1 text-xs hover:bg-purple-900/50"
                        >
                            [DEBUG] +Rep
                        </button>
                    </div>

                    {/* Detailed Debug Panel */}
                    <div className="border border-green-900/50 bg-black p-4 rounded mt-4 text-left font-mono text-xs">
                        <p className="text-green-500 mb-2 border-b border-green-900/50 pb-1">--- SYSTEM MONITOR ---</p>
                        {worldState ? (
                            <div className="grid grid-cols-2 gap-4 text-green-400">
                                <div>
                                    <div>Order:   {worldState.order_score || 0}</div>
                                    <div>Chaos:   {worldState.chaos_score || 0}</div>
                                    <div>Justice: {worldState.justice_score || 0}</div>
                                    <div>Evil:    {worldState.evil_score || 0}</div>
                                </div>
                                <div>
                                    <div>Status: <span className={worldState.status === 'Ruined' || worldState.status === '崩壊' ? 'text-red-500' : 'text-blue-500'}>{STATUS_MAP[worldState.status] || worldState.status}</span></div>
                                    <div>Attribute: <span className="text-yellow-500">{worldState.attribute_name || '不明'}</span></div>
                                    <div className="text-[10px] text-gray-500 truncate w-32" title={worldState.background_url}>BG: {worldState.background_url?.slice(0, 15)}...</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-green-900 animate-pulse">Scanning World State...</div>
                        )}
                    </div>
                </div>
            </div>
            {questResult && (
                <QuestResultModal
                    changes={questResult.changes}
                    rewards={questResult.rewards}
                    daysPassed={questResult.daysPassed}
                    onClose={() => setQuestResult(null)}
                />
            )}
            {showStatus && <StatusModal onClose={() => setShowStatus(false)} />}
        </div>
    );
}
