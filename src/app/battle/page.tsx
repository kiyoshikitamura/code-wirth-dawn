'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';
import { Shield, Sword, Sparkles, Heart, Footprints, Settings, Skull, Clock, Target, Users, User } from 'lucide-react';
import Image from 'next/image';
import { hasTaunt, StatusEffect } from '@/lib/statusEffects';

export default function BattlePage() {
    const router = useRouter();
    const hasHydrated = useGameStore(state => state._hasHydrated);
    const {
        battleState,
        hand,
        initializeBattle,
        attackEnemy,
        endTurn,
        waitTurn,
        setTactic,
        fleeBattle,
        selectedScenario,
        fetchUserProfile,
        userProfile,
        setTarget
    } = useGameStore();

    const [logs, setLogs] = useState<string[]>([]);
    const [isWaiting, setIsWaiting] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // We only initialize if direct access (not from Pub attack) or if hand is empty (bug recovery)
    useEffect(() => {
        console.log("[BattlePage] Mounted. Enemy:", battleState.enemy, "Hand:", hand.length);
        fetchUserProfile();

        // Only initialize fallback if hydrated and still no enemy
        const hydrated = useGameStore.persist.hasHydrated();
        if (hydrated && !battleState.enemy) {
            console.log("[BattlePage] Initializing Battle (Fallback)...");
            console.warn("No enemy found in state. Loading dummy battle.");
            initializeBattle();
        }
    }, []);

    useEffect(() => {
        setLogs(battleState.messages);
    }, [battleState.messages]);

    // Update: Handle Pub NPC Death
    useEffect(() => {
        if (battleState.isVictory && !selectedScenario && battleState.enemy?.id) {
            // If it's a victory and NOT a scenario (i.e. Pub Battle), eliminate the NPC.
            fetch('/api/pub', {
                method: 'POST',
                body: JSON.stringify({ action: 'kill', npc_id: battleState.enemy.id })
            }).catch(err => console.error("Failed to eliminate NPC:", err));
        }
    }, [battleState.isVictory, selectedScenario, battleState.enemy]);

    const handleCardClick = async (index: number) => {
        if (battleState.isVictory) return;
        const card = hand[index];
        await attackEnemy(card);
        // Turn handling is now automatic in attackEnemy
    };

    const handleFlee = () => {
        if (confirm("本当に逃げますか？")) {
            fleeBattle();
        }
    };

    const handleWait = async () => {
        if (battleState.isVictory || battleState.isDefeat || isWaiting) return;
        setIsWaiting(true);
        await waitTurn();
        setIsWaiting(false);
    };

    const handleEndTurn = async () => {
        if (battleState.isVictory || battleState.isDefeat) return;
        await endTurn();
    };

    // State for result overlay visibility
    const [showResultOverlay, setShowResultOverlay] = useState(false);
    const [isReviewingLogs, setIsReviewingLogs] = useState(false);

    // Effect to handle result overlay delay
    useEffect(() => {
        if (battleState.isVictory || battleState.isDefeat || (!battleState.isVictory && battleState.messages.includes("一行は逃げ出した..."))) {
            // Delay showing the overlay to allow reading final logs
            const timer = setTimeout(() => {
                setShowResultOverlay(true);
            }, 2000); // 2 second delay
            return () => clearTimeout(timer);
        }
    }, [battleState.isVictory, battleState.isDefeat, battleState.messages]);

    // Fix: Allow rendering if victory/defeat, even if enemy is null (all dead)
    if (!hasHydrated) return <div className="p-8 text-white min-h-screen bg-gray-900 flex items-center justify-center">Loading Data...</div>;
    if (!battleState.enemy && !battleState.isVictory && !battleState.isDefeat) return <div className="p-8 text-white min-h-screen bg-gray-900 flex items-center justify-center">Loading Battle...</div>;

    const target = battleState.enemy; // Current target
    const enemies = battleState.enemies || (battleState.enemy ? [battleState.enemy] : []); // Fallback

    // Determine if we should show the overlay (based on state and log review toggle)
    const isResultActive = (battleState.isVictory || battleState.isDefeat || (!battleState.isVictory && battleState.messages.includes("一行は逃げ出した...")));
    const shouldShowOverlay = isResultActive && showResultOverlay && !isReviewingLogs;

    return (
        <div className="h-screen w-full bg-gray-900 text-gray-100 font-sans relative flex flex-col overflow-hidden">
            {/* Background Image (Optional) */}
            <div className="absolute inset-0 z-0 opacity-30">
                <Image
                    src="/backgrounds/battle_bg.png"
                    alt="Battle BG"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* HEADER: Quest/Enemy Name */}
            <header className="relative z-10 w-full p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center border-b border-gray-700">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-serif font-bold text-red-400 tracking-wider flex items-center gap-2">
                        <Sword className="w-5 h-5" />
                        {selectedScenario ? `依頼: ${selectedScenario.title}` : `VS ${target ? target.name : (enemies[0]?.name + 'たち')}`}
                    </h1>
                </div>

                {/* Escape Button Removed from Header */}
            </header>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
                <main className="flex flex-col p-4 gap-4 max-w-6xl mx-auto w-full min-h-full pb-0">

                    {/* TOP SECTION: Party Icons (Left) vs Enemy (Center/Right) */}
                    <div className="flex gap-8 shrink-0">

                        {/* LEFT: Party Members (Icons) */}
                        <div className="w-1/4 flex flex-col gap-1">
                            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                {/* Player Status (Side-by-Side HP/AP) */}
                                <div className="flex flex-col gap-2 bg-black/40 p-2 rounded border-l-2 border-blue-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-gray-500 relative shrink-0">
                                            <div className="w-full h-full bg-blue-900/50 flex items-center justify-center text-[10px]">You</div>
                                        </div>
                                        <div className="text-sm font-bold truncate flex-1">{userProfile?.name || 'あなた'}</div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <div className="text-blue-300 font-mono bg-black/30 px-1 rounded">
                                            HP {useGameStore.getState().userProfile?.hp ?? '?'}/{useGameStore.getState().userProfile?.max_hp ?? '?'}
                                        </div>
                                        <div className="text-yellow-500 font-mono bg-black/30 px-1 rounded">
                                            AP {battleState.current_ap ?? 0}/10
                                        </div>
                                    </div>
                                    {/* AP Visual */}
                                    <div className="flex gap-0.5 h-1.5 w-full mt-1">
                                        {[...Array(10)].map((_, i) => (
                                            <div key={i} className={`flex-1 rounded-[1px] ${i < (battleState.current_ap ?? 0) ? 'bg-yellow-400' : 'bg-gray-800'}`} />
                                        ))}
                                    </div>
                                </div>


                                {/* Equipment (NPC) Members - Label Removed */}
                                {battleState.party.map((member) => {
                                    const isLost = member.durability <= 0 || !member.is_active;
                                    return (
                                        <div key={member.id} className={`flex items-center gap-3 p-2 rounded border-l-4 transition-all ${isLost ? 'bg-red-900/10 border-red-900 opacity-50 grayscale' : 'bg-gray-800/40 border-amber-600'}`}>
                                            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-gray-500 relative shrink-0">
                                                <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs text-gray-400">{member.name[0]}</div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className={`text-xs font-bold leading-none ${isLost ? 'text-red-500 line-through' : 'text-amber-100'}`}>{member.name}</div>
                                                    {!isLost && (
                                                        <div className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-900/20 px-1 rounded border border-blue-900/50">
                                                            <Shield className="w-2.5 h-2.5" />
                                                            {member.cover_rate}%
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Durability Bar */}
                                                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden relative">
                                                    <div
                                                        className={`h-full transition-all duration-300 ${isLost ? 'bg-red-900' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.max(0, Math.min(100, (member.durability / member.max_durability) * 100))}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[10px] mt-0.5">
                                                    <span className={isLost ? 'text-red-700' : 'text-green-500'}>{member.durability}/{member.max_durability}</span>
                                                    <span className="text-gray-500">{member.job_class}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* CENTER: Enemies & Visuals */}
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            {/* Enemies Container */}
                            <div className="flex flex-row gap-4 justify-center items-center mb-12 flex-wrap">
                                {enemies.map((enemy) => {
                                    const isTarget = target?.id === enemy.id;
                                    const isDead = enemy.hp <= 0;

                                    return (
                                        <div
                                            key={enemy.id}
                                            className={`relative group transition-all duration-300 ${isDead ? 'opacity-50 grayscale scale-90' : 'hover:scale-105'} ${isTarget ? 'scale-110 z-10' : 'scale-100'}`}
                                            onClick={() => !isDead && setTarget(enemy.id)}
                                        >
                                            {/* Selection Indicator */}
                                            {isTarget && !isDead && (
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-red-500 animate-bounce">
                                                    <Target className="w-8 h-8 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                                </div>
                                            )}

                                            <div className={`w-28 h-28 sm:w-32 sm:h-32 relative ${battleState.isVictory ? 'opacity-50 grayscale transition-opacity duration-1000' : ''}`}>
                                                <div className={`w-full h-full bg-gradient-to-br from-red-900 to-black rounded-lg shadow-lg flex items-center justify-center border-2 transform transition-all cursor-pointer
                                                    ${isTarget ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] rotate-0' : 'border-red-900 rotate-2'}
                                                    ${hasTaunt((enemy.status_effects || []) as StatusEffect[]) ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]' : ''}
                                                `}>
                                                    <Skull className={`w-12 h-12 ${isDead ? 'text-gray-600' : 'text-red-500/80'}`} />
                                                </div>

                                                {/* Status Effects / Taunt */}
                                                {hasTaunt((enemy.status_effects || []) as StatusEffect[]) && (
                                                    <div className="absolute -top-3 -right-3 bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded-full border border-orange-400 shadow animate-bounce">
                                                        TAUNT
                                                    </div>
                                                )}

                                                {/* Damage Text (Placeholder for future animation) */}
                                            </div>

                                            {/* Enemy Info Card */}
                                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 sm:w-48 bg-black/80 p-2 rounded border border-red-900/50 text-center shadow-md backdrop-blur-sm pointer-events-none">
                                                <h2 className={`text-sm font-bold truncate mb-1 ${isDead ? 'text-gray-500 line-through' : 'text-red-100'}`}>
                                                    {enemy.name} <span className="text-[10px] text-red-400 font-normal">Lv.{enemy.level}</span>
                                                </h2>
                                                {!isDead && (
                                                    <>
                                                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden relative mb-1">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-red-900 to-red-600 transition-all duration-300"
                                                                style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-red-300 flex justify-between px-1">
                                                            <span>{enemy.hp}/{enemy.maxHp}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT: Commands */}
                        <div className="w-1/4 flex flex-col gap-4">
                            <div className="bg-black/40 border border-gray-700 rounded p-4 flex flex-col gap-3">
                                <div className="text-xs text-gray-400 font-bold uppercase tracking-widest border-b border-gray-700 pb-1 mb-2">Commands</div>

                                {/* Wait Button */}
                                <button
                                    onClick={handleWait}
                                    disabled={battleState.isVictory || battleState.isDefeat || isWaiting}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-gray-200 transition disabled:opacity-50"
                                >
                                    {isWaiting ? (
                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Clock className="w-4 h-4 text-blue-400" />
                                    )}
                                    <span className="text-sm font-bold">様子を見る</span>
                                </button>

                                {/* Flee Button */}
                                <button
                                    onClick={handleFlee}
                                    disabled={battleState.isVictory || battleState.isDefeat}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-950/50 hover:bg-red-900/80 border border-red-900 rounded text-red-400 transition"
                                >
                                    <Footprints className="w-4 h-4" />
                                    <span className="text-sm font-bold">逃げる</span>
                                </button>

                                {/* End Turn Button */}
                                <button
                                    onClick={handleEndTurn}
                                    disabled={battleState.isVictory || battleState.isDefeat}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-900/40 hover:bg-yellow-800/60 border border-yellow-700 rounded text-yellow-300 transition disabled:opacity-50"
                                >
                                    <Sword className="w-4 h-4 text-yellow-400" />
                                    <span className="text-sm font-bold">ターン終了</span>
                                </button>
                            </div>

                            {/* Additional Info / Tactic (Placeholder) */}

                        </div>
                    </div>

                    {/* BOTTOM AREA: Logs Above Deck */}
                    <div className="flex-1 flex flex-col gap-2 min-h-0 relative">
                        {/* Battle Logs - Centered and Same Width as Deck - FIXED HEIGHT & SCROLL */}
                        <div className="absolute inset-x-0 bottom-0 top-0 mx-auto w-full max-w-4xl bg-black/70 border border-gray-700 rounded p-2 overflow-y-auto font-mono text-sm space-y-1 shadow-inner scrollbar-thin px-4">
                            {logs.map((log, i) => (
                                <div key={i} className="animate-fade-in border-b border-gray-800/50 pb-1 last:border-0 text-gray-300">
                                    <span className="text-blue-500 mr-2">▶</span>
                                    {log}
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>

                </main>
            </div>

            {/* FIXED BOTTOM DECK AREA */}
            <footer className="h-48 pt-4 border-t border-gray-800 bg-black/60 backdrop-blur-md relative z-20 shrink-0">
                <div className="flex justify-center gap-4 overflow-x-auto pb-4 px-8 w-full h-full items-center">
                    {hand.map((card, idx) => {
                        return (
                            <button
                                key={idx}
                                onClick={() => handleCardClick(idx)}
                                disabled={battleState.isVictory || battleState.isDefeat}
                                className={`w-32 h-44 border-2 transition-all duration-200 rounded-lg flex flex-col items-center justify-between p-3 relative group shadow-lg shrink-0 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-4
                                    bg-[#1a1a1a] border-[#333] hover:border-blue-500
                                `}
                            >

                                <div className="mt-4 p-2 bg-gray-800 rounded-full">
                                    {card.type === 'Skill' ? <Sparkles className="w-6 h-6 text-yellow-400" /> :
                                        card.type === 'Item' ? <Heart className="w-6 h-6 text-green-400" /> :
                                            <Sword className="w-6 h-6 text-gray-400" />}
                                </div>
                                <div className="text-center w-full">
                                    <div className="text-sm font-bold text-gray-100 truncate w-full">{card.name}</div>
                                    <div className="text-[10px] text-gray-500 mt-1 line-clamp-2 h-8 leading-tight">{card.description}</div>
                                </div>
                                <div className={`text-xs font-bold px-2 py-0.5 rounded w-full text-center flex justify-between items-center ${card.type === 'Skill' ? 'bg-blue-900/30 text-blue-300' :
                                    card.type === 'Item' ? 'bg-green-900/30 text-green-300' :
                                        'bg-gray-800 text-gray-400'
                                    }`}>
                                    <div className="flex items-center gap-1">
                                        {(!card.target_type || card.target_type === 'single_enemy') && <Target className="w-3 h-3" />}
                                        {(card.target_type === 'all_enemies' || card.target_type === 'all_allies') && <Users className="w-3 h-3" />}
                                        {(card.target_type === 'self' || card.target_type === 'single_ally') && <User className="w-3 h-3" />}
                                        <span>{card.type}</span>
                                    </div>
                                    <span className="text-[10px] text-yellow-500 font-mono">AP:{card.ap_cost ?? 1}</span>
                                </div>
                            </button>
                        )
                    })}
                    {hand.length === 0 && !battleState.isVictory && (
                        <div className="flex flex-col items-center justify-center text-gray-500 text-sm italic w-full gap-2">
                            <span>カードを配っています...</span>
                            <button
                                onClick={() => useGameStore.getState().drawCards(5)}
                                className="text-xs border border-gray-700 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                            >
                                カードを引く (Debug)
                            </button>
                        </div>
                    )}
                </div>
            </footer>

            {/* BATTLE RESULT OVERLAY */}
            {
                shouldShowOverlay && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-1000">
                        <div className="text-center space-y-8 p-8 border-y-4 border-double w-full bg-black/40 relative">

                            {/* Review Logs Toggle Button */}
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={() => setIsReviewingLogs(true)}
                                    className="text-xs text-gray-400 hover:text-white border border-gray-600 px-3 py-1 rounded"
                                >
                                    ログを確認する
                                </button>
                            </div>


                            {battleState.isVictory && (
                                <>
                                    <h2 className="text-6xl md:text-8xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-700 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-pulse">
                                        VICTORY
                                    </h2>
                                    <p className="text-yellow-200 font-sans tracking-widest text-lg">強敵を打ち倒した！</p>
                                    <button
                                        onClick={() => {
                                            const urlParams = new URLSearchParams(window.location.search);
                                            const returnUrl = urlParams.get('return_url');
                                            const bType = urlParams.get('type');
                                            if (returnUrl) {
                                                const separator = returnUrl.includes('?') ? '&' : '?';
                                                router.push(`${returnUrl}${separator}battle_result=win${bType ? `&type=${bType}` : ''}`);
                                            } else if (selectedScenario) {
                                                router.push(`/quest/${selectedScenario.id}`);
                                            } else {
                                                router.push(`/inn?battle_result=win${bType ? `&type=${bType}` : ''}`);
                                            }
                                        }}
                                        className="px-12 py-4 bg-gradient-to-r from-yellow-900 to-yellow-700 text-yellow-100 border border-yellow-500 rounded hover:scale-105 transition-transform shadow-[0_0_20px_rgba(234,179,8,0.3)] font-bold text-xl"
                                    >
                                        {selectedScenario ? '次へ進む' : '凱旋する'}
                                    </button>
                                </>
                            )}

                            {!battleState.isVictory && battleState.messages.includes("一行は逃げ出した...") && (
                                <>
                                    <h2 className="text-5xl md:text-7xl font-serif font-bold text-gray-400 drop-shadow-md">
                                        ESCAPED
                                    </h2>
                                    <p className="text-gray-500 font-sans tracking-widest text-lg">戦略的撤退...</p>
                                    <button
                                        onClick={() => {
                                            const urlParams = new URLSearchParams(window.location.search);
                                            const bType = urlParams.get('type');
                                            router.push(`/inn?battle_result=escape${bType ? `&type=${bType}` : ''}`)
                                        }}
                                        className="px-8 py-3 bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                                    >
                                        戦線離脱
                                    </button>
                                </>
                            )}

                            {battleState.isDefeat && (
                                <>
                                    <h2 className="text-6xl md:text-8xl font-serif font-bold text-red-600 drop-shadow-[0_0_25px_rgba(220,38,38,0.8)]">
                                        DEFEATED
                                    </h2>
                                    <p className="text-red-400 font-sans tracking-widest text-lg">意識が遠のいていく...</p>
                                    <button
                                        onClick={() => {
                                            const urlParams = new URLSearchParams(window.location.search);
                                            const bType = urlParams.get('type');
                                            router.push(`/inn?battle_result=lose${bType ? `&type=${bType}` : ''}`)
                                        }}
                                        className="px-12 py-4 bg-red-950/80 text-red-200 border border-red-800 rounded hover:bg-red-900 transition-colors font-bold text-xl"
                                    >
                                        運ばれる
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Log Review Mode: Minimal overlay to return to result */}
            {
                isResultActive && isReviewingLogs && (
                    <div className="fixed bottom-32 left-0 right-0 z-50 flex justify-center pointer-events-none">
                        <button
                            onClick={() => setIsReviewingLogs(false)}
                            className="pointer-events-auto bg-black/80 text-white border border-gray-500 px-6 py-2 rounded-full shadow-lg hover:bg-gray-800 animate-bounce"
                        >
                            結果画面に戻る
                        </button>
                    </div>
                )
            }
        </div>
    );
}
