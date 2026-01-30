'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { Location } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { Map as MapIcon, Compass, Anchor, Castle, Mountain, Tent } from 'lucide-react';

// Client-side supabase for static data
// const supabase = createClientComponentClient();

export default function WorldMapPage() {
    const router = useRouter();
    const { userProfile, worldState, fetchUserProfile, fetchWorldState } = useGameStore();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [traveling, setTraveling] = useState(false);
    const [travelLog, setTravelLog] = useState<string[]>([]);
    const [isInitializingHub, setIsInitializingHub] = useState(false);

    // Fetch Locations & Nation Data
    useEffect(() => {
        async function init() {
            setLoading(true);
            // Fetch locations with their current controlling nation
            const { data } = await supabase
                .from('locations')
                .select('*, world_states(controlling_nation)');

            if (data) setLocations(data as any); // Type assertion for join

            await fetchUserProfile();
            await fetchWorldState(); // Global date
            setLoading(false);
        }
        init();
    }, [fetchUserProfile, fetchWorldState]);

    // Hub & Travel Logic
    useEffect(() => {
        const handleHubLogic = async () => {
            if (!userProfile || !locations.length) return;

            const currentLoc = locations.find(l => l.id === userProfile.current_location_id);

            // Treat NULL location as Hub (Start of game condition)
            if (!userProfile.current_location_id || currentLoc?.name === '名もなき旅人の拠所' || currentLoc?.type === 'Hub' || userProfile.current_location_id === '00000000-0000-0000-0000-000000000000') {
                setIsInitializingHub(true);
                // We are physically at the Hub/Inn.
                // When opening the map, we should "exit" the pocket dimension back to reality.

                let targetLocId = userProfile.previous_location_id;

                // Logic: If NO previous location (Fresh Start), Pick Random Capital
                const isFreshStart = !targetLocId;
                if (isFreshStart) {
                    // First time leaving Hub (New Game) -> Random Capital
                    const capitals = locations.filter(l => l.type === 'Capital');
                    if (capitals.length > 0) {
                        const randomCap = capitals[Math.floor(Math.random() * capitals.length)];
                        targetLocId = randomCap.id;
                    }
                }

                if (targetLocId) {
                    // Teleport user to the target location on the map
                    // We simply update the profile state to "be" there visually on the map
                    // effectively "exiting" the hub.

                    // Update DB to reflect this move (Leaving Hub)
                    const { error } = await supabase
                        .from('user_profiles')
                        .update({ current_location_id: targetLocId })
                        .eq('id', userProfile.id);

                    if (!error) {
                        await fetchUserProfile(); // Refresh local state
                    }
                }

                setTimeout(() => setIsInitializingHub(false), 800);
            }
        };

        if (!loading && userProfile && locations.length > 0) {
            handleHubLogic();
        }
    }, [userProfile?.current_location_id, locations, loading, fetchUserProfile, userProfile?.id, userProfile?.previous_location_id]);

    // Calendar & Age Computation
    const totalDays = worldState?.total_days_passed || 0;
    const year = 100 + Math.floor(totalDays / 365);
    const month = 1 + Math.floor((totalDays % 365) / 30);
    const day = 1 + (totalDays % 30);

    const userAge = userProfile?.age || 20;

    const getNationColor = (nationId: string) => {
        switch (nationId) {
            case 'Roland': return 'border-blue-500 shadow-blue-500/50 text-blue-200';
            case 'Markand': return 'border-yellow-600 shadow-yellow-600/50 text-yellow-200';
            case 'Karyu': return 'border-emerald-600 shadow-emerald-500/50 text-emerald-200';
            case 'Yato': return 'border-purple-600 shadow-purple-500/50 text-purple-200';
            default: return 'border-gray-600 shadow-gray-500/50 text-gray-400';
        }
    };

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

    // ... handleTravel ...

    // Travel Confirmation State
    const [confirmTarget, setConfirmTarget] = useState<Location | null>(null);

    const handleTravelClick = (target: Location) => {
        if (!userProfile) return;
        setConfirmTarget(target);
    };

    const executeTravel = async () => {
        if (!confirmTarget) return;
        const target = confirmTarget;
        setConfirmTarget(null); // Close modal

        setTraveling(true);
        setTravelLog([`旅の支度をしています...`]);

        try {
            // Call API
            const res = await fetch('/api/move', {
                method: 'POST',
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

                // Refresh & Redirect
                await fetchUserProfile();
                await fetchWorldState();
                router.push('/inn'); // Go to Inn at new location
            } else {
                alert("移動できませんでした。");
                setTraveling(false);
            }
        } catch (e) {
            console.error(e);
            setTraveling(false);
        }
    };

    const returnToHub = async () => {
        if (!userProfile) return;

        // Immediate visual feedback to prevent INP warning
        setTraveling(true);
        setTravelLog(['拠所への帰還を開始します...']);

        try {
            // 1. Save current location as previous
            // 2. Set current to Hub
            const hub = locations.find(l => l.name === '名もなき旅人の拠所');
            if (!hub) {
                setTraveling(false);
                return;
            }

            // Yield to main thread briefly to allow UI to paint
            await new Promise(r => setTimeout(r, 10));

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    previous_location_id: userProfile.current_location_id,
                    current_location_id: hub.id
                })
                .eq('id', userProfile.id);

            if (error) throw error;

            // Add slight delay for smoothness
            setTravelLog(prev => [...prev, '移動完了。']);
            await new Promise(r => setTimeout(r, 500));

            router.push('/inn');
        } catch (e) {
            console.error("Failed to return to hub", e);
            alert("移動に失敗しました。");
            setTraveling(false);
        }
    };

    // Filter Logic for Render
    const visibleLocations = locations.filter(l => l.name !== '名もなき旅人の拠所');

    if (loading || isInitializingHub) {
        return (
            <div className="min-h-screen bg-[#050b14] flex flex-col items-center justify-center text-gray-300 font-serif">
                <Compass className="w-16 h-16 animate-spin-slow mb-4 opacity-70 text-[#a38b6b]" />
                <div className="text-xl tracking-widest animate-pulse text-[#e3d5b8]">
                    {isInitializingHub ? '世界への扉を開いています...' : '地図を広げています...'}
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
                            const total = locations.length;
                            if (total === 0) return null;
                            const counts: Record<string, number> = { 'Roland': 0, 'Markand': 0, 'Yato': 0, 'Karyu': 0, 'Neutral': 0 };
                            locations.forEach(l => {
                                const n = l.world_states?.[0]?.controlling_nation || l.nation_id || 'Neutral';
                                counts[n] = (counts[n] || 0) + 1;
                            });
                            const getLabel = (n: string) => {
                                switch (n) {
                                    case 'Roland': return 'ローランド';
                                    case 'Markand': return 'マーカンド';
                                    case 'Karyu': return '火龍の民';
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
                        return loc.connections.map(targetName => {
                            const target = locations.find(l => l.name === targetName);
                            // Don't draw line to hidden hub
                            if (!target || target.name === '名もなき旅人の拠所') return null;
                            return (
                                <line
                                    key={`${loc.name}-${target.name}`}
                                    x1={(loc.x / 10) + '%'} y1={(loc.y / 10) + '%'}
                                    x2={(target.x / 10) + '%'} y2={(target.y / 10) + '%'}
                                    stroke="#a38b6b" strokeWidth="1" strokeDasharray="4 4" opacity="0.4"
                                />
                            );
                        });
                    })}
                </svg>

                {/* Nodes (Filter out Hub) */}
                {visibleLocations.map((loc: any) => {
                    const isCurrent = userProfile?.current_location_id === loc.id;
                    const nation = loc.world_states?.[0]?.controlling_nation || loc.nation_id || 'Neutral';
                    const nationStyle = getNationColor(nation);

                    // Normal Connectivity
                    const currentLocObj = locations.find(l => l.id === userProfile?.current_location_id);
                    let isConnected = false;
                    if (currentLocObj) {
                        isConnected = currentLocObj.connections.includes(loc.name);
                    } else {
                        // Fallback: If location is missing/null (e.g. New Game), treat as Hub (Connect to Capitals)
                        // Or specifically Roland Capital as start
                        if (loc.type === 'Capital') isConnected = true;
                    }

                    const isWalkable = isConnected;

                    return (
                        <div
                            key={loc.id}
                            className={`
                                absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group 
                                ${isCurrent ? 'z-[60]' : 'z-[40] hover:z-[60]'}
                            `}
                            style={{ left: (loc.x / 10) + '%', top: (loc.y / 10) + '%' }}
                            onClick={() => isWalkable && !isCurrent && handleTravelClick(loc)}
                        >
                            {/* Icon Circle */}
                            <div className={`
                                w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg bg-[#050b14] z-10 transition-colors
                                ${isCurrent ? 'border-white text-white shadow-white/50 animate-pulse' : (isWalkable ? nationStyle : 'border-gray-700 text-gray-600')}
                            `}>
                                {getIcon(loc.type)}
                            </div>

                            {/* Label */}
                            <div className={`mt-1 md:mt-2 text-[8px] md:text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded backdrop-blur-sm whitespace-nowrap relative z-[70] shadow-md
                                ${isCurrent ? 'text-white bg-black/80 ring-1 ring-white/50' : 'text-gray-300 bg-black/80 group-hover:text-white group-hover:bg-black/90 group-hover:ring-1 group-hover:ring-white/30'}
                            `}>
                                {loc.name}
                            </div>

                            {/* Nation Flag - Color Only (No Text) */}
                            {/* Requested to remove text, just keep color hint if needed, or rely on border */}
                            {/* <div className={`absolute -bottom-4 text-[8px] uppercase tracking-widest px-1 rounded bg-black/80 ${nationStyle.split(' ')[2]}`}>
                                {nation}
                            </div> */}

                            {/* Hover info / Travel Estimate */}
                            {isWalkable && !isCurrent && (
                                <div className="absolute top-10  opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] p-2 rounded w-24 text-center z-50 pointer-events-none border border-gold-600/30">
                                    {(() => {
                                        // Calc distance
                                        const currentLoc = locations.find(l => l.id === userProfile?.current_location_id);
                                        // If at Hub (500,500), distance logic works fine
                                        if (!currentLoc) return 'Unknown';
                                        const dist = Math.sqrt(Math.pow(loc.x - currentLoc.x, 2) + Math.pow(loc.y - currentLoc.y, 2));
                                        const days = Math.max(1, Math.ceil(dist * 0.05));
                                        return `移動: 約${days}日`;
                                    })()}
                                </div>
                            )}

                            {/* Current Indicator */}
                            {isCurrent && (
                                <>
                                    {/* Mobile: Blinking Arrow */}
                                    <div className="md:hidden absolute -top-6 text-xl text-white animate-bounce font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                        ↓
                                    </div>
                                    {/* PC: Text */}
                                    <div className="hidden md:block absolute -top-8 text-xs text-white animate-bounce font-bold drop-shadow-md whitespace-nowrap bg-black/50 px-2 rounded">
                                        YOU ARE HERE
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </main>

            {/* Confirmation Modal */}
            {confirmTarget && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#1a202c] border-2 border-[#a38b6b] p-6 max-w-sm w-full shadow-2xl relative text-center">
                        <h3 className="text-xl font-serif text-[#e3d5b8] mb-4 border-b border-[#a38b6b]/30 pb-2">
                            移动の確認
                        </h3>
                        <div className="text-gray-300 mb-6 space-y-2">
                            <p>
                                <span className="text-white font-bold text-lg">{confirmTarget.name}</span> へ移動しますか？
                            </p>
                            <p className="text-sm text-[#a38b6b]">
                                所要時間: 約
                                {(() => {
                                    const currentLoc = locations.find(l => l.id === userProfile?.current_location_id);
                                    if (!currentLoc) return '??';
                                    const dist = Math.sqrt(Math.pow(confirmTarget.x - currentLoc.x, 2) + Math.pow(confirmTarget.y - currentLoc.y, 2));
                                    return Math.max(1, Math.ceil(dist * 0.05));
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
                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8">
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
                    <button onClick={() => router.push('/inn')} className="text-gray-400 hover:text-white text-sm flex items-center justify-center gap-2 px-4 py-2 border border-gray-700 rounded hover:border-white transition-colors">
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
