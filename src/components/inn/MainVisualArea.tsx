import React, { useState, useEffect } from 'react';
import { BookOpen, MapPin, Compass, Home, ArrowLeft, MessageSquare, X } from 'lucide-react';
import { WorldState } from '@/types/game';
import { useGameStore } from '@/store/gameStore';

interface MainVisualAreaProps {
    worldState: WorldState | null;
    locationSlug?: string;
    onOpenHistory: () => void;
    onReturnHub?: () => void;
    onLeaveHub?: () => void;
    onOpenMap?: () => void;
    onOpenGossip?: () => void;
    showHistoryBadge?: boolean;
    showGossipBadge?: boolean;
    isHub?: boolean; // v27.0: ハブ判定（繁栄度バッジ非表示、フレーバー固定）
    isMapRecommended?: boolean;
    isGossipRecommended?: boolean;
    isTourActive?: boolean;
}

export default function MainVisualArea({ 
    worldState, 
    locationSlug, 
    onOpenHistory, 
    onReturnHub, 
    onLeaveHub, 
    onOpenMap, 
    onOpenGossip,
    showHistoryBadge, 
    showGossipBadge,
    isHub = false, 
    isMapRecommended = false,
    isGossipRecommended = false,
    isTourActive = false
}: MainVisualAreaProps) {
    const gossipData = useGameStore(state => state.gossipData);
    const [showPromo, setShowPromo] = useState(false);

    const latestGossipText = (() => {
        if (!gossipData) return '';
        if (gossipData.pinned_system_post) {
            return gossipData.pinned_system_post.content;
        }
        if (gossipData.posts && gossipData.posts.length > 0) {
            return gossipData.posts[0].content;
        }
        return '';
    })();

    const latestGossipTime = (() => {
        if (!gossipData) return 0;
        let maxTime = 0;
        if (gossipData.pinned_system_post?.created_at) {
            maxTime = Math.max(maxTime, new Date(gossipData.pinned_system_post.created_at).getTime());
        }
        if (gossipData.posts && gossipData.posts.length > 0 && gossipData.posts[0].created_at) {
            maxTime = Math.max(maxTime, new Date(gossipData.posts[0].created_at).getTime());
        }
        return maxTime;
    })();

    useEffect(() => {
        if (isTourActive) {
            setShowPromo(false);
            return;
        }
        if (typeof window !== 'undefined') {
            const lastViewedStr = localStorage.getItem('last_viewed_gossip_time');
            const lastViewedTime = lastViewedStr ? parseInt(lastViewedStr, 10) : 0;
            const hasUnread = latestGossipTime > lastViewedTime;

            if (hasUnread && latestGossipText) {
                setShowPromo(true);
            } else {
                setShowPromo(false);
            }
        }
    }, [latestGossipTime, isTourActive, latestGossipText]);

    const dismissGossipPromo = () => {
        if (typeof window !== 'undefined') {
            if (latestGossipTime > 0) {
                localStorage.setItem('last_viewed_gossip_time', String(latestGossipTime));
            }
        }
        setShowPromo(false);
    };

    const handleGossipClick = () => {
        dismissGossipPromo();
        onOpenGossip?.();
    };

    const prosperity = isHub ? 4 : (worldState?.prosperity_level || 3);
    const locationName = worldState?.location_name || '未知の土地';
    const controllingNation = worldState?.controlling_nation || 'Neutral';

    let stateSuffix = "normal";
    let prosperityLabel = '停滞';
    let prosperityBadgeClass = 'bg-slate-800/70 text-slate-200 border-slate-600/50';
    let vignette = 'from-transparent via-transparent to-slate-950/80';
    let topGlow = '';

    if (prosperity >= 5) {
        stateSuffix = "prosperous";
        prosperityLabel = '絶頂';
        prosperityBadgeClass = 'bg-amber-500/20 text-amber-200 border-amber-400/40';
        vignette = 'from-amber-900/10 via-transparent to-slate-950/80';
        topGlow = 'shadow-[inset_0_0_60px_rgba(251,191,36,0.15)]';
    } else if (prosperity >= 4) {
        stateSuffix = "prosperous";
        prosperityLabel = '繁栄';
        prosperityBadgeClass = 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40';
        vignette = 'from-emerald-900/5 via-transparent to-slate-950/80';
    } else if (prosperity <= 1) {
        stateSuffix = "ruined";
        prosperityLabel = '崩壊';
        prosperityBadgeClass = 'bg-red-900/40 text-red-300 border-red-500/40';
        vignette = 'from-red-950/20 via-transparent to-slate-950/90';
        topGlow = 'shadow-[inset_0_0_60px_rgba(127,29,29,0.3)]';
    } else if (prosperity === 2) {
        stateSuffix = "normal";
        prosperityLabel = '衰退';
        prosperityBadgeClass = 'bg-orange-900/30 text-orange-300 border-orange-500/40';
        vignette = 'from-transparent via-transparent to-slate-950/80';
        topGlow = '';
    }

    const bgImageUrl = isHub
        ? '/backgrounds/locations/loc_hub_normal.png'
        : locationSlug
            ? `/backgrounds/locations/${locationSlug}_${stateSuffix}.png`
            : null;

    const flavorText = (() => {
        if (!worldState || locationName === '未知の土地') return '';
        // v27.0: ハブは国家支配の影響を受けない
        if (isHub) return 'どの国の支配も受けない、旅人たちの安息の地。';
        if (controllingNation === 'Neutral') return 'この地は誰の支配も受けていない。';

        const getNationName = (nation: string) => {
            switch (nation) {
                case 'Roland': return 'ローランド聖王国';
                case 'Karyu': return '華龍神朝';
                case 'Yato': return '夜刀神国';
                case 'Markand': return '砂塵の王国マルカンド';
                case 'Neutral': return '中立地帯';
                default: return nation;
            }
        };
        const jpNation = getNationName(controllingNation);

        let score = 50;
        if (controllingNation === 'Roland') {
            const order = Number(worldState.order_score) || 0;
            const chaos = Number(worldState.chaos_score) || 0;
            score = (order + chaos) > 0 ? (order / (order + chaos)) * 100 : 50;
        } else if (controllingNation === 'Markand') {
            const order = Number(worldState.order_score) || 0;
            const chaos = Number(worldState.chaos_score) || 0;
            score = (order + chaos) > 0 ? (chaos / (order + chaos)) * 100 : 50;
        } else if (controllingNation === 'Yato') {
            const justice = Number(worldState.justice_score) || 0;
            const evil = Number(worldState.evil_score) || 0;
            score = (justice + evil) > 0 ? (justice / (justice + evil)) * 100 : 50;
        } else if (controllingNation === 'Karyu') {
            const justice = Number(worldState.justice_score) || 0;
            const evil = Number(worldState.evil_score) || 0;
            score = (justice + evil) > 0 ? (evil / (justice + evil)) * 100 : 50;
        }

        if (score >= 60) return `住民は${jpNation}の統治を歓迎している。活気がある。`;
        if (score <= 40) return `住民は${jpNation}の支配に怯えている…`;
        return `街はこの国の支配にまだ馴染んでいないようだ。`;
    })();

    return (
        <div className={`relative h-[40vh] min-h-[200px] max-h-[320px] bg-[#0a1628] overflow-hidden shrink-0 ${topGlow}`}>
            {/* Background Image */}
            {bgImageUrl ? (
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
                    style={{ backgroundImage: `url('${bgImageUrl}')` }}
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-800 opacity-20 scale-[2.5]">
                    <MapPin size={180} />
                </div>
            )}

            {/* Vignette / Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-b ${vignette} pointer-events-none`} />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40 pointer-events-none" />

            {/* Top-right action buttons */}
            <div className="absolute top-4 right-4 flex gap-2.5 z-10">
                <button
                    onClick={onOpenHistory}
                    disabled={isTourActive}
                    className={`relative w-10 h-10 rounded-full bg-slate-950/60 backdrop-blur-md border border-amber-600/40 shadow-lg flex items-center justify-center text-amber-500 hover:bg-amber-900/60 hover:text-amber-300 transition-colors active:scale-95 focus:outline-none ${
                        isTourActive ? 'opacity-30 pointer-events-none' : ''
                    }`}
                    title="私の歴史を開く"
                >
                    <BookOpen size={18} />
                    {showHistoryBadge && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[8px] text-white font-black animate-bounce shadow-lg border-2 border-slate-950">
                            !
                        </span>
                    )}
                </button>
                {onReturnHub && !isHub && (
                    <button
                        onClick={onReturnHub}
                        disabled={isTourActive}
                        className={`relative w-10 h-10 rounded-full bg-slate-950/60 backdrop-blur-md border border-blue-600/40 shadow-lg flex items-center justify-center text-blue-400 hover:bg-blue-900/60 hover:text-blue-200 transition-colors active:scale-95 focus:outline-none ${
                            isTourActive ? 'opacity-30 pointer-events-none' : ''
                        }`}
                        title="名もなき旅人の拠所へ"
                    >
                        <Home size={18} />
                    </button>
                )}
                {onLeaveHub && isHub && (
                    <button
                        onClick={onLeaveHub}
                        disabled={isTourActive}
                        className={`relative w-10 h-10 rounded-full bg-slate-950/60 backdrop-blur-md border border-blue-600/40 shadow-lg flex items-center justify-center text-blue-400 hover:bg-blue-900/60 hover:text-blue-200 transition-colors active:scale-95 focus:outline-none ${
                            isTourActive ? 'opacity-30 pointer-events-none' : ''
                        }`}
                        title="直前の拠点へ戻る"
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}
                {onOpenGossip && !isHub && (
                    <div className="relative">
                        <button
                            onClick={handleGossipClick}
                            disabled={isTourActive}
                            className={`relative w-10 h-10 rounded-full bg-slate-950/60 backdrop-blur-md shadow-lg flex items-center justify-center transition-all active:scale-95 focus:outline-none ${
                                isTourActive
                                    ? 'opacity-30 border border-emerald-600/20 text-emerald-400/20 pointer-events-none'
                                    : isGossipRecommended
                                        ? 'border-2 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.7)] animate-bounce'
                                        : 'border border-emerald-600/40 text-emerald-400 hover:bg-emerald-900/60 hover:text-emerald-200'
                            }`}
                            title="街の噂話を聞く"
                        >
                            <MessageSquare size={18} />
                            {showGossipBadge && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[8px] text-white font-black animate-bounce shadow-lg border-2 border-slate-950">
                                    !
                                </span>
                            )}
                            {!isTourActive && isGossipRecommended && (
                                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 rounded-full flex items-center justify-center text-[7px] text-white font-black px-1 py-0.5 shadow-lg border border-slate-950 scale-95 leading-none animate-pulse">噂</span>
                            )}
                        </button>

                        {/* Speech Bubble / Tooltip showing the latest gossip */}
                        {showPromo && (
                            <div className="absolute right-0 top-12 w-52 p-2.5 bg-slate-950 border-2 border-emerald-500 rounded-xl shadow-2xl z-40 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Triangle arrow pointing up to the button */}
                                <div className="absolute top-[-7px] right-3.5 w-3 h-3 bg-slate-950 border-t-2 border-l-2 border-emerald-500 transform rotate-45" />
                                
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-emerald-400 tracking-wider">📢 最新の噂</span>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                dismissGossipPromo();
                                            }}
                                            className="text-gray-400 hover:text-white p-0.5 transition-colors"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-200 leading-relaxed line-clamp-3 break-all font-medium">
                                        {latestGossipText}
                                    </p>
                                    <div className="text-[8px] text-emerald-400/80 font-bold text-right pt-0.5">
                                        タップして見る ➔
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {onOpenMap && !isHub && (
                    <button
                        onClick={onOpenMap}
                        disabled={isTourActive && !isMapRecommended}
                        className={`relative w-10 h-10 rounded-full bg-slate-950/60 backdrop-blur-md shadow-lg flex items-center justify-center transition-all focus:outline-none ${
                            isTourActive && !isMapRecommended
                                ? 'opacity-30 border border-[#2a4080]/10 text-blue-200/10 pointer-events-none'
                                : isMapRecommended
                                    ? 'border-2 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.7)] animate-bounce active:scale-95'
                                    : 'border border-emerald-600/40 text-emerald-400 hover:bg-emerald-900/60 hover:text-emerald-200 active:scale-95'
                        }`}
                        title="ワールドマップを開く"
                    >
                        <Compass size={18} />
                        {isMapRecommended && (
                            <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-[#0a1628] rounded-full flex items-center justify-center text-[7px] font-black px-1.5 py-0.5 shadow-lg border border-slate-950 scale-95 leading-none animate-pulse">出発</span>
                        )}
                    </button>
                )}
            </div>

            {/* Bottom overlay: Location name + prosperity + flavor */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-5">
                <div className="flex items-end justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl md:text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-wide font-serif">
                            {locationName}
                        </h2>
                        {flavorText && (
                            <p className="mt-1 text-[10px] text-slate-300/80 italic drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] leading-relaxed line-clamp-2">
                                「{flavorText}」
                            </p>
                        )}
                    </div>
                    {/* flex-shrink-0 */}
                    {!isHub && (
                        <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg border backdrop-blur-sm text-xs font-black tracking-wider ${prosperityBadgeClass}`}>
                            {prosperityLabel}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
