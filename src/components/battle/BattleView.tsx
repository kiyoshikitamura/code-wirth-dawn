'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';
import { Shield, Sword, Sparkles, Heart, Footprints, Settings, Skull, Clock, Target, Users, User } from 'lucide-react';
import Image from 'next/image';
import { hasTaunt, StatusEffect } from '@/lib/statusEffects';
import XShareButton from '../shared/XShareButton';
import { Enemy } from '@/types/game';

interface BattleViewProps {
    onBattleEnd: (result: 'win' | 'lose' | 'escape') => void;
}

export default function BattleView({ onBattleEnd }: BattleViewProps) {
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
    const [showTurnOverlay, setShowTurnOverlay] = useState(false);
    const [activeEffect, setActiveEffect] = useState<string | null>(null);

    // Auto-scroll logs
    useEffect(() => {
        if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Show turn overlay
    useEffect(() => {
        if (battleState.turn > 0) {
            setShowTurnOverlay(true);
            const timer = setTimeout(() => setShowTurnOverlay(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [battleState.turn]);

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
        if (battleState.isVictory || battleState.isDefeat) return;
        const card = hand[index];

        setActiveEffect(card.animation_type || 'SLASH');
        setTimeout(() => setActiveEffect(null), 500);

        await attackEnemy(card);
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

    // Determine if it's a boss encounter or bounty hunter
    const isBossEncounter = enemies.some(e => e.spawn_type === 'bounty' || e.hp >= 150 || ['enemy_slime_king', 'enemy_hobgoblin', 'enemy_chimera', 'enemy_lich', 'enemy_bandit_boss', 'enemy_assassin_boss'].includes(e.slug || ''));

    const renderEnemyCard = (enemy: Enemy, isTarget: boolean, isDead: boolean) => (
        <div
            key={enemy.id}
            className={`relative group transition-all duration-300 shrink-0 ${isDead ? 'opacity-50 grayscale scale-90' : 'hover:scale-105 active:scale-95 cursor-pointer'} ${isTarget ? 'scale-110 z-20' : 'scale-90 z-10 opacity-70'}`}
            onClick={() => !isDead && setTarget(enemy.id)}
        >
            {/* Active Target Indicator */}
            {isTarget && !isDead && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-900/80 text-red-400 text-[10px] px-3 py-1 rounded border border-red-500/50 font-bold tracking-widest animate-bounce z-30 flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    <Skull size={10} /> TARGET
                </div>
            )}

            {/* WANTED Bounty Hunter Effect */}
            {enemy.spawn_type === 'bounty' && !isDead && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500 text-red-500 text-[8px] font-black px-1.5 py-0.5 whitespace-nowrap z-20 animate-glitch skew-x-[-10deg]">
                    BOUNTY HUNTER
                </div>
            )}

            {/* Card Model */}
            <div className={`w-32 h-44 sm:w-36 sm:h-48 relative transition-all duration-500`}>
                <div className={`w-full h-full rounded-lg shadow-2xl flex flex-col border-2 overflow-hidden
                    ${isTarget ? 'border-red-500 bg-slate-900' : 'border-slate-700 bg-slate-900'}
                `}>
                    <div className="h-3/4 bg-slate-800 relative overflow-hidden">
                        {enemy.image_url ? (
                            <img src={enemy.image_url} alt={enemy.name} className={`w-full h-full object-cover ${isDead ? 'opacity-50 grayscale' : ''}`} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700"><Skull size={48} /></div>
                        )}
                    </div>

                    <div className="h-1/4 bg-slate-950 flex flex-col justify-center px-2 py-1 relative">
                        <div className={`text-[10px] font-bold truncate ${isDead ? 'text-gray-500 line-through' : 'text-slate-200'}`}>
                            {enemy.name} <span className="text-[8px] text-amber-500 font-normal">Lv.{enemy.level}</span>
                        </div>
                        {!isDead && (
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1 gap-1 flex">
                                <div
                                    className="h-full bg-red-600 transition-all duration-300"
                                    style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Animations layer */}
                {isTarget && activeEffect && (
                    <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
                        {activeEffect === 'SLASH' && (
                            <div className="w-full h-[2px] bg-red-400 rotate-45 shadow-[0_0_20px_rgba(248,113,113,1)] animate-in slide-in-from-top-12 duration-300" />
                        )}
                        {activeEffect === 'WIND' && (
                            <div className="block">
                                <div className="w-20 h-[1px] bg-sky-200 shadow-[0_0_15px_rgba(186,230,253,1)] animate-in slide-in-from-right-16 fade-in duration-300 mb-2" />
                                <div className="w-16 h-[1px] bg-sky-300 shadow-[0_0_15px_rgba(186,230,253,1)] animate-in slide-in-from-left-16 fade-in duration-300" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={`h-full w-full font-sans relative flex flex-col overflow-hidden text-slate-200 justify-between pb-4 pt-10 transition-colors duration-1000 ${isBossEncounter ? 'bg-red-950/20 shadow-[inset_0_0_100px_rgba(153,27,27,0.5)] animate-pulse-slow' : 'bg-slate-900'}`}>
            
            {isBossEncounter && (
                <div className="absolute top-0 w-full text-center py-1 bg-gradient-to-r from-transparent via-red-900/80 to-transparent z-50">
                    <span className="text-red-200 text-[10px] md:text-xs font-bold tracking-widest uppercase animate-pulse">WARNING: DIVINE THREAT TIER</span>
                </div>
            )}
            
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542261226-9fcfd06ec4da?auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
            </div>

            {/* Turn Overlay */}
            {showTurnOverlay && (
                <div className="absolute inset-x-0 top-1/4 flex items-center justify-center z-50 pointer-events-none animate-in fade-in zoom-in duration-500">
                    <div className="bg-red-950/80 text-red-500 px-12 py-4 border-y border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center gap-4">
                        <span className="w-12 h-[1px] bg-red-500/50" />
                        <span className="font-serif text-4xl font-bold tracking-[0.3em] italic">TURN {battleState.turn}</span>
                        <span className="w-12 h-[1px] bg-red-500/50" />
                    </div>
                </div>
            )}

            {/* Enemies Layout Container */}
            <div className="w-full relative z-10 bg-gradient-to-b from-transparent to-slate-950/80 pt-4 pb-2">
                <div className="w-full min-h-[160px] p-2 flex flex-col justify-end">
                    
                    {/* Back Row (Enemies 3-5) */}
                    {enemies.length > 3 && (
                        <div className="flex justify-center gap-2 mb-[-10px] z-0 opacity-90 scale-90">
                            {enemies.slice(3, 6).map((enemy) => {
                                const isTarget = target?.id === enemy.id;
                                const isDead = enemy.hp <= 0;
                                return renderEnemyCard(enemy, isTarget, isDead);
                            })}
                        </div>
                    )}

                    {/* Front Row (Enemies 0-2) */}
                    <div className="flex justify-center gap-3 z-10 w-full px-2">
                        {enemies.slice(0, 3).map((enemy) => {
                            const isTarget = target?.id === enemy.id;
                            const isDead = enemy.hp <= 0;
                            return renderEnemyCard(enemy, isTarget, isDead);
                        })}
                    </div>
                </div>
            </div>

            {/* BATTLE LOG (5 lines) */}
            <div className="relative z-20 px-4 -mt-4 w-full">
                <div className="bg-slate-950/80 border-y border-slate-800 p-2 text-[11px] font-mono leading-relaxed h-[6.5rem] overflow-hidden flex flex-col justify-end backdrop-blur-sm">
                    {logs.slice(-5).map((log, idx) => {
                        const isLatest = idx === Math.min(logs.length, 5) - 1;
                        return (
                            <div key={idx} className={`flex gap-2 ${isLatest ? 'text-slate-200 font-bold animate-[pulse_2s_ease-in-out_infinite]' : 'text-slate-500'}`}>
                                <span className={`shrink-0 ${isLatest ? 'text-amber-500' : 'text-slate-700'}`}>▸</span>
                                <span className="break-all">{log}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BOTTOM DECK & COMMANDS AREA */}
            <div className="flex-1 w-full relative z-30 mt-2">

                {/* Fixed Action Button */}
                <div className="absolute top-0 right-4 z-40 flex flex-col gap-2">
                    <button
                        onClick={handleEndTurn}
                        disabled={battleState.isVictory || battleState.isDefeat}
                        className="bg-slate-800/80 border border-slate-700 text-slate-400 rounded-full w-12 h-12 flex items-center justify-center shadow-lg active:scale-95 transition-all outline-none"
                    >
                        <Clock size={20} />
                    </button>
                    <button
                        onClick={handleWait}
                        disabled={battleState.isVictory || battleState.isDefeat || isWaiting}
                        className="bg-slate-800/80 border border-slate-700 text-slate-400 rounded-full w-12 h-12 flex items-center justify-center shadow-lg active:scale-95 transition-all outline-none"
                    >
                        <Sword size={20} />
                    </button>
                </div>

                {/* Hand Cards (Fan Layout) */}
                <div className="absolute bottom-0 inset-x-0 h-48 flex justify-center items-end pb-4 pt-10 px-2 overflow-visible">
                    {hand.map((card, idx) => {
                        const centerIndex = (hand.length - 1) / 2;
                        const offset = idx - centerIndex;
                        const rotation = offset * 8; // degrees
                        const translateY = Math.abs(offset) * 12; // pixels to push down edges
                        const apCost = card.ap_cost ?? 1;
                        const isActivePlayable = battleState.current_ap >= apCost;

                        const getCostStyles = (ap: number) => {
                            if (ap >= 4) return 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] bg-gradient-to-t from-amber-950 to-slate-900 animate-pulse';
                            if (ap === 3) return 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] bg-gradient-to-t from-blue-950 to-slate-900';
                            return 'border-slate-600 bg-slate-800';
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleCardClick(idx)}
                                disabled={battleState.isVictory || battleState.isDefeat || !isActivePlayable}
                                className={`relative group origin-bottom transition-all duration-300 w-24 sm:w-28 flex-shrink-0 -ml-10 sm:-ml-8 first:ml-0
                                    ${!isActivePlayable ? 'opacity-40 grayscale pointer-events-none' : 'hover:-translate-y-8 hover:scale-105'}
                                 `}
                                style={{
                                    transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                                    zIndex: idx
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.zIndex = '50'}
                                onMouseLeave={(e) => e.currentTarget.style.zIndex = String(idx)}
                            >
                                <div className={`h-36 sm:h-40 border-2 rounded-xl flex flex-col overflow-hidden pointer-events-none transition-all ${getCostStyles(apCost)} group-hover:border-amber-400 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.8)]`}>
                                    <div className="h-1/2 bg-slate-900/50 border-b border-slate-700 relative backdrop-blur-sm">
                                        {card.image_url ? (
                                            <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-amber-500/20">
                                                {card.type === 'Skill' ? <Sparkles size={32} /> : card.type === 'Item' ? <Heart size={32} /> : <Sword size={32} />}
                                            </div>
                                        )}
                                        <div className="absolute top-1 left-1 bg-black/80 rounded-full w-6 h-6 flex items-center justify-center font-bold text-white border border-slate-700 shadow-md">
                                            {apCost}
                                        </div>
                                    </div>

                                    <div className="h-1/2 bg-slate-950/80 backdrop-blur-sm p-1.5 flex flex-col justify-between">
                                        <div className="text-[10px] sm:text-xs font-bold leading-tight line-clamp-2 text-slate-200">
                                            {card.name}
                                        </div>
                                        <div className="text-[8px] sm:text-[9px] text-slate-500 line-clamp-2">
                                            {card.description}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

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

                                    {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('type') === 'bounty_hunter' && (
                                        <div className="max-w-xs mx-auto animate-bounce mt-4">
                                            <XShareButton
                                                text={`「賞金首として狙われたが、襲撃してきた賞金稼ぎを返り討ちにしてやったぞ。私の首は貴様らには重すぎるようだ。」 #Wirth_Dawn #賞金首の意地`}
                                                variant="large"
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={() => {
                                            const urlParams = new URLSearchParams(window.location.search);
                                            const returnUrl = urlParams.get('return_url');
                                            const bType = urlParams.get('type');
                                            if (returnUrl) {
                                                const separator = returnUrl.includes('?') ? '&' : '?';
                                                router.push(`${returnUrl}${separator}battle_result=win${bType ? `&type=${bType}` : ''}`);
                                            } else if (selectedScenario) {
                                                onBattleEnd('win');
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
                                            onBattleEnd('escape');
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

                                            // Task3: 賞金稼ぎペナルティ（敗北でゴールド半減）
                                            if (bType === 'bounty_hunter') {
                                                const currentGold = useGameStore.getState().userProfile?.gold || 0;
                                                const penalty = Math.ceil(currentGold / 2); // 半分没収
                                                if (penalty > 0) {
                                                    useGameStore.getState().spendGold(penalty);
                                                    alert(`賞金稼ぎに身包みを剥がされた...\n所持金の半分（${penalty}G）を失った！`);
                                                }
                                            }

                                            onBattleEnd('lose');
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
        </div >
    );
}
