'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useQuestState } from '@/store/useQuestState';
import { Scenario, Enemy } from '@/types/game';
import { Scroll, AlertOctagon } from 'lucide-react';
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
import QuestBoardModal from '@/components/inn/QuestBoardModal';
import AccountSettingsModal from '@/components/inn/AccountSettingsModal';

export default function InnPage() {
    const router = useRouter();
    const { gold, spendGold, worldState, fetchWorldState, userProfile, fetchUserProfile, showStatus, setShowStatus, hubState } = useGameStore();

    // Updated State for v3.1
    const [normalQuests, setNormalQuests] = useState<Scenario[]>([]);
    const [specialQuests, setSpecialQuests] = useState<Scenario[]>([]);
    const [showQuestBoard, setShowQuestBoard] = useState(false);
    const [loading, setLoading] = useState(true);

    const [npcMessage, setNpcMessage] = useState('');
    const [reputation, setReputation] = useState<any>(null);
    const [selectedQuest, setSelectedQuest] = useState<any | null>(null);
    const [showTavern, setShowTavern] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const [showPrayer, setShowPrayer] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [riskConfirmQuest, setRiskConfirmQuest] = useState<any | null>(null);
    const [questResult, setQuestResult] = useState<any | null>(null);

    // --- News & History Logic ---
    const [showNews, setShowNews] = useState(false);
    const [currentNews, setCurrentNews] = useState<any>(null); // WorldHistory
    const [historyList, setHistoryList] = useState<any[]>([]);
    const [showHistoryHall, setShowHistoryHall] = useState(false);

    // --- NPC Dialogue Logic ---
    const [isThinking, setIsThinking] = useState(false);
    const [isNavigatingToBattle, setIsNavigatingToBattle] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [flavorText, setFlavorText] = useState("");

    // v3.4 Resume Logic
    useEffect(() => {
        if (userProfile?.current_quest_id && userProfile?.current_quest_state) {
            console.log("Resuming Quest...", userProfile.current_quest_id);
            useQuestState.getState().resumeQuest(userProfile.current_quest_state);
            router.push(`/quest/${userProfile.current_quest_id}`);
        }
    }, [userProfile, router]);

    useEffect(() => {
        const FLAVOR_TEXTS = [
            "「最近、王都の地下で奇妙な音がするらしい...」",
            "「北の森には近づかない方がいい。魔物が増えている。」",
            "「冒険者が増えてきたな。景気が良くなるといいが。」",
            "「伝説の武器がどこかに眠っているという噂だ。」",
            "「夜中に不気味な影を見たという者が後を絶たない。」",
            "「新しい依頼が入ったらしいぞ。稼ぎ時だな。」"
        ];
        setFlavorText(FLAVOR_TEXTS[Math.floor(Math.random() * FLAVOR_TEXTS.length)]);
    }, []);

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
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            await fetch('/api/debug/reset', {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
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
        async function fetchQuests() {
            setLoading(true); // Ensure loading state is true on start
            try {
                const url = userProfile?.id
                    ? `/api/location/quests?userId=${userProfile.id}`
                    : '/api/location/quests';

                // console.log('[InnPage] Fetching quests:', url);
                const res = await fetch(url, { cache: 'no-store' });
                // console.log('[InnPage] Response status:', res.status);

                if (res.ok) {
                    const data = await res.json();
                    // console.log('[InnPage] Quest API response:', JSON.stringify(data.debug));
                    setNormalQuests(data.normal_quests || []);
                    setSpecialQuests(data.special_quests || []);
                    // Clear any previous errors
                } else {
                    const errData = await res.json().catch(() => ({}));
                    console.error('[InnPage] Quest API Error:', res.status, errData);
                    alert(`クエスト情報の取得に失敗しました (Status: ${res.status})`);
                }
            } catch (e) {
                console.error("[InnPage] Fetch Error:", e);
                alert('通信エラーが発生しました。再試行してください。');
            } finally {
                setLoading(false);
            }
        }

        fetchWorldState();
        console.log('[InnPage] userProfile?.id:', userProfile?.id);
        if (userProfile?.id) {
            fetchQuests();
        } else {
            console.log('[InnPage] No userProfile.id, skipping quest fetch');
            setLoading(false);
        }

        async function loadProfile() {
            await useGameStore.getState().fetchUserProfile();
        }
        loadProfile();
    }, [userProfile?.id, userProfile?.current_location_id]);

    const handleSelect = (s: any) => {
        // Risk Check Logic
        const userLevel = userProfile?.level || 1;
        const recLevel = s.rec_level || 1;

        if (recLevel > userLevel) {
            setRiskConfirmQuest(s);
            return;
        }
        // Navigate to Quest Page instead of Modal
        router.push(`/quest/${s.id}`);
    };

    const confirmRisk = () => {
        if (riskConfirmQuest) {
            router.push(`/quest/${riskConfirmQuest.id}`);
            setRiskConfirmQuest(null);
        }
    };

    // Removed handleQuestComplete as it's now handled in QuestPage
    // kept some state for battle return just in case, but QuestPage handles it too.

    const [initialNodeId, setInitialNodeId] = useState<string | undefined>(undefined);

    // Battle Return Handler
    useEffect(() => {
        const pending = localStorage.getItem('pending_quest');
        if (pending) {
            try {
                const { quest, nextNodeId } = JSON.parse(pending);
                const urlParams = new URLSearchParams(window.location.search);
                const result = urlParams.get('battle_result');

                if (result === 'win') {
                    setSelectedQuest(quest);
                    setInitialNodeId(nextNodeId); // Resume at success node
                    localStorage.removeItem('pending_quest');
                    window.history.replaceState({}, '', '/inn'); // Clean URL
                } else if (result === 'lose' || result === 'escape') {
                    localStorage.removeItem('pending_quest');
                    window.history.replaceState({}, '', '/inn');
                }
            } catch (e) {
                localStorage.removeItem('pending_quest');
            }
        } else {
            // Check for Bounty Hunter Return
            const urlParams = new URLSearchParams(window.location.search);
            const result = urlParams.get('battle_result');
            const bType = urlParams.get('type');

            if (result && bType === 'bounty_hunter') {
                if (result === 'lose') {
                    // Trigger Defeat sequence: Gold Halved!
                    fetch('/api/profile/bounty-defeat', { method: 'POST' }).then(() => {
                        useGameStore.getState().fetchUserProfile();
                        alert("賞金稼ぎに敗北し、所持金が半分没収されました！");
                    });
                } else if (result === 'win') {
                    alert("賞金稼ぎをなんとか撃退した...だが悪名は消えない。");
                } else if (result === 'escape') {
                    alert("賞金稼ぎから命からがら逃げ延びた...");
                }
                window.history.replaceState({}, '', '/inn');
            }
        }
    }, [userProfile]);

    const handleBattleStart = async (scenario: any, enemyId: string, successNodeId?: string) => {
        let enemy: Enemy = { id: 'slime', name: 'スライム', hp: 50, maxHp: 50, level: 1 };

        if (enemyId && enemyId !== 'slime') {
            try {
                const { data: groupData } = await supabase
                    .from('enemy_groups')
                    .select('*')
                    .eq('slug', enemyId)
                    .maybeSingle();

                let targetSlug = enemyId;
                if (groupData && groupData.members && groupData.members.length > 0) {
                    targetSlug = groupData.members[0];
                }

                const { data: enemyData } = await supabase
                    .from('enemies')
                    .select('*')
                    .eq('slug', targetSlug)
                    .maybeSingle();

                if (enemyData) {
                    enemy = {
                        id: enemyData.slug,
                        name: enemyData.name,
                        hp: enemyData.hp,
                        maxHp: enemyData.hp,
                        level: Math.floor(enemyData.hp / 10) || 1,
                        image: `/enemies/${enemyData.slug}.png`
                    };
                }
            } catch (e) {
                console.error("Failed to fetch enemy data:", e);
            }
        } else {
            if (scenario.title.includes('退治')) {
                enemy = { id: 'slime', name: 'スライム', hp: 80, maxHp: 80, level: 1 };
            }
            if (scenario.title.includes('ドラゴン')) {
                enemy = { id: 'dragon', name: 'ドラゴン', hp: 500, maxHp: 500, level: 10 };
            }
        }

        if (successNodeId) {
            localStorage.setItem('pending_quest', JSON.stringify({
                quest: scenario,
                nextNodeId: successNodeId,
                timestamp: Date.now()
            }));
        }

        setIsNavigatingToBattle(true);
        await useGameStore.getState().startBattle(enemy);
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
            } else {
                messages.push("いらっしゃい。旅の方ですね。", "空き部屋はあるよ。ゆっくりしていきな。");
            }

            const nation = worldState.controlling_nation || 'Neutral';
            if (nation === 'Roland') messages.push("光の加護があらんことを。", "今日は教会の鐘がよく響くねえ。");
            if (nation === 'Markand') messages.push("儲かってるかい？", "金さえあれば何でも買える、いい街だろう？");
            if (nation === 'Karyu') messages.push("規律を乱す奴等は許さねえ。", "強い酒が入ったぞ。");
            if (nation === 'Yato') messages.push("...静かに飲んでくれよ。", "霧が濃くなってきたな...");

            setNpcMessage(messages[Math.floor(Math.random() * messages.length)]);
            setIsThinking(false);
        }, 600);

        return () => clearTimeout(timer);
    }, [worldState?.controlling_nation, reputation?.rank]);


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

    const STATUS_MAP: Record<string, string> = {
        'Zenith': '絶頂', 'Prosperous': '繁栄', 'Stagnant': '停滞', 'Declining': '衰退', 'Ruined': '崩壊',
        '繁栄': '繁栄', '衰退': '衰退', '崩壊': '崩壊'
    };

    return (
        <div className="min-h-screen text-gray-200 font-sans p-4 relative">
            {/* Background Layers */}
            <div className="fixed inset-0 z-0 bg-navy-900"></div>
            {(() => {
                const attributeName = worldState?.attribute_name;
                const localMappedUrl = attributeName ? getBackgroundByAttribute(attributeName) : null;
                const bgUrl = localMappedUrl || worldState?.background_url;
                const validBgUrl = (bgUrl && (bgUrl.startsWith('http') || bgUrl.startsWith('/'))) ? bgUrl : '/backgrounds/default.jpg';
                return (
                    <div className="fixed inset-0 z-[1] transition-all duration-[2000ms] ease-in-out bg-cover bg-center" style={{ backgroundImage: `url(${validBgUrl})` }}></div>
                );
            })()}

            {/* Location Sync Loading Overlay (Prevent Flicker) */}
            {(() => {
                // Determine target location name (Hub takes precedence)
                const targetLocationName = hubState?.is_in_hub ? '名もなき旅人の拠所' : (userProfile?.locations?.name || 'Loading...');

                // Show overlay if:
                // 1. User Profile or World State is not yet loaded (Initial Load)
                // 2. Location name mismatch (Transit)

                const isInitialLoad = !userProfile || !worldState;
                const isLocationSynced = !isInitialLoad && (targetLocationName === worldState.location_name);

                if (isInitialLoad || !isLocationSynced) {
                    return (
                        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
                            {/* Only show "Moving" if we have data but are syncing. If initial load, show "Entering..." */}
                            {isInitialLoad ? (
                                <>
                                    <div className="text-amber-500 font-serif text-xl animate-pulse tracking-widest mb-4">Entering Base...</div>
                                    <div className="text-xs text-gray-500 font-mono">世界を読み込んでいます...</div>
                                </>
                            ) : (
                                <>
                                    <div className="text-amber-500 font-serif text-xl animate-pulse tracking-widest mb-4">移動中...</div>
                                    <div className="text-xs text-gray-500 font-mono">{targetLocationName} へ向かっています</div>
                                </>
                            )}
                        </div>
                    );
                }
                return null;
            })()}
            {/* Visual Effects based on Status */}
            {worldState?.status === 'Declining' && <div className="fixed inset-0 z-[1] bg-[url('/effects/dirt.png')] opacity-40 mix-blend-multiply pointer-events-none"></div>}
            {worldState?.status === 'Ruined' && <div className="fixed inset-0 z-[1] bg-gradient-to-t from-red-900/40 to-transparent mix-blend-overlay pointer-events-none"></div>}

            <div className="fixed inset-0 z-[2] bg-black/40 transition-opacity duration-1000"></div>
            <div className="fixed inset-0 z-[3] bg-noise-pattern opacity-30 pointer-events-none mix-blend-overlay"></div>
            <div className="fixed inset-0 z-[3] bg-[radial-gradient(circle_at_center,_transparent_10%,_#000000_90%)] opacity-60 pointer-events-none"></div>

            {/* Battle Overlay */}
            {isNavigatingToBattle && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="text-red-500 font-serif text-3xl animate-pulse tracking-widest mb-4">BATTLE START</div>
                    <div className="w-16 h-16 border-4 border-red-900 border-t-red-500 rounded-full animate-spin"></div>
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 p-4">

                <QuestBoardModal
                    isOpen={showQuestBoard}
                    onClose={() => setShowQuestBoard(false)}
                    normalQuests={normalQuests}
                    specialQuests={specialQuests}
                    loading={loading}
                    userProfile={userProfile}
                    reputation={reputation}
                    onSelect={handleSelect}
                />

                {/* QuestModal Removed - using /quest/[id] page */}

                {showNews && currentNews && <WorldNews history={currentNews} onClose={closeNews} />}

                {/* History Hall */}
                {showHistoryHall && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#2a221b] border border-[#a38b6b] p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl relative">
                            <button onClick={() => setShowHistoryHall(false)} className="absolute top-2 right-2 text-gray-400 hover:text-white">✕</button>
                            <h2 className="text-2xl font-serif text-gold-500 mb-6 text-center border-b border-[#a38b6b] pb-2">世界の記憶</h2>
                            <div className="space-y-3">
                                {historyList.map(h => (
                                    <div key={h.id} onClick={() => { setCurrentNews(h); setShowNews(true); }} className="p-3 bg-black/30 hover:bg-gold-900/20 border border-transparent hover:border-gold-600/30 cursor-pointer transition-all group">
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
                    <TavernModal isOpen={showTavern} onClose={() => setShowTavern(false)} userProfile={userProfile} locationId={userProfile.current_location_id || 'loc_hub'} />
                )}

                {showShop && <ShopModal onClose={() => setShowShop(false)} />}
                {showPrayer && userProfile && <PrayerModal onClose={() => setShowPrayer(false)} locationId={userProfile.current_location_id || ''} locationName={worldState?.location_name || ''} />}
                {showAccount && <AccountSettingsModal onClose={() => setShowAccount(false)} />}

                {/* Risk Confirmation */}
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
                                <button onClick={() => setRiskConfirmQuest(null)} className="bg-gray-800 border border-gray-600 text-gray-300 py-3 rounded hover:bg-gray-700 transition-colors">やめる</button>
                                <button onClick={confirmRisk} className="bg-red-900/50 border border-red-600 text-red-200 py-3 rounded hover:bg-red-800 transition-colors font-bold">それでも挑む</button>
                            </div>
                        </div>
                    </div>
                )}

                <InnHeader worldState={worldState} userProfile={userProfile} reputation={reputation} />

                <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pb-20 md:pb-0">
                    <div className="space-y-4 md:space-y-8 order-1">
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
                            <button onClick={openHistoryHall} className={`absolute bottom-2 right-2 text-xs ${theme.accent} hover:text-white flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity p-2`}>
                                <Scroll className="w-3 h-3" /> 歴史を紐解く
                            </button>
                            <button onClick={handleRest} className={`absolute top-2 right-2 text-xs text-green-400 hover:text-white flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity p-2 border border-green-900/50 rounded bg-black/40`}>
                                💤 休息する
                            </button>
                        </section>
                        <InnNavigation onOpenTavern={() => setShowTavern(true)} onOpenShop={() => setShowShop(true)} onOpenStatus={() => setShowStatus(true)} onOpenPrayer={() => setShowPrayer(true)} onOpenAccount={() => setShowAccount(true)} theme={theme} />
                    </div>

                    <div className="order-2 space-y-4">
                        <div
                            onClick={() => setShowQuestBoard(true)}
                            className="group cursor-pointer relative bg-[#e3d5b8] bg-[url('/textures/paper.png')] bg-cover border-4 border-[#8b5a2b] rounded-sm p-6 shadow-2xl transition-transform hover:scale-[1.02] active:scale-95 h-64 flex flex-col justify-center items-center text-[#3e2723]"
                        >
                            <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-red-800 shadow-md border border-black/30"></div>
                            <h2 className="font-serif font-bold text-2xl mb-4 tracking-widest border-b-2 border-[#8b5a2b] pb-1">QUEST BOARD</h2>
                            <div className="flex flex-col items-center gap-2">
                                {loading ? (
                                    <span className="text-sm animate-pulse">読み込み中...</span>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">特別依頼:</span>
                                            {specialQuests.length > 0 ? (
                                                <span className="text-red-600 font-bold text-2xl animate-pulse">{specialQuests.length}件</span>
                                            ) : (
                                                <span className="text-gray-500">なし</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-[#5d4037]">通常依頼: {normalQuests.length}件</div>
                                    </>
                                )}
                            </div>
                            <div className="mt-6 bg-[#3e2723] text-[#e3d5b8] px-6 py-2 rounded font-bold shadow hover:bg-[#5d4037] transition-colors">依頼を確認する</div>
                            {!loading && specialQuests.some(q => q.is_urgent) && (
                                <div className="absolute -top-3 -right-3 bg-red-600 text-white font-bold px-3 py-1 rounded shadow-lg animate-bounce text-xs">URGENT!</div>
                            )}
                        </div>
                        {/* Flavor Text */}
                        <div className="bg-black/40 border border-[#a38b6b]/30 p-4 rounded text-xs text-gray-400 font-serif italic min-h-[3rem] flex items-center">
                            {flavorText}
                        </div>
                    </div>
                </main>

                <MobileNav />

                <div className="text-center mt-12 space-y-4">
                    {/* Debug Section */}
                    <div className="flex flex-wrap justify-center gap-4 border-t border-gray-800 pt-8 opacity-50 hover:opacity-100 transition-opacity">
                        <button onClick={handleReset} className="bg-red-900/20 text-red-500 border border-red-900 px-3 py-1 text-xs hover:bg-red-900/50">[DEBUG] World Reset</button>
                        <button onClick={async () => { await fetch('/api/debug/skip-time', { method: 'POST' }); fetchWorldState(); }} className="bg-blue-900/20 text-blue-500 border border-blue-900 px-3 py-1 text-xs hover:bg-blue-900/50">[DEBUG] Skip Day</button>
                        <button onClick={async () => {
                            if (!userProfile) return;
                            await fetch('/api/debug/level-up', {
                                method: 'POST',
                                body: JSON.stringify({ userId: userProfile.id, levels: 1 })
                            });
                            fetchUserProfile();
                            alert("Level Up!");
                        }} className="bg-green-900/20 text-green-500 border border-green-900 px-3 py-1 text-xs hover:bg-green-900/50">[DEBUG] +Lv1 (Full Restore)</button>
                        <button onClick={async () => { await useGameStore.getState().addGold(1000); }} className="bg-yellow-900/20 text-yellow-500 border border-yellow-900 px-3 py-1 text-xs hover:bg-yellow-900/50">[DEBUG] +1000 G</button>
                        <button onClick={async () => {
                            if (!userProfile) return;
                            const res = await fetch('/api/inventory', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'x-user-id': userProfile.id },
                                body: JSON.stringify({ item_slug: 'item_test_jewel', quantity: 1 })
                            });
                            if (res.ok) alert("納品用アイテム(3100)を入手しました！");
                            else alert("アイテム付与に失敗しました");
                        }} className="bg-purple-900/20 text-purple-400 border border-purple-900 px-3 py-1 text-xs hover:bg-purple-900/50">[DEBUG] 納品宝石GET</button>

                        <div className="w-full flex justify-center gap-4 mt-2">
                            <span className="text-xs text-gray-600 font-mono">
                                Auth: {userProfile?.id ? (userProfile.id === '00000000-0000-0000-0000-000000000000' ? 'DEMO' : userProfile.id.substring(0, 8) + '...') : 'None'}
                            </span>
                            <button onClick={async () => {
                                if (userProfile?.id) {
                                    if (confirm("本当にユーザーデータを完全に削除しますか？この操作は取り消せません。")) {
                                        await fetch('/api/debug/hard-reset', { method: 'POST', body: JSON.stringify({ userId: userProfile.id }) });
                                        await supabase.auth.signOut();
                                        window.location.href = '/title';
                                    }
                                }
                            }} className="bg-red-900/40 text-red-500 border border-red-900 px-3 py-1 text-xs font-bold hover:bg-red-900/80">[DEBUG] Hard Reset (Delete DB)</button>
                            <button onClick={async () => {
                                await supabase.auth.signOut();
                                window.location.href = '/title';
                            }} className="bg-gray-800 text-gray-400 border border-gray-600 px-3 py-1 text-xs hover:text-white">[DEBUG] Logout</button>
                            <button onClick={() => window.location.href = '/title'} className="bg-gray-800 text-gray-400 border border-gray-600 px-3 py-1 text-xs hover:text-white">[DEBUG] Go to Title</button>
                        </div>
                    </div>
                </div>

                {questResult && (
                    <QuestResultModal changes={questResult.changes} rewards={questResult.rewards} daysPassed={questResult.daysPassed} onClose={() => setQuestResult(null)} />
                )}
                {showStatus && <StatusModal onClose={() => setShowStatus(false)} />}
            </div>
        </div>
    );
}
