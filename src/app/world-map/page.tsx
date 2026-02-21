'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { Location } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { Map as MapIcon, Compass, Anchor, Castle, Mountain, Tent } from 'lucide-react';
import { getNationNodeColor } from '@/utils/nationColors';



export default function WorldMapPage() {
    const router = useRouter();
    const { userProfile, worldState, hubState, fetchUserProfile, fetchWorldState, fetchHubState } = useGameStore();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [traveling, setTraveling] = useState(false);
    const [travelLog, setTravelLog] = useState<string[]>([]);
    const [isInitializingHub, setIsInitializingHub] = useState(false);

    // Ref for synchronous guard against re-renders
    const isTravelingRef = useRef(false);

    // Fetch Locations & Nation Data
    useEffect(() => {
        async function init() {
            setLoading(true);
            // Fetch locations with their current controlling nation
            const { data } = await supabase
                .from('locations')
                .select('*, world_states(controlling_nation)');

            if (data) {
                const mapped = data.map((l: any) => ({
                    ...l,
                    x: l.map_x || -999,
                    y: l.map_y || -999
                }));
                // Cast to Location[] now that x/y are present
                setLocations(mapped as Location[]);
            }

            await fetchUserProfile();
            await fetchHubState(); // Explicitly fetch Hub State
            await fetchWorldState(); // Global date
            setLoading(false);
        }
        init();
    }, [fetchUserProfile, fetchWorldState, fetchHubState]);

    // Hub & Travel Logic
    const [showEntryModal, setShowEntryModal] = useState(false);
    const hasDescendedRef = useRef(false);

    // Initial check for Hub State (New & Legacy & Content)
    useEffect(() => {
        if (!loading && userProfile && locations.length > 0 && !hasDescendedRef.current) {
            // 1. Check legacy Zero UUID
            const isZeroUUID = !userProfile.current_location_id || userProfile.current_location_id === '00000000-0000-0000-0000-000000000000';

            // 2. Check actual Location Data (Name/Type)
            const currentLoc = locations.find(l => l.id === userProfile.current_location_id);
            const isHubLocation = currentLoc?.name === '名もなき旅人の拠所' || currentLoc?.type === 'Hub';

            // 3. Check new Hub State (Reactive)
            const isHubStateFlag = hubState?.is_in_hub;

            // "Descent from Heaven" Logic: Show modal ONLY if strictly at Hub Location or Zero ID (Fresh Start/Reset)
            // We ignore isHubStateFlag here to prevent re-triggering when returning from a valid location
            if (isZeroUUID || isHubLocation) {
                setShowEntryModal(true);
            } else {
                // Ensure modal is closed if conditions are NOT met
                setShowEntryModal(false);
            }
        }
    }, [userProfile?.current_location_id, locations, loading, hubState?.is_in_hub]);

    const handleEntrySelect = async (targetLoc: Location) => {
        if (!userProfile?.id) return;
        setIsInitializingHub(true);

        // Optimistic UI Update to prevent loop
        setShowEntryModal(false);
        hasDescendedRef.current = true;

        try {
            // Get Session Token to pass to API (Optional)
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            // Use API to ensure robust state transition
            // We pass the token so the API can act as the user (RLS compatible) if Admin key is missing
            const res = await fetch('/api/map/descend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    target_location_id: targetLoc.id,
                    user_id: userProfile.id
                })
            });

            if (res.ok) {
                await fetchUserProfile();
                await fetchHubState(); // Sync store immediately
            } else {
                console.error("Descent API failed");
                const err = await res.json();
                alert(`移動処理に失敗しました: ${err.error || 'Unknown Error'}`);

                // Re-open if failed
                hasDescendedRef.current = false;
                setShowEntryModal(true);
            }
        } catch (e: any) {
            console.error(e);
            alert(`エラーが発生しました: ${e.message}`);
            hasDescendedRef.current = false;
            setShowEntryModal(true);
        } finally {
            setIsInitializingHub(false);
        }
    };

    // Calendar & Age Computation
    const totalDays = userProfile?.accumulated_days || 0;
    const year = 100 + Math.floor(totalDays / 365);
    const month = 1 + Math.floor((totalDays % 365) / 30);
    const day = 1 + (totalDays % 30);

    const userAge = userProfile?.age || 20;

    const getNationColor = (nationId: string) => getNationNodeColor(nationId);

    const getIcon = (type: string) => {
        switch (type) {
            case 'Capital': return <Castle className="w-5 h-5" />;
            case 'City': return <Castle className="w-4 h-4" />;
            case 'Town': return <MapIcon className="w-4 h-4" />;
            case 'Dungeon': return <Anchor className="w-4 h-4" />;
            case 'Field': return <Mountain className="w-4 h-4" />;
            default: return <Tent className="w-4 h-4" />;
        }
    };

    // Travel Confirmation State
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<Location | null>(null);

    const handleTravelClick = (target: Location) => {
        if (!userProfile) return;
        setConfirmTarget(target);
    };

    const executeTravel = async () => {
        if (!confirmTarget || !userProfile?.id) return;
        const target = confirmTarget;
        setConfirmTarget(null); // Close modal

        setTraveling(true);
        isTravelingRef.current = true;
        setTravelLog([`旅の支度をしています...`]);

        try {
            // Get Token
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            // Call API
            const res = await fetch('/api/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ target_location_name: target.name })
            });

            if (res.ok) {
                const data = await res.json();

                // Animation Simulation
                const steps = Math.min(5, data.travel_days);
                for (let i = 1; i <= steps; i++) {
                    await new Promise(r => setTimeout(r, 800)); // Delay
                    setTravelLog(prev => [...prev, `${Math.ceil((data.travel_days / steps) * i)}日目が経過...`]);
                }

                setTravelLog(prev => [...prev, `目的地に到着しました。`]);
                await new Promise(r => setTimeout(r, 1000));

                // Ensure Hub State is cleared on Travel
                await supabase.from('user_hub_states').upsert({ user_id: userProfile.id, is_in_hub: false });

                // Refresh & Redirect
                await fetchUserProfile();
                await fetchWorldState();
                await fetchHubState();
                router.push('/inn'); // Go to Inn at new location
            } else {
                if (res.status === 401) {
                    alert("認証エラー: 移動するには再ログインが必要です。");
                } else {
                    alert("移動できませんでした。");
                }
                setTraveling(false);
                isTravelingRef.current = false;
            }
        } catch (e) {
            console.error(e);
            setTraveling(false);
            isTravelingRef.current = false;
        }
    };

    const returnToInn = async () => {
        if (!userProfile) return;
        // Explicitly Leave Hub
        try {
            await supabase
                .from('user_hub_states')
                .upsert({ user_id: userProfile.id, is_in_hub: false });

            router.push('/inn');
        } catch (e) {
            console.error("Failed to leave hub", e);
            router.push('/inn'); // Fallback
        }
    };

    const returnToHub = async () => {
        if (!userProfile) return;
        setTraveling(true);
        isTravelingRef.current = true;
        setTravelLog(['拠所への帰還を開始します...']);

        try {
            await new Promise(r => setTimeout(r, 10));

            // Set Hub State = TRUE
            const { error } = await supabase
                .from('user_hub_states')
                .upsert({ user_id: userProfile.id, is_in_hub: true });

            if (error) throw error;

            setTravelLog(prev => [...prev, '次元の狭間へ移動中...']);
            await new Promise(r => setTimeout(r, 800));

            router.push('/inn');
        } catch (e) {
            console.error("Failed to return to hub", e);
            alert("移動に失敗しました。");
        } finally {
            setTraveling(false);
            isTravelingRef.current = false;
        }
    };

    // Filter Logic for Render
    const visibleLocations = locations.filter(l => l.name !== '名もなき旅人の拠所');

    if (loading || isInitializingHub) {
        return (
            <div className="min-h-screen bg-[#050b14] flex flex-col items-center justify-center text-gray-300 font-serif">
                <Compass className="w-16 h-16 animate-spin-slow mb-4 opacity-70 text-[#a38b6b]" />
                <div className="text-xl tracking-widest animate-pulse text-[#e3d5b8]">
                    {isInitializingHub ? ('世界への扉を開いています...') : '地図を広げています...'}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050b14] text-gray-200 font-sans relative overflow-hidden flex flex-col items-center">

            {/* Header: Almanac Style */}
            <header className="w-full max-w-4xl p-4 z-20 flex justify-between items-end border-b border-[#a38b6b]/30 bg-[#0a121e]/90 backdrop-blur">
                <div>
                    <h1 className="text-xl font-serif text-[#a38b6b] flex items-center gap-2">
                        <Compass className="w-6 h-6" /> 世界地図
                    </h1>
                    <div className="text-xs text-gray-500 font-mono">World Map & Almanac</div>
                </div>
                <div className="text-right font-serif text-[#e3d5b8]">
                    <div className="text-lg tracking-widest">
                        世界暦 {year}年 {month}月 {day}日
                    </div>
                    <div className="text-sm text-[#a38b6b]">
                        {userProfile?.title_name} ( {userAge}歳 )
                    </div>
                </div>
            </header>

            {/* Nation Status Text Display (Outside Map) */}
            <div className="w-full max-w-4xl bg-[#0a121e] border-x border-[#a38b6b]/30 p-2 z-20">
                <div className="border border-[#a38b6b]/30 rounded p-2 bg-black/40">
                    <h3 className="text-center text-xs text-[#a38b6b] font-bold mb-2 tracking-widest border-b border-[#a38b6b]/20 pb-1 w-fit mx-auto px-4">— 国家の覇権 —</h3>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                        {(() => {
                            const validLocations = locations.filter(l => l.slug !== 'loc_hub' && l.type !== 'Hub' && l.name !== '名もなき旅人の拠所');
                            const total = validLocations.length;
                            if (total === 0) return null;
                            const counts: Record<string, number> = { 'Roland': 0, 'Markand': 0, 'Yato': 0, 'Karyu': 0, 'Neutral': 0 };
                            validLocations.forEach(l => {
                                const n = l.world_states?.[0]?.controlling_nation || l.nation_id || 'Neutral';
                                counts[n] = (counts[n] || 0) + 1;
                            });
                            const getLabel = (n: string) => {
                                switch (n) {
                                    case 'Roland': return 'ローランド';
                                    case 'Markand': return 'マーカンド';
                                    case 'Karyu': return '華龍神朝';
                                    case 'Yato': return '夜刀神国';
                                    default: return '中立';
                                }
                            };
                            const getColor = (n: string) => {
                                switch (n) {
                                    case 'Roland': return 'text-blue-400';
                                    case 'Markand': return 'text-yellow-400';
                                    case 'Karyu': return 'text-emerald-400';
                                    case 'Yato': return 'text-purple-400';
                                    default: return 'text-gray-400';
                                }
                            };

                            return ['Roland', 'Markand', 'Karyu', 'Yato'].map(n => (
                                <div key={n} className={`text-[10px] md:text-xs font-mono font-bold ${getColor(n)} flex items-center gap-2`}>
                                    <span>{getLabel(n)}</span>
                                    <span className="bg-white/10 px-1.5 rounded text-white">{String(Math.round((counts[n] / total) * 100)).padStart(2, '0')}%</span>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>



            {/* Map Area */}
            <main className="relative flex-1 w-full max-w-4xl overflow-hidden border-x border-[#a38b6b]/20 bg-[#1a202c]">
                {/* Background Grid/Texture */}
                <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay pointer-events-none"
                    style={{
                        backgroundImage: 'url(/aged-paper.png)',
                        backgroundSize: 'cover'
                    }}>
                </div>
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#a38b6b 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                </div>

                {/* Connection Lines (SVG) (Excluding Hidden Nodes) */}
                <svg className="absolute inset-0 z-0 w-full h-full pointer-events-none">
                    {visibleLocations.map(loc => {
                        const neighbors = loc.neighbors || {};
                        return Object.keys(neighbors).map(targetSlug => {
                            const target = locations.find(l => l.slug === targetSlug);
                            if (!target || target.name === '名もなき旅人の拠所') return null;
                            return (
                                <line
                                    key={`${loc.slug}-${target.slug}`}
                                    x1={loc.x + '%'} y1={loc.y + '%'}
                                    x2={target.x + '%'} y2={target.y + '%'}
                                    stroke="#a38b6b" strokeWidth="1" strokeDasharray="4 4" opacity="0.4"
                                />
                            );
                        });
                    })}
                </svg>

                {/* Layer 1: Icons (Interactive) */}
                {visibleLocations.map((loc: any) => {
                    const isCurrent = userProfile?.current_location_id === loc.id;
                    const nation = loc.world_states?.[0]?.controlling_nation || loc.nation_id || 'Neutral';
                    const nationStyle = getNationColor(nation);

                    // Neighbor Connectivity
                    const currentLocObj = locations.find(l => l.id === userProfile?.current_location_id);
                    let isConnected = false;
                    if (currentLocObj) {
                        const neighbors = currentLocObj.neighbors || {};
                        isConnected = !!neighbors[loc.slug];
                    } else {
                        // Hub/Descent logic
                        if (loc.type === 'Capital') isConnected = true;
                    }
                    const isWalkable = isConnected;

                    return (
                        <div
                            key={`icon-${loc.id}`}
                            className={`
                                absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer
                                ${isCurrent ? 'z-[60]' : 'z-[40]'}
                            `}
                            style={{ left: loc.x + '%', top: loc.y + '%' }}
                            onClick={() => isWalkable && !isCurrent && handleTravelClick(loc)}
                            onMouseEnter={() => setHoveredId(loc.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            {/* Icon Circle */}
                            <div className={`
                                w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg bg-[#050b14] transition-all duration-300
                                ${isCurrent ? 'border-white text-white shadow-white/50 animate-pulse' :
                                    (isWalkable ? `${nationStyle} ${hoveredId === loc.id ? 'scale-110 brightness-125' : ''}` : 'border-gray-700 text-gray-600 grayscale opacity-80')}
                            `}>
                                {getIcon(loc.type)}
                            </div>

                            {/* Hover info / Travel Estimate (Attached to Icon, but High Z) */}
                            {isWalkable && !isCurrent && hoveredId === loc.id && (
                                <div className="absolute top-10 bg-black/90 text-white text-[10px] p-2 rounded w-24 text-center z-[90] pointer-events-none border border-gold-600/30 shadow-xl">
                                    {(() => {
                                        const currentLoc = locations.find(l => l.id === userProfile?.current_location_id);
                                        if (!currentLoc) return '移動: 1日';
                                        const neighbors = currentLoc.neighbors || {};
                                        const days = neighbors[loc.slug] || 1;
                                        return `移動: ${days}日`;
                                    })()}
                                </div>
                            )}

                            {/* Current Indicator (Arrow/Text) */}
                            {isCurrent && !traveling && (
                                <>
                                    <div className="md:hidden absolute -top-6 text-xl text-white animate-bounce font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">↓</div>
                                    <div className="hidden md:block absolute -top-8 text-xs text-white animate-bounce font-bold drop-shadow-md whitespace-nowrap bg-black/50 px-2 rounded">YOU ARE HERE</div>
                                </>
                            )}
                        </div>
                    );
                })}

                {/* Layer 2: Labels (Topmost, Non-Interactive) */}
                <div className={`absolute inset-0 z-[80] pointer-events-none transition-opacity duration-300 ${traveling ? 'opacity-0' : 'opacity-100'}`}>
                    {visibleLocations.map(loc => {
                        const isCurrent = userProfile?.current_location_id === loc.id;
                        const isHovered = hoveredId === loc.id;
                        return (
                            <div
                                key={`label-${loc.id}`}
                                className={`
                                    absolute transform -translate-x-1/2 -translate-y-1/2 mt-1 md:mt-2 text-[8px] md:text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded backdrop-blur-sm whitespace-nowrap shadow-md transition-all duration-300
                                    ${isCurrent ? 'text-white bg-black/80 ring-1 ring-white/50 z-[81]' :
                                        (isHovered ? 'text-white bg-black/90 ring-1 ring-white/30 scale-105 z-[81]' : 'text-gray-300 bg-black/80')}
                                `}
                                style={{ left: loc.x + '%', top: `calc(${loc.y}% + 24px)` }}
                            >
                                {loc.name}
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Confirmation Modal */}
            {showEntryModal && (
                <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
                    <div className="bg-[#1a202c] border-2 border-[#a38b6b] p-6 max-w-2xl w-full shadow-2xl relative text-center">
                        <h3 className="text-2xl font-serif text-[#e3d5b8] mb-6 border-b border-[#a38b6b]/30 pb-4">
                            大地への降下
                        </h3>
                        <p className="text-gray-400 mb-8">
                            次元の狭間から、どの地へ降り立ちますか？
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {locations.filter(l => l.type === 'Capital').map(cap => (
                                <button
                                    key={cap.id}
                                    onClick={() => handleEntrySelect(cap)}
                                    className={`p-4 border border-gray-700 bg-gray-900/50 hover:bg-[#a38b6b]/20 hover:border-[#a38b6b] transition-all group text-left relative overflow-hidden`}
                                >
                                    <div className="font-bold text-lg text-[#e3d5b8] group-hover:text-white mb-1">
                                        {cap.name}
                                    </div>
                                    <div className="text-xs text-gray-500 group-hover:text-gray-300">
                                        {cap.nation_id || 'Neutral'} 首都
                                    </div>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Compass className="w-6 h-6 text-[#a38b6b]" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {confirmTarget && (
                <div className="fixed inset-0 z-[250] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#1a202c] border-2 border-[#a38b6b] p-6 max-w-sm w-full shadow-2xl relative text-center">
                        <h3 className="text-xl font-serif text-[#e3d5b8] mb-4 border-b border-[#a38b6b]/30 pb-2">
                            移动の確認
                        </h3>
                        <div className="text-gray-300 mb-6 space-y-2">
                            <p>
                                <span className="text-white font-bold text-lg">{confirmTarget.name}</span> へ移動しますか？
                            </p>
                            <p className="text-sm text-[#a38b6b]">
                                所要時間:
                                {(() => {
                                    const currentLoc = locations.find(l => l.id === userProfile?.current_location_id);
                                    if (!currentLoc) return ' 1';
                                    const neighbors = currentLoc.neighbors || {};
                                    return ` ${neighbors[confirmTarget.slug] || 1}`;
                                })()}
                                日
                            </p>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => setConfirmTarget(null)}
                                className="px-4 py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={executeTravel}
                                className="px-4 py-2 bg-[#a38b6b] text-black font-bold hover:bg-[#e3d5b8] transition-colors"
                            >
                                {confirmTarget.name} へ出発
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Travel Overlay */}
            {traveling && (
                <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center p-8">
                    <Compass className="w-16 h-16 text-[#a38b6b] animate-spin-slow mb-6 opacity-80" />
                    <h2 className="text-2xl font-serif text-[#e3d5b8] mb-4">ただいま移動中...</h2>
                    <div className="space-y-2 text-center text-gray-400 font-mono text-sm h-32 overflow-hidden">
                        {travelLog.map((log, i) => (
                            <div key={i} className="animate-fade-in-up">{log}</div>
                        ))}
                    </div>
                </div>
            )}

            {/* Nav Footer */}
            <div className="p-4 w-full max-w-4xl flex flex-col items-center gap-4 z-20 bg-[#0a121e]/90 border-t border-[#a38b6b]/30">
                <div className="flex gap-4">
                    <button onClick={returnToInn} className="text-gray-400 hover:text-white text-sm flex items-center justify-center gap-2 px-4 py-2 border border-gray-700 rounded hover:border-white transition-colors">
                        宿屋に戻る
                    </button>

                    <button
                        onClick={returnToHub}
                        className="text-[#a38b6b] hover:text-[#e3d5b8] text-sm flex items-center justify-center gap-2 px-4 py-2 border border-[#a38b6b] rounded hover:shadow-[0_0_10px_#a38b6b] transition-all"
                    >
                        <Tent className="w-4 h-4" /> 拠点への帰還
                    </button>
                </div>
            </div>
        </div>
    );
}
