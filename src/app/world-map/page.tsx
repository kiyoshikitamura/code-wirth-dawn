'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { Location } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { Map as MapIcon, Compass, Anchor, Castle, Mountain, Tent } from 'lucide-react';
import { getNationNodeColor } from '@/utils/nationColors';
import { HUB_LOCATION_ID, LEGACY_ZERO_UUID } from '@/utils/constants';

import GlobalStatusBar from '@/components/world/GlobalStatusBar';
import LocalMapView, { MappedLocation } from '@/components/world/LocalMapView';
import LocationDetailSheet from '@/components/world/LocationDetailSheet';
import WorldAtlasOverlay from '@/components/world/WorldAtlasOverlay';

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

            // 背景画像のプリロード（データ取得と並行して実行）
            const bgPreload = new Promise<void>((resolve) => {
                const img = new window.Image();
                img.onload = () => resolve();
                img.onerror = () => resolve(); // エラー時もブロックしない
                img.src = '/backgrounds/worldmap.png';
            });

            // ロケーションデータと国家情報を取得
            const { data } = await supabase
                .from('locations')
                .select('*, world_states(controlling_nation)');

            if (data) {
                const mapped = data.map((l: any) => ({
                    ...l,
                    x: l.x !== null ? l.x : null,
                    y: l.y !== null ? l.y : null
                }));
                setLocations(mapped as Location[]);
            }

            await fetchUserProfile();
            await fetchHubState();
            await fetchWorldState();

            // 背景画像の読み込み完了を待機してからローディング解除
            await bgPreload;
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
            const isZeroUUID = !userProfile.current_location_id || userProfile.current_location_id === LEGACY_ZERO_UUID;

            // 2. Check actual Location Data
            const currentLoc = locations.find(l => l.id === userProfile.current_location_id);
            // Show descent modal ONLY if the user is stuck at the legacy "名もなき旅人の拠所" explicitly, or no valid location.
            const isLegacyHub = currentLoc?.name === '名もなき旅人の拠所';

            // "Descent from Heaven" Logic: Show modal ONLY if strictly at legacy hub or Zero ID (Fresh Start/Reset)
            // If they are at loc_border_town (国境の町), they should NOT see the descent modal.
            if (isZeroUUID || isLegacyHub) {
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
    const year = 742 + Math.floor(totalDays / 365);
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

    // Map UI States
    const [showFullMap, setShowFullMap] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<MappedLocation | null>(null);
    const [bribeModal, setBribeModal] = useState<{ target: MappedLocation, cost: number, message: string } | null>(null);

    const handleBribe = async () => {
        if (!bribeModal || !userProfile?.id) return;
        const targetId = bribeModal.target.id;
        setBribeModal(null);
        setTraveling(true);
        isTravelingRef.current = true;
        setTravelLog([`衛兵に賄賂を渡しています...`]);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const res = await fetch('/api/move/bribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    'x-user-id': userProfile.id
                },
                body: JSON.stringify({ target_location_id: targetId })
            });

            if (res.ok) {
                setTravelLog(prev => [...prev, `衛兵は無言で道を開けた。目的地へ向かいます...`]);
                await new Promise(r => setTimeout(r, 1000));
                await fetchUserProfile();
                await fetchWorldState();
                setTimeout(() => {
                    setTraveling(false);
                    isTravelingRef.current = false;
                }, 500);
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "賄賂が受け取られませんでした。");
                setTraveling(false);
                isTravelingRef.current = false;
            }
        } catch (e) {
            console.error(e);
            setTraveling(false);
            isTravelingRef.current = false;
        }
    };

    const executeTravel = async (target: MappedLocation) => {
        if (!userProfile?.id) return;
        setSelectedLocation(null); // Close sheet

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
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    ...(userProfile?.id ? { 'x-user-id': userProfile.id } : {})
                },
                body: JSON.stringify({ target_location_name: target.name })
            });

            if (res.ok) {
                const data = await res.json();

                if (data.require_battle) {
                    alert(data.message || "敵襲だ！");
                    const enemyName = data.require_battle === 'bounty_hunter_ambush' ? '賞金稼ぎ' : '無法者';
                    const encounterEnemy: any = {
                        id: data.encounter_enemy_group_slug,
                        name: enemyName,
                        hp: 300, maxHp: 300, atk: 15, def: 5, level: 20, status_effects: []
                    };
                    useGameStore.getState().startBattle([encounterEnemy]);
                    router.push(`/battle?type=${data.require_battle}&target=${data.target_location_id}&origin=${data.origin_location_id}`);
                    return;
                }

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
                setTimeout(() => {
                    setTraveling(false);
                    isTravelingRef.current = false;
                }, 500);
            } else {
                const data = await res.json().catch(() => ({}));

                if (res.status === 403) {
                    if (data.error_code === 'NEED_PASS_OR_BRIBE') {
                        setBribeModal({ target, cost: data.bribe_cost, message: data.message });
                        setTraveling(false);
                        isTravelingRef.current = false;
                        return;
                    } else if (data.error_code === 'NEED_PASS') {
                        alert(data.message || data.error || "許可証が必要です。");
                        setTraveling(false);
                        isTravelingRef.current = false;
                        return;
                    }
                }

                if (res.status === 401) {
                    alert("認証エラー: 移動するには再ログインが必要です。");
                } else {
                    alert(data.error || "移動できませんでした。");
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
    const visibleLocations = locations.filter(l =>
        l.name !== '名もなき旅人の拠所' && l.id !== HUB_LOCATION_ID
    );

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

    // --- Derived Map Data ---
    const currentLocId = userProfile?.current_location_id;
    const currentLocObj = locations.find(l => l.id === currentLocId);

    const mappedLocations: MappedLocation[] = locations.map(loc => {
        const isCurrent = loc.id === currentLocId;

        let reachable = false;
        let days = 1;
        let cost = 0;

        if (currentLocObj) {
            const neighbors = currentLocObj.neighbors || {};
            const nd = neighbors[loc.slug];
            if (nd) {
                reachable = true;
                days = typeof nd === 'object' ? nd.days : nd;
                cost = typeof nd === 'object' ? nd.gold_cost : 0;
            }
        } else if (loc.type === 'Capital') {
            reachable = true; // From Hub
        }

        const prosperity = loc.prosperity_level || 3;
        let typeStyle: 'prosperous' | 'normal' | 'collapsed' = 'normal';
        let statusLabel = '通常域';
        if (prosperity >= 4) { typeStyle = 'prosperous'; statusLabel = '繁栄域'; }
        if (prosperity <= 1) { typeStyle = 'collapsed'; statusLabel = '崩壊域'; }

        let emblem = '・';
        if (loc.type === 'Capital') emblem = '🏰';
        else if (loc.type === 'City' || loc.type === 'Town') emblem = '🏘️';
        else if (loc.type === 'Dungeon') emblem = '⚔️';
        else if (loc.type === 'Field') emblem = '🌲';
        else emblem = '⛺';

        return {
            ...loc,
            isCurrent,
            reachable,
            statusLabel,
            typeStyle,
            emblem,
            travelDays: days,
            travelCost: cost
        } as MappedLocation;
    });

    const validMappedLocations = mappedLocations.filter(l => l.slug !== HUB_LOCATION_ID && l.name !== '名もなき旅人の拠所');
    const localMapLocations = validMappedLocations.filter(l => l.isCurrent || l.reachable);
    const currentLocationName = currentLocObj ? currentLocObj.name : '国境の町';
    // ---

    return (
        <div className="h-[100dvh] bg-[#050b14] text-gray-200 font-sans relative overflow-hidden flex flex-col items-center">

            <GlobalStatusBar
                currentLocationName={currentLocationName}
                onEnterLocation={returnToInn}
                onReturnHome={returnToHub}
            />

            <LocalMapView
                visibleLocations={localMapLocations}
                onSelectLocation={(loc) => setSelectedLocation(loc)}
                onOpenWorldMap={() => setShowFullMap(true)}
            />

            <LocationDetailSheet
                selectedLocation={selectedLocation}
                onClose={() => setSelectedLocation(null)}
                onTravel={(loc) => executeTravel(loc)}
            />

            <WorldAtlasOverlay
                show={showFullMap}
                allLocations={validMappedLocations}
                onClose={() => setShowFullMap(false)}
            />


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
            {/* Bribe Modal */}
            {bribeModal && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a202c] border-2 border-red-900 rounded p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95">
                        <h3 className="text-xl font-bold text-red-500 mb-4 font-serif flex items-center gap-2">
                            <span>🛑</span> 通行制限
                        </h3>
                        <p className="text-gray-300 mb-6 text-sm leading-relaxed whitespace-pre-wrap">{bribeModal.message}</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setBribeModal(null)}
                                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded transition whitespace-nowrap"
                            >
                                出直す
                            </button>
                            <button
                                onClick={handleBribe}
                                className="flex-1 py-2 bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-700 rounded transition flex flex-col items-center justify-center gap-0.5"
                            >
                                <span className="font-bold">賄賂を渡す</span>
                                <span className="text-[10px] text-red-400 font-mono">({bribeModal.cost.toLocaleString()}G)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
