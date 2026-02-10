'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';
import { Shield, Sword, Sparkles, Heart, Footprints, Settings, Skull, Clock } from 'lucide-react';
import Image from 'next/image';

export default function BattlePage() {
    const router = useRouter();
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
        userProfile
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
        if (!battleState.enemy || hand.length === 0) {
            console.log("[BattlePage] Initializing Battle (Fallback)...");
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

    if (!battleState.enemy) return <div className="p-8 text-white min-h-screen bg-gray-900 flex items-center justify-center">Loading Battle...</div>;

    const enemy = battleState.enemy;

    // Determine if we should show the overlay (based on state and log review toggle)
    const isResultActive = (battleState.isVictory || battleState.isDefeat || (!battleState.isVictory && battleState.messages.includes("一行は逃げ出した...")));
    const shouldShowOverlay = isResultActive && showResultOverlay && !isReviewingLogs;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans relative overflow-hidden flex flex-col">
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
                        {selectedScenario ? `依頼: ${selectedScenario.title}` : `VS ${enemy.name}`}
                    </h1>
                </div>

                {/* Flee Controls Only */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleFlee}
                        className="flex items-center gap-1 px-4 py-1.5 bg-red-900/80 hover:bg-red-800 text-red-200 rounded border border-red-700 transition-colors text-sm"
                    >
                        <Footprints className="w-4 h-4" /> 逃げる
                    </button>
                </div>
            </header>

            {/* MAIN BATTLE AREA */}
            <main className="relative z-10 flex-1 flex flex-col p-4 gap-4 max-w-6xl mx-auto w-full">

                {/* TOP SECTION: Party Icons (Left) vs Enemy (Center/Right) */}
                <div className="flex-1 flex gap-8">

                    {/* LEFT: Party Members (Icons) */}
                    <div className="w-1/4 flex flex-col gap-4">
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-widest border-b border-gray-700 pb-1 mb-2">Party</div>
                        <div className="flex flex-col gap-3">
                            {/* Player (Self) */}
                            <div className="flex items-center gap-3 bg-black/40 p-2 rounded border-l-2 border-blue-500">
                                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-gray-500 relative shrink-0">
                                    <div className="w-full h-full bg-blue-900/50 flex items-center justify-center text-xs">You</div>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold truncate">{userProfile?.name || 'あなた'}</div>
                                    <div className="text-xs text-blue-300">
                                        HP {useGameStore.getState().userProfile?.hp ?? '?'}/{useGameStore.getState().userProfile?.max_hp ?? '?'}
                                    </div>
                                    <div className="text-xs text-blue-300">
                                        HP {useGameStore.getState().userProfile?.hp ?? '?'}/{useGameStore.getState().userProfile?.max_hp ?? '?'}
                                    </div>
                                </div>
                            </div>


                            {/* Equipment (NPC) Members */}
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 border-b border-gray-800 pb-1 mb-2">Living Equipment ({battleState.party.filter(p => p.is_active && p.durability > 0).length})</div>
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

                    {/* CENTER: Enemy & Visuals */}
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        <div className="relative group mb-12 animate-float">
                            <div className={`w-64 h-64 ${battleState.isVictory ? 'opacity-50 grayscale transition-all duration-1000' : ''}`}>
                                <div className="w-full h-full bg-gradient-to-br from-red-900 to-black rounded-lg shadow-[0_0_50px_rgba(220,38,38,0.3)] flex items-center justify-center border-4 border-red-900 transform rotate-3 group-hover:rotate-0 transition-transform">
                                    <Skull className="w-24 h-24 text-red-500/80" />
                                </div>
                            </div>

                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-80 bg-black/80 p-3 rounded border border-red-900 text-center shadow-xl">
                                <h2 className="text-xl font-bold text-red-100 mb-1">{enemy.name} <span className="text-sm text-red-400 font-normal">Lv.{enemy.level}</span></h2>
                                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full bg-red-600 transition-all duration-500 ease-out"
                                        style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                                    />
                                </div>
                                <div className="text-xs text-red-300 mt-1 flex justify-between px-1">
                                    <span>HP: {enemy.hp} / {enemy.maxHp}</span>
                                    <span>Threat: High</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM AREA: Logs Above Deck */}
                <div className="flex flex-col gap-2">
                    {/* Battle Logs - Centered and Same Width as Deck (using max-w-4xl roughly matches deck container if centered) */}
                    <div className="w-full bg-black/70 border border-gray-700 rounded p-2 h-32 overflow-y-auto font-mono text-sm space-y-1 shadow-inner scrollbar-thin px-20 mx-auto">
                        {logs.map((log, i) => (
                            <div key={i} className="animate-fade-in border-b border-gray-800/50 pb-1 last:border-0 text-gray-300">
                                <span className="text-blue-500 mr-2">▶</span>
                                {log}
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>

                {/* Deck / Hand Area */}
                <div className="h-48 pt-4 border-t border-gray-800 bg-black/40 backdrop-blur-sm -mx-4 px-4 flex flex-col justify-center relative">
                    {/* Wait Button (Floating Top Right of Deck Area) */}
                    <div className="absolute top-2 right-4 z-20">
                        <button
                            onClick={handleWait}
                            disabled={battleState.isVictory || battleState.isDefeat || isWaiting}
                            className="flex flex-col items-center justify-center w-16 h-16 bg-gray-800 border border-gray-600 rounded-full hover:bg-gray-700 transition disabled:opacity-50"
                            title="Wait (Skip Turn)"
                        >
                            {isWaiting ? (
                                <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin mb-1"></div>
                            ) : (
                                <Clock className="w-5 h-5 text-gray-400 mb-1" />
                            )}
                            <span className="text-[10px] text-gray-500">WAIT</span>
                        </button>
                    </div>

                    <div className="flex justify-center gap-4 overflow-x-auto pb-2 px-20">
                        {hand.map((card, idx) => {
                            const cooldown = battleState.cooldowns?.[card.id] || 0;
                            const isBlocked = cooldown > 0;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleCardClick(idx)}
                                    disabled={battleState.isVictory || battleState.isDefeat || isBlocked}
                                    className={`w-32 h-44 border-2 transition-all duration-200 rounded-lg flex flex-col items-center justify-between p-3 relative group shadow-lg shrink-0 disabled:opacity-60 disabled:cursor-not-allowed
                                        ${isBlocked ? 'bg-gray-800 border-gray-700 grayscale' : 'bg-[#1a1a1a] border-[#333] hover:border-blue-500 hover:-translate-y-2'}
                                    `}
                                >
                                    {isBlocked && (
                                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 rounded-lg backdrop-blur-[1px]">
                                            <div className="flex flex-col items-center">
                                                <Clock className="w-8 h-8 text-gray-400 mb-1" />
                                                <span className="text-2xl font-bold text-white drop-shadow-md">{cooldown}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cost badge removed */}

                                    <div className="mt-4 p-2 bg-gray-800 rounded-full">
                                        {card.type === 'Skill' ? <Sparkles className="w-6 h-6 text-yellow-400" /> :
                                            card.type === 'Item' ? <Heart className="w-6 h-6 text-green-400" /> :
                                                <Sword className="w-6 h-6 text-gray-400" />}
                                    </div>
                                    <div className="text-center w-full">
                                        <div className="text-sm font-bold text-gray-100 truncate w-full">{card.name}</div>
                                        <div className="text-[10px] text-gray-500 mt-1 line-clamp-2 h-8 leading-tight">{card.description}</div>
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-0.5 rounded w-full text-center ${card.type === 'Skill' ? 'bg-blue-900/30 text-blue-300' :
                                        card.type === 'Item' ? 'bg-green-900/30 text-green-300' :
                                            'bg-gray-800 text-gray-400'
                                        }`}>
                                        {card.type}
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
                </div>
            </main >

            {/* BATTLE RESULT OVERLAY */}
            {shouldShowOverlay && (
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
                                    onClick={() => router.push('/inn?battle_result=win')}
                                    className="px-12 py-4 bg-gradient-to-r from-yellow-900 to-yellow-700 text-yellow-100 border border-yellow-500 rounded hover:scale-105 transition-transform shadow-[0_0_20px_rgba(234,179,8,0.3)] font-bold text-xl"
                                >
                                    凱旋する
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
                                    onClick={() => router.push('/inn?battle_result=escape')}
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
                                    onClick={() => router.push('/inn?battle_result=lose')}
                                    className="px-12 py-4 bg-red-950/80 text-red-200 border border-red-800 rounded hover:bg-red-900 transition-colors font-bold text-xl"
                                >
                                    運ばれる
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Log Review Mode: Minimal overlay to return to result */}
            {isResultActive && isReviewingLogs && (
                <div className="fixed bottom-32 left-0 right-0 z-50 flex justify-center pointer-events-none">
                    <button
                        onClick={() => setIsReviewingLogs(false)}
                        className="pointer-events-auto bg-black/80 text-white border border-gray-500 px-6 py-2 rounded-full shadow-lg hover:bg-gray-800 animate-bounce"
                    >
                        結果画面に戻る
                    </button>
                </div>
            )}
        </div >
    );
}
