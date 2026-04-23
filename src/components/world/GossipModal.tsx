'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, RefreshCw, Newspaper, Sparkles, KeyRound, Beer, Users, ChevronDown } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { soundManager } from '@/lib/soundManager';

// ─── 型定義 ───────────────────────────────────────────────────
interface WorldNewsItem {
    id: number;
    message: string;
    old_value: string;
    new_value: string;
    event_type: string;
    created_at: string;
    location?: { name: string };
}

interface LoreItem {
    id: number;
    content: string;
    rarity: number;
    nation_tag: string | null;
}

interface SecretQuestItem {
    id: number;
    title: string;
    location_name: string;
    nation: string;
    difficulty: number;
    hint: string;
}

interface BlackMarketItem {
    name: string;
    nation_tags: string[];
}

interface TavernShadow {
    id: string;
    name: string;
    epithet?: string;
    job_class: string;
    durability: number;
    max_durability: number;
    cover_rate: number;
    avatar_url?: string;
    origin_type?: string;
    level?: number;
    flavor_text?: string;
}

interface GossipData {
    world_news?: WorldNewsItem[];
    unread_count?: number;
    lore_tips?: LoreItem[];
    secret_info?: { quests: SecretQuestItem[]; black_market: BlackMarketItem[] };
    tavern_shadows?: TavernShadow[];
    resonance_count?: number;
}

// ─── タイプライターフック ──────────────────────────────────────
function useTypewriter(text: string, speed = 22, active = true) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    const prevText = useRef('');

    useEffect(() => {
        if (!active) { setDisplayed(text); setDone(true); return; }
        if (text === prevText.current) return;
        prevText.current = text;
        setDisplayed('');
        setDone(false);
        let i = 0;
        const id = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) { clearInterval(id); setDone(true); }
        }, speed);
        return () => clearInterval(id);
    }, [text, speed, active]);

    return { displayed, done };
}

// ─── タイプライターカード（タップで次へボタン付き） ──────────
function TypewriterCardWithNext({
    text,
    icon,
    footer,
    className = '',
    onNext,
    isLast,
    allDone,
}: {
    text: string;
    icon?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    onNext?: () => void;   // タイプライター完了後、次カードへ進む
    isLast: boolean;       // これが最後のカードか
    allDone: boolean;      // このカードが「もはや最後まで表示済み」か
}) {
    const { displayed, done } = useTypewriter(text, 22, true);

    return (
        <div className={`relative bg-gray-800/60 border border-gray-700/60 rounded-xl p-3.5 ${className}`}>
            {icon && <div className="mb-2">{icon}</div>}
            <p className="text-sm text-gray-200 leading-relaxed">
                {displayed}
                {!done && <span className="animate-pulse text-amber-400">▍</span>}
            </p>
            {done && footer && <div className="mt-2.5">{footer}</div>}
            {/* タイプライター完了後、最後でなければ「もっと聞く」を表示 */}
            {done && !isLast && !allDone && onNext && (
                <button
                    onClick={onNext}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-gray-700/60 hover:bg-gray-700 border border-gray-600 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-all active:scale-[0.98]"
                >
                    <ChevronDown size={12} />
                    もっと聞く
                </button>
            )}
        </div>
    );
}

// ─── 旧スタイルタイプライターカード（newsタブ用に残す） ──────
function TypewriterCard({
    text, icon, footer, delay = 0, className = '', onDone,
}: {
    text: string;
    icon?: React.ReactNode;
    footer?: React.ReactNode;
    delay?: number;
    className?: string;
    onDone?: () => void;
}) {
    const [started, setStarted] = useState(false);
    const calledDone = useRef(false);
    useEffect(() => {
        const t = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(t);
    }, [delay]);
    const { displayed, done } = useTypewriter(text, 22, started);

    useEffect(() => {
        if (done && onDone && !calledDone.current) {
            calledDone.current = true;
            onDone();
        }
    }, [done, onDone]);

    return (
        <div className={`relative bg-gray-800/60 border border-gray-700/60 rounded-xl p-3.5 ${className}`}>
            {icon && <div className="mb-2">{icon}</div>}
            <p className="text-sm text-gray-200 leading-relaxed">
                {displayed}
                {!done && <span className="animate-pulse text-amber-400">▍</span>}
            </p>
            {done && footer && <div className="mt-2.5">{footer}</div>}
        </div>
    );
}

// ─── 順次タイプライター表示（タップで次へ/最後はフッターボタンで更新） ─
function SequentialCards<T>({
    items,
    renderCard,
    tabKey,
}: {
    items: T[];
    renderCard: (item: T, index: number, isLast: boolean, allDone: boolean, onNext: () => void) => React.ReactNode;
    tabKey: number;
}) {
    const [visibleCount, setVisibleCount] = useState(1);
    useEffect(() => { setVisibleCount(1); }, [tabKey]);

    const allDone = visibleCount >= items.length;

    return (
        <>
            {items.slice(0, visibleCount).map((item, i) =>
                renderCard(
                    item,
                    i,
                    i === items.length - 1,  // isLast
                    allDone,
                    () => {
                        if (i === visibleCount - 1 && visibleCount < items.length) {
                            setVisibleCount(v => v + 1);
                        }
                    }
                )
            )}
        </>
    );
}

// ─── タブ定義 ─────────────────────────────────────────────────
type TabKey = 'news' | 'lore' | 'secret' | 'tavern';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'news',   label: '冒険者の噂', icon: <Newspaper   size={13} /> },
    { key: 'lore',   label: '噂話',      icon: <Sparkles    size={13} /> },
    { key: 'secret', label: '路地裏',    icon: <KeyRound    size={13} /> },
    { key: 'tavern', label: '酒場',      icon: <Beer        size={13} /> },
];

// ─── メインコンポーネント ──────────────────────────────────────
interface Props {
    onClose: () => void;
    onOpenTavern?: () => void;
}

export default function GossipModal({ onClose, onOpenTavern }: Props) {
    const { userProfile } = useGameStore();
    const [activeTab, setActiveTab] = useState<TabKey>('news');
    const [data, setData] = useState<GossipData>({});
    const [loading, setLoading] = useState<Record<TabKey, boolean>>({
        news: false, lore: false, secret: false, tavern: false,
    });
    const [tabKey, setTabKey] = useState<Record<TabKey, number>>({
        news: 0, lore: 0, secret: 0, tavern: 0,
    });

    const userId = userProfile?.id || '';
    const locationId = userProfile?.current_location_id || '';

    // ─── データ取得 ─────────────────────────────────────────
    const fetchTab = useCallback(async (tab: TabKey) => {
        setLoading(prev => ({ ...prev, [tab]: true }));
        try {
            soundManager?.playSE('se_click');
            const res = await fetch(`/api/gossip?user_id=${userId}&location_id=${locationId}&tab=${tab}`);
            if (!res.ok) throw new Error(await res.text());
            const json = await res.json();
            setData(prev => ({ ...prev, ...json }));
            setTabKey(prev => ({ ...prev, [tab]: prev[tab] + 1 }));
            // v2.9.3f: 酒場データをsessionStorageにキャッシュ（TavernModalとの一致用）
            if (tab === 'tavern' && json.tavern_shadows) {
                try {
                    sessionStorage.setItem('tavern_shadows_cache', JSON.stringify(json.tavern_shadows));
                } catch { /* sessionStorage unavailable */ }
            }
        } catch (e) {
            console.error('[gossip] fetch error', e);
        } finally {
            setLoading(prev => ({ ...prev, [tab]: false }));
        }
    }, [userId, locationId]);

    useEffect(() => {
        soundManager?.playSE('se_modal_open');
        fetchTab('news');
        fetchTab('lore');
        fetchTab('secret');
        fetchTab('tavern');
    }, []); // eslint-disable-line

    const handleTabChange = (t: TabKey) => {
        setActiveTab(t);
        soundManager?.playSE('se_click');
    };

    const statusEmoji = (oldSt: string, newSt: string) => {
        const rank: Record<string, number> = { Zenith: 5, Prosperous: 4, Stagnant: 3, Declining: 2, Ruined: 1 };
        const diff = (rank[newSt] || 3) - (rank[oldSt] || 3);
        if (diff > 0) return '📈';
        if (diff < 0) return '📉';
        return '🔄';
    };

    const rarityBadge = (r: number) =>
        r >= 3 ? <span className="text-[9px] text-amber-300 bg-amber-900/60 px-1.5 py-0.5 rounded font-bold">レア</span>
        : r >= 2 ? <span className="text-[9px] text-slate-300 bg-slate-700/60 px-1.5 py-0.5 rounded font-bold">珍しい</span>
        : null;

    const difficultyStars = (d: number) => '★'.repeat(Math.min(d, 5));

    // ─── タイプライター遅延アキュムレーター（newsタブ用）───
    let newsDelay = 0;

    // ─── レンダリング ───────────────────────────────────────
    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-lg max-h-[90dvh] flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-gray-900 border border-gray-700">

                {/* ─ ヘッダー ─ */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950/80 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">📰</span>
                        <div>
                            <h2 className="text-sm font-black text-gray-100 tracking-wider flex items-center gap-2">
                                街の噂話
                                <span className="text-[9px] text-gray-500 font-normal">Town Gossip & Rumors</span>
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {data.unread_count != null && data.unread_count > 0 && (
                            <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                                未読 {data.unread_count}
                            </span>
                        )}
                        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white bg-gray-800/50 rounded-full hover:bg-gray-700 transition-colors active:scale-90">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* ─ タブナビ ─ */}
                <div className="flex shrink-0 border-b border-gray-800 bg-black/20 overflow-x-auto scrollbar-hide">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => handleTabChange(t.key)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold whitespace-nowrap transition-all border-b-2
                                ${activeTab === t.key
                                    ? 'text-amber-400 border-amber-500 bg-amber-900/10'
                                    : 'text-gray-500 border-transparent hover:text-gray-300'
                                }`}
                        >
                            {t.icon}
                            {t.label}
                            {t.key === 'news' && (data.unread_count ?? 0) > 0 && (
                                <span className="w-2 h-2 bg-red-500 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* ─ タブコンテンツ ─ */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 px-4 py-4 space-y-3">

                    {/* ── タブ①「冒険者の噂」 ── */}
                    {activeTab === 'news' && (
                        <>
                            {loading.news ? <Spinner /> : (
                                (!data.world_news || data.world_news.length === 0)
                                    ? <EmptyHint text="今は冒険者の噂話がないようだ..." />
                                    : data.world_news.map((item, i) => {
                                        const textText = item.message || '（情報なし）';
                                        const d = newsDelay;
                                        newsDelay += textText.length * 22 + 500;
                                        return (
                                            <TypewriterCard
                                                key={`${tabKey.news}-news-${item.id}`}
                                                delay={d}
                                                icon={
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base">{statusEmoji(item.old_value, item.new_value)}</span>
                                                        <span className="text-[10px] font-bold text-amber-400">
                                                            {item.location?.name ?? '???'}
                                                        </span>
                                                        <span className="text-[9px] text-gray-500 ml-auto">
                                                            {new Date(item.created_at).toLocaleDateString('ja-JP')}
                                                        </span>
                                                    </div>
                                                }
                                                text={textText}
                                                footer={
                                                    <p className="text-[9px] text-gray-500 italic">{item.old_value} → {item.new_value}</p>
                                                }
                                            />
                                        );
                                    })
                            )}
                        </>
                    )}

                    {/* ── タブ②「噂話」（旧こぼれ話）── */}
                    {activeTab === 'lore' && (
                        <>
                            {loading.lore ? <Spinner /> : (
                                !data.lore_tips || data.lore_tips.length === 0
                                    ? <EmptyHint text="今日は特に面白い話を耳にしていないな…" />
                                    : <SequentialCards
                                        items={data.lore_tips}
                                        tabKey={tabKey.lore}
                                        renderCard={(item, i, isLast, allDone, onNext) => (
                                            <TypewriterCardWithNext
                                                key={`${tabKey.lore}-lore-${item.id}`}
                                                isLast={isLast}
                                                allDone={allDone}
                                                onNext={onNext}
                                                icon={
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-base">💬</span>
                                                        <span className="text-[10px] text-gray-400 italic">街の住人の話</span>
                                                        <span className="ml-auto">{rarityBadge(item.rarity)}</span>
                                                    </div>
                                                }
                                                text={`「${item.content}」`}
                                            />
                                        )}
                                    />
                            )}
                        </>
                    )}

                    {/* ── タブ③「路地裏」 ── */}
                    {activeTab === 'secret' && (
                        <>
                            {loading.secret ? <Spinner /> : (
                                <>
                                    {(data.secret_info?.quests.length ?? 0) === 0
                                        ? <EmptyHint text="今は大した情報はない。また後で聞いてみろ。" />
                                        : null}

                                    {(data.secret_info?.quests?.length ?? 0) > 0 && (
                                        <SequentialCards
                                            items={data.secret_info!.quests}
                                            tabKey={tabKey.secret}
                                            renderCard={(q, i, isLast, allDone, onNext) => (
                                                <TypewriterCardWithNext
                                                    key={`${tabKey.secret}-secret-${q.id}`}
                                                    isLast={isLast}
                                                    allDone={allDone}
                                                    onNext={onNext}
                                                    className="border-l-2 border-l-red-700"
                                                    icon={
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base">🗝</span>
                                                            <div>
                                                                <span className="text-[10px] font-bold text-red-400">{q.location_name}</span>
                                                                <span className="text-[9px] text-gray-500 ml-2">{difficultyStars(q.difficulty)}</span>
                                                            </div>
                                                        </div>
                                                    }
                                                    text={`「『${q.title}』という依頼が出回っているらしい……」\n${q.hint}`}
                                                />
                                            )}
                                        />
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* ── タブ④「酒場」 ── */}
                    {activeTab === 'tavern' && (
                        <>
                            {loading.tavern ? <Spinner /> : (
                                <>
                                    {/* 共鳴バナー */}
                                    {(data.resonance_count ?? 0) > 0 && (
                                        <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-800/40 rounded-xl px-3 py-2">
                                            <Users size={14} className="text-blue-400 shrink-0" />
                                            <p className="text-xs text-gray-300">
                                                今、この街には <span className="font-black text-blue-300">{data.resonance_count}人</span> の冒険者が集まっている。活気があるな！
                                            </p>
                                        </div>
                                    )}

                                    {data.tavern_shadows?.length === 0
                                        ? <EmptyHint text="今日は凄腕の傭兵の姿が見当たらない。またいつか来るだろう。" />
                                        : <SequentialCards
                                            items={data.tavern_shadows || []}
                                            tabKey={tabKey.tavern}
                                            renderCard={(s, i, isLast, allDone, onNext) => {
                                                const textText = s.flavor_text
                                                    ? `「${s.flavor_text}」`
                                                    : s.origin_type === 'system_mercenary'
                                                        ? `「${s.name}……${s.job_class || '傭兵'}の腕前は確かだと評判だ。話しかけてみるのも一興かもしれない。」`
                                                        : `「${s.name}という旅人が酒場に立ち寄っている。冒険者と見受けるが、一緒に旅をしてみるのも悪くはないだろう。」`;
                                                return (
                                                    <TypewriterCardWithNext
                                                        key={`${tabKey.tavern}-sh-${s.id}`}
                                                        isLast={isLast}
                                                        allDone={allDone}
                                                        onNext={onNext}
                                                        icon={
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-9 h-9 rounded-full border-2 border-gray-600 bg-gray-800 overflow-hidden flex-shrink-0 shadow">
                                                                    {s.avatar_url
                                                                        ? <img src={s.avatar_url} alt={s.name} className="w-full h-full object-cover" />
                                                                        : <div className="w-full h-full flex items-center justify-center text-gray-400 text-base">⚔</div>
                                                                    }
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] font-black text-gray-100">{s.epithet} {s.name}</p>
                                                                    <p className="text-[9px] text-gray-400">
                                                                        {s.job_class}
                                                                        {s.level ? ` — Lv.${s.level}` : ''}
                                                                        {s.origin_type === 'system_mercenary' ? ' 〔公式傭兵〕' : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        }
                                                        text={textText}
                                                    />
                                                );
                                            }}
                                        />
                                    }

                                    {/* 酒場への誘導ボタン */}
                                    {onOpenTavern && (
                                        <button
                                            onClick={() => { onClose(); onOpenTavern(); }}
                                            className="w-full mt-2 py-2.5 flex items-center justify-center gap-2 bg-amber-900/20 border border-amber-700/50 rounded-xl text-xs font-bold text-amber-400 hover:bg-amber-900/40 hover:text-amber-300 transition-all active:scale-[0.98]"
                                        >
                                            <Beer size={13} /> 酒場で冒険者を探す
                                        </button>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* ─ フッター：更新ボタン ─ */}
                <div className="shrink-0 px-4 py-3 border-t border-gray-800 bg-gray-950/60">
                    <button
                        onClick={() => fetchTab(activeTab)}
                        disabled={loading[activeTab]}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition-all active:scale-[0.98]
                            ${loading[activeTab]
                                ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                                : 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`}
                    >
                        <RefreshCw size={12} className={loading[activeTab] ? 'animate-spin' : ''} />
                        {loading[activeTab] ? '情報を集めています…' : 'もっと情報を聞く'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── 補助コンポーネント ────────────────────────────────────────
function Spinner() {
    return (
        <div className="flex flex-col items-center gap-3 py-10 text-gray-500">
            <div className="w-7 h-7 border-2 border-gray-600 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-xs italic">耳を傾けている…</p>
        </div>
    );
}

function EmptyHint({ text }: { text: string }) {
    return (
        <div className="text-center py-10">
            <p className="text-xs text-gray-500 italic">「{text}」</p>
        </div>
    );
}
