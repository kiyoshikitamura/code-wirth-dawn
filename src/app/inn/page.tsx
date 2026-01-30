'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { Scenario } from '@/types/game';
import { Scroll, Map, ArrowLeft, ShieldCheck } from 'lucide-react';
import WorldNews from '../components/WorldNews';
import { getBackgroundByAttribute } from '@/utils/visuals';
import { supabase } from '@/lib/supabase';
import MobileNav from '@/components/layout/MobileNav';

export default function InnPage() {
    const router = useRouter();
    const { selectScenario, gold, spendGold, worldState, fetchWorldState, userProfile } = useGameStore();
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [npcMessage, setNpcMessage] = useState('');
    const [reqStatus, setReqStatus] = useState<'Idle' | 'Success' | 'Error'>('Idle');
    const [reputation, setReputation] = useState<any>(null);

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
            alert("世界は再構成されました。");
            window.location.reload();
        } catch (e: any) {
            console.error(e);
            alert(`初期化失敗: ${e.message || 'Unknown Error'}`);
        }
    };

    useEffect(() => {
        async function fetchScenarios() {
            try {
                const res = await fetch('/api/scenarios', { cache: 'no-store' });
                if (res.ok) {
                    setScenarios(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        fetchWorldState(); // Ensure we have world state for NPC
        fetchScenarios();
        useGameStore.getState().fetchUserProfile();
    }, []);

    const handleSelect = (s: Scenario) => {
        selectScenario(s);
        router.push('/battle-test');
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

    // ... (keep handleSelect, handleBuy) ...

    // Debug Update Logic
    const updateDebug = async (impacts: any) => {
        setReqStatus('Idle');
        try {
            const res = await fetch('/api/admin/update-world', {
                method: 'POST',
                // Pass current location name (or Hub if not set)
                body: JSON.stringify({
                    impacts,
                    location_name: worldState?.location_name || '名もなき旅人の拠所'
                })
            });
            if (res.ok) {
                setReqStatus('Success');
                await fetchWorldState(); // REFETCH state to update UI
                useGameStore.getState().fetchUserProfile(); // Refetch profile too if points changed
            } else {
                setReqStatus('Error');
            }
        } catch (e) {
            console.error(e);
            setReqStatus('Error');
        }
    };

    const updateReputation = async (action: 'add' | 'sub') => {
        if (!worldState?.location_name) return;
        setReqStatus('Idle');
        try {
            const res = await fetch('/api/admin/update-reputation', {
                method: 'POST',
                body: JSON.stringify({
                    location_name: worldState.location_name,
                    action
                })
            });
            if (res.ok) {
                setReqStatus('Success');
                // Refetch EVERYTHING to ensure Title, Dialogue, Shop updates
                await fetchWorldState();
                await useGameStore.getState().fetchUserProfile();
                // Manually trigger reputation refetch (since it's local in useEffect)
                // We can just rely on the dependency `userProfile` changing or force re-mount?
                // Better: Extract fetchRep into function and call it.
                // For now, re-fetching userProfile triggers the Effect [userProfile, worldState].

                // Hack: force URL refresh to ensure clean state? No, avoid reload.
            } else {
                setReqStatus('Error');
            }
        } catch (e) {
            console.error(e);
            setReqStatus('Error');
        }
    };

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

    // Friction / Governance Text
    const getGovernanceText = () => {
        if (!worldState) return '';
        const nation = worldState.controlling_nation;
        if (nation === 'Neutral') return 'この地は誰の支配も受けていない。';

        let score = 0;
        if (nation === 'Roland') score = worldState.order_score;
        else if (nation === 'Markand') score = worldState.chaos_score;
        else if (nation === 'Yato') score = worldState.justice_score;
        else if (nation === 'Karyu') score = worldState.evil_score;

        if (score >= 60) return `住民は${nation}の統治を歓迎しているようだ。活気がある。`;
        if (score <= 40) return `住民は${nation}の支配に怯えている... 緊張感が漂っている。`;
        return `街はこの国の支配にまだ馴染んでいないようだ。`;
    };

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

            {/* 6. Content Container (Must be z-10 or higher to sit above BG layers) */}
            <div className="relative z-10 p-4">

                {/* News Modal (z-50 handled by modal itself usually, but let's ensure it's inside this relative container or portal) */}
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

                <header className={`max-w-4xl mx-auto py-4 md:py-6 border-b ${theme.border} mb-4 md:mb-8`}>
                    {/* Desktop Header */}
                    <div className="hidden md:flex items-center justify-between">
                        <div className="flex flex-col">
                            <h1 className={`text-2xl font-serif ${theme.accent} font-bold tracking-wider flex items-center gap-2`}>
                                <Map className="w-8 h-8" />
                                {worldState?.location_name || '冒険者の宿屋'}
                            </h1>
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-400">Rest & Supply @ {worldState?.controlling_nation || 'Neutral'} Territory</span>
                                <span className="text-xs text-orange-300/80 mt-1 italic font-serif">
                                    {getGovernanceText()}
                                </span>
                                <span className="text-xs text-[#a38b6b] mt-0.5 font-sans">
                                    世界暦 {100 + Math.floor((worldState?.total_days_passed || 0) / 365)}年 {1 + Math.floor(((worldState?.total_days_passed || 0) % 365) / 30)}月 {1 + ((worldState?.total_days_passed || 0) % 365) % 30}日 / 年齢: {userProfile?.age || 20}歳
                                </span>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => router.push('/world-map')}
                                    className={`text-xs bg-[#4a3b2b] border ${theme.border} ${theme.text} px-3 py-1.5 rounded hover:bg-white/10 hover:text-white flex items-center gap-2 w-fit transition-all uppercase tracking-wider font-bold`}
                                >
                                    <Map className="w-3 h-3" /> World Map
                                </button>
                            </div>
                        </div>

                        <div className="bg-black/50 px-4 py-2 rounded border border-gold-600/50 text-gold-400 font-mono text-right flex flex-col gap-2">
                            <div className="flex items-center justify-end gap-2">
                                {userProfile?.avatar_url && (
                                    <img src={userProfile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border border-gold-500/50 object-cover" />
                                )}
                                <div className="text-right">
                                    <div className="font-bold text-gray-200 text-sm">
                                        {userProfile?.title_name || '名もなき旅人'}
                                    </div>
                                    <div className={`text-[10px] ${reputation?.rank === 'Hero' ? 'text-amber-400' : 'text-gray-400'}`}>
                                        名声: {reputation?.rank || 'Stranger'} ({reputation?.score || 0})
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Header (Compact) */}
                    <div className="flex md:hidden items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            {userProfile?.avatar_url && (
                                <img src={userProfile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border border-gold-500/50 object-cover" />
                            )}
                            <div>
                                <h1 className={`text-lg font-serif ${theme.accent} font-bold tracking-wider leading-tight`}>
                                    {worldState?.location_name || '宿屋'}
                                </h1>
                                <div className="text-[10px] text-gray-400 mt-1">
                                    <div className="text-orange-300 italic mb-0.5">{getGovernanceText()}</div>
                                    <div>世界暦 {100 + Math.floor((worldState?.total_days_passed || 0) / 365)}年 {1 + Math.floor(((worldState?.total_days_passed || 0) % 365) / 30)}月 {1 + ((worldState?.total_days_passed || 0) % 365) % 30}日</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pb-20 md:pb-0">

                    {/* Left Column: NPC & Shop */}
                    <div className="space-y-4 md:space-y-8 order-1">
                        {/* NPC Area */}
                        <section className={`${theme.bg} p-4 md:p-6 rounded-sm border-l-4 ${theme.border.replace('/50', '')} relative shadow-lg`}>
                            <div className={`absolute -top-3 left-4 ${theme.accent.replace('text', 'bg')} text-black px-2 py-0.5 text-xs font-bold`}>MASTER</div>
                            <div className="flex gap-4">
                                <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-black border border-white/10 overflow-hidden rounded-sm">
                                    <img src="/avatars/inn_master.png" alt="Master" className="w-full h-full object-cover opacity-80" />
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
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
                        </section>

                        {/* Navigation Menu (Desktop Only) */}
                        <section className="hidden md:grid grid-cols-1 gap-4">
                            <button
                                onClick={() => router.push('/pub')}
                                className="bg-[#2b1d12] border border-[#a38b6b] p-4 flex items-center gap-4 hover:bg-[#3e2b1b] transition-all group"
                            >
                                <div className="bg-black/30 p-3 rounded-full text-amber-500 group-hover:text-amber-300">
                                    <span className="text-2xl">🍺</span>
                                </div>
                                <div className="text-left">
                                    <div className="text-lg font-serif font-bold text-[#e3d5b8] group-hover:text-white">酒場へ行く</div>
                                    <div className="text-xs text-[#8b7355]">仲間を探す・情報を集める</div>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push('/shop')}
                                className="bg-[#2b1d12] border border-[#a38b6b] p-4 flex items-center gap-4 hover:bg-[#3e2b1b] transition-all group"
                            >
                                <div className="bg-black/30 p-3 rounded-full text-amber-500 group-hover:text-amber-300">
                                    <span className="text-2xl">💰</span>
                                </div>
                                <div className="text-left">
                                    <div className="text-lg font-serif font-bold text-[#e3d5b8] group-hover:text-white">雑貨屋へ行く</div>
                                    <div className="text-xs text-gray-500">アイテム・スキルの購入</div>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push('/status')}
                                className="bg-[#1a1510] border border-[#4a3b2b] p-4 flex items-center gap-4 hover:bg-[#2a221b] transition-all group"
                            >
                                <div className="bg-black/30 p-3 rounded-full text-gray-400 group-hover:text-gray-200">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <div className="text-lg font-serif font-bold text-gray-300 group-hover:text-white">ステータス</div>
                                    <div className="text-xs text-gray-600">所持品・スキルの確認</div>
                                </div>
                            </button>
                        </section>
                    </div>

                    {/* Right Column: Quest Board */}
                    <div className="bg-[#e3d5b8] text-napy-900 p-4 md:p-6 rounded-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] border-4 border-[#8b5a2b] relative h-fit order-2 pb-8">
                        {/* Board Header */}
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#8b5a2b] text-[#e3d5b8] px-4 py-1 text-xs font-bold tracking-widest shadow-md">
                            QUEST BOARD
                        </div>
                        {/* ... Existing Scenarios Map ... */}
                        {loading ? (
                            <div className="text-center py-12 text-[#5c4033] font-serif">
                                依頼を読み込み中...
                            </div>
                        ) : (
                            <div className="space-y-4 pt-4">
                                {scenarios.map((s) => (
                                    <div key={s.id} className="group hover:bg-[#d4c5a5] p-4 transition-colors border-b border-[#c2b280] last:border-0 cursor-pointer relative" onClick={() => handleSelect(s)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-[#3e2723] text-lg font-serif">
                                                {s.title}
                                            </h3>
                                            <span className="bg-[#8b5a2b] text-[#e3d5b8] text-xs px-2 py-0.5 rounded">
                                                金貨 {s.reward_gold} 枚
                                            </span>
                                        </div>
                                        <p className="text-[#5d4037] text-sm mb-3">
                                            {s.description}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-[#5d4037]/80">
                                            <span>依頼主: {s.client_name}</span>
                                            <div className="flex gap-2">
                                                {s.impacts?.order && s.impacts.order > 0 && <span className="text-blue-800">秩序↑</span>}
                                                {s.impacts?.chaos && s.impacts.chaos > 0 && <span className="text-purple-800">混沌↑</span>}
                                                {s.impacts?.justice && s.impacts.justice > 0 && <span className="text-yellow-800">正義↑</span>}
                                            </div>
                                        </div>

                                        <button
                                            className="absolute right-4 bottom-4 bg-[#3e2723] text-gold-500 text-xs px-4 py-2 rounded shadow-lg transition-transform hover:scale-105 active:scale-95"
                                            onClick={(e) => { e.stopPropagation(); handleSelect(s); }}
                                        >
                                            受領する
                                        </button>
                                    </div>
                                ))}
                                {scenarios.length === 0 && (
                                    <div className="text-center py-8 text-[#5d4037]">現在、依頼はありません。</div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <MobileNav />

                <div className="text-center mt-12 space-y-4">
                    {/* Debug Section */}

                    {/* Debug Section */}
                    {/* Detailed Debug Panel */}
                    <div className="border border-green-900/50 bg-black p-4 rounded mt-8 text-left font-mono text-xs">
                        <p className="text-green-500 mb-2 border-b border-green-900/50 pb-1">--- SYSTEM MONITOR ---</p>
                        {worldState ? (
                            <div className="grid grid-cols-2 gap-4 text-green-400">
                                <div>
                                    <div>Order:   {worldState.order_score || 0}</div>
                                    <div>Chaos:   {worldState.chaos_score || 0}</div>
                                    <div>Justice: {worldState.justice_score || 0}</div>
                                    <div>Evil:    {worldState.evil_score || 0}</div>
                                    {/* <div className="mt-2 text-white">Total: {worldState.influence_score || 0}</div> */}
                                </div>
                                <div>
                                    <div>Status: <span className={worldState.status === 'Ruined' || worldState.status === '崩壊' ? 'text-red-500' : 'text-blue-500'}>{STATUS_MAP[worldState.status] || worldState.status}</span></div>
                                    <div>Attribute: <span className="text-yellow-500">{worldState.attribute_name || '不明'}</span></div>
                                    <div className="text-[10px] text-gray-500 truncate w-32" title={worldState.background_url}>BG: {worldState.background_url?.slice(0, 15)}...</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500">Loading World State...</div>
                        )}

                        {/* API Status Display */}
                        <div className="mt-2 text-[10px] text-gray-500 border-t border-green-900/30 pt-1">
                            Recent Update:
                            <span className={reqStatus === 'Success' ? 'text-green-500' : reqStatus === 'Error' ? 'text-red-500' : 'text-gray-500'}>
                                {reqStatus}
                            </span>
                        </div>

                        <h3 className="text-gray-500 text-xs font-bold pt-4 border-t border-gray-800 tracking-wider">REPUTATION</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button onClick={() => updateReputation('add')} className="p-2 bg-indigo-900/30 border border-indigo-700 hover:bg-indigo-800 text-indigo-300 rounded text-xs transition-colors">
                                名声 +10
                            </button>
                            <button onClick={() => updateReputation('sub')} className="p-2 bg-red-900/30 border border-red-700 hover:bg-red-800 text-red-300 rounded text-xs transition-colors">
                                名声 -10
                            </button>
                        </div>

                        <h3 className="text-gray-500 text-xs font-bold pt-4 border-t border-gray-800 tracking-wider mt-2">ATTRIBUTES</h3>
                        <div className="grid grid-cols-4 gap-1 mt-2">
                            <button onClick={() => updateDebug({ order: 20 })} className="bg-blue-900/30 border border-blue-500/50 text-blue-200 px-1 py-1 hover:bg-blue-800 transition-colors rounded text-[10px]">
                                Order+20
                            </button>
                            <button onClick={() => updateDebug({ chaos: 20 })} className="bg-purple-900/30 border border-purple-500/50 text-purple-200 px-1 py-1 hover:bg-purple-800 transition-colors rounded text-[10px]">
                                Chaos+20
                            </button>
                            <button onClick={() => updateDebug({ justice: 20 })} className="bg-yellow-900/30 border border-yellow-500/50 text-yellow-200 px-1 py-1 hover:bg-yellow-800 transition-colors rounded text-[10px]">
                                Justice+20
                            </button>
                            <button onClick={() => updateDebug({ evil: 20 })} className="bg-red-900/30 border border-red-500/50 text-red-200 px-1 py-1 hover:bg-red-800 transition-colors rounded text-[10px]">
                                Evil+20
                            </button>
                        </div>

                        <h3 className="text-gray-500 text-xs font-bold pt-4 border-t border-gray-800 tracking-wider mt-2">SYSTEM</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button onClick={() => useGameStore.getState().addGold(1000)} className="p-2 bg-yellow-900/20 border border-yellow-800 hover:bg-yellow-900 text-yellow-500 rounded text-xs transition-colors">
                                GOLD +1000
                            </button>
                            <button onClick={handleReset} className="p-2 bg-red-900/20 border border-red-800 hover:bg-red-900 text-red-500 rounded text-xs transition-colors">
                                RESET WORLD
                            </button>
                        </div>
                    </div>
                </div>
            </div>{/* End Content Container */}
        </div>
    );
}
